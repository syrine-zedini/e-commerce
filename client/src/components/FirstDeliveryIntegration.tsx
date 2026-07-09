import React, { useEffect, useState } from 'react';
import { useFirstDelivery } from '@/hooks/useFirstDelivery';
import { Truck, MapPin, Barcode, Link as LinkIcon, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface FirstDeliveryIntegrationProps {
  orderId: string;
  initialBarCode?: string | null;
  initialStatus?: string | null;
  onOrderCreated?: (barCode: string, link: string) => void;
}

export const FirstDeliveryIntegration: React.FC<FirstDeliveryIntegrationProps> = ({
  orderId,
  initialBarCode,
  initialStatus,
  onOrderCreated,
}) => {
  const { localities, loading, fetchLocalities, createOrder, getStatus, startPollingOrder, stopPollingOrder } =
    useFirstDelivery();
  const [selectedLocality, setSelectedLocality] = useState<number | null>(null);
  const [localitySearch, setLocalitySearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(initialStatus || null);
  const [barCode, setBarCode] = useState<string | null>(initialBarCode || null);
  const [printLink, setPrintLink] = useState<string | null>(null);

  // Fetch localities on mount
  useEffect(() => {
    fetchLocalities();
  }, [fetchLocalities]);

  // Commande déjà créée sur First Delivery lors d'une session précédente
  // (barcode connu dès l'ouverture) : on rafraîchit le statut tout de suite
  // (ce qui met aussi à jour la base, voir server/routes/firstDelivery.ts)
  // puis on reprend le suivi en direct pour la durée d'ouverture du modal.
  useEffect(() => {
    if (!initialBarCode) return;
    getStatus(initialBarCode).then((status) => {
      if (status) setOrderStatus(status.state);
    });
    startPollingOrder(initialBarCode);
    return () => stopPollingOrder(initialBarCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBarCode]);

  // Stop polling (started either above or from handleCreateOrder below) when
  // the modal closes / this component unmounts, so intervals don't leak.
  useEffect(() => {
    if (!barCode) return;
    return () => stopPollingOrder(barCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barCode]);

  // Listen for real-time status updates
  useEffect(() => {
    const handleStatusUpdate = (event: any) => {
      const { barCode: updatedBarCode, status } = event.detail;
      if (updatedBarCode === barCode) {
        setOrderStatus(status);
      }
    };

    window.addEventListener('firstDeliveryStatusUpdate', handleStatusUpdate);
    return () => window.removeEventListener('firstDeliveryStatusUpdate', handleStatusUpdate);
  }, [barCode]);

  const handleSelectLocality = (locality: any) => {
    setSelectedLocality(locality.locality_id);
    setLocalitySearch(`${locality.locality_name} (${locality.governorate_name})`);
    setIsDropdownOpen(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalitySearch(e.target.value);
    setSelectedLocality(null);
    setIsDropdownOpen(true);
  };

  const filteredLocalities = localities.filter((locality) => {
    const searchLower = localitySearch.toLowerCase();
    return (
      locality.locality_name.toLowerCase().includes(searchLower) ||
      locality.governorate_name.toLowerCase().includes(searchLower)
    );
  });

  const handleCloseDropdown = () => {
    setIsDropdownOpen(false);
    if (selectedLocality) {
      const selected = localities.find(l => l.locality_id === selectedLocality);
      if (selected) {
        setLocalitySearch(`${selected.locality_name} (${selected.governorate_name})`);
        return;
      }
    }
    setLocalitySearch('');
  };

  const handleCreateOrder = async () => {
    if (!selectedLocality) {
      toast.error('Veuillez sélectionner une localité');
      return;
    }

    try {
      setIsCreating(true);
      const result = await createOrder(orderId, selectedLocality);
      
      setBarCode(result.barCode);
      setPrintLink(result.link);
      setOrderStatus('En attente');

      // Start polling for real-time updates
      startPollingOrder(result.barCode);

      // Callback
      if (onOrderCreated) {
        onOrderCreated(result.barCode, result.link);
      }

      toast.success('✅ Commande créée sur First Delivery!');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Erreur lors de la création de la commande');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'En attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'En transit':
        return 'bg-blue-100 text-blue-800';
      case 'Livré':
        return 'bg-green-100 text-green-800';
      case 'Annulé':
        return 'bg-red-100 text-red-800';
      case 'Retourné':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'En attente':
        return '⏳';
      case 'En transit':
        return '🚚';
      case 'Livré':
        return '✅';
      case 'Annulé':
        return '❌';
      case 'Retourné':
        return '↩️';
      default:
        return '📦';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Truck className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Intégration First Delivery</h3>
      </div>

      {!barCode ? (
        <div className="space-y-4">
          {/* Locality Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Sélectionner une localité
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Choisir une localité..."
                value={localitySearch}
                onChange={handleSearchChange}
                onFocus={() => setIsDropdownOpen(true)}
                disabled={loading || isCreating}
                className="w-full pl-3 pr-9 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm bg-white"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={handleCloseDropdown}
                  />
                  <div className="absolute left-0 right-0 z-40 bottom-full mb-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg py-1 text-sm text-gray-700">
                    <div className="sticky top-0 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 border-b border-blue-100">
                      {filteredLocalities.length} résultat(s) obtenu(s)
                    </div>
                    {filteredLocalities.length === 0 ? (
                      <div className="px-3 py-2 text-gray-400 italic">Aucune localité trouvée</div>
                    ) : (
                      filteredLocalities.map((locality) => (
                        <button
                          key={locality.locality_id}
                          type="button"
                          onClick={() => handleSelectLocality(locality)}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-b border-gray-50 last:border-b-0"
                        >
                          <span className="font-medium text-gray-900">{locality.locality_name}</span>
                          <span className="text-gray-500 text-xs ml-2">({locality.governorate_name})</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Create Order Button */}
          <button
            onClick={handleCreateOrder}
            disabled={!selectedLocality || isCreating || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition"
          >
            {isCreating ? '⏳ Création en cours...' : '📦 Créer la Commande First Delivery'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Order Created - Show Details */}
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h4 className="font-semibold text-green-900 mb-3">✅ Commande Créée</h4>

            {/* Bar Code */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Barcode className="w-4 h-4 inline mr-2" />
                Code à Barre
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded font-mono text-sm">
                  {barCode}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(barCode);
                    toast.success('Code copié!');
                  }}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  📋
                </button>
              </div>
            </div>

            {/* Print Link */}
            {printLink && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <LinkIcon className="w-4 h-4 inline mr-2" />
                  Lien d'Impression
                </label>
                <a
                  href={printLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-sm"
                >
                  🖨️ Imprimer l'Étiquette
                </a>
              </div>
            )}

            {/* Real-time Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut en Temps Réel
              </label>
              <div
                className={`inline-block px-4 py-2 rounded-full font-semibold text-sm ${getStatusColor(
                  orderStatus
                )}`}
              >
                {getStatusIcon(orderStatus)} {orderStatus || 'En attente...'}
              </div>
            </div>
          </div>

          {/* Status Animation */}
          {orderStatus && orderStatus !== 'Livré' && orderStatus !== 'Annulé' && (
            <div className="flex items-center justify-center gap-2 text-blue-600 animate-pulse">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <span className="text-sm font-medium">Suivi en temps réel...</span>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-900">
        <p className="font-semibold mb-1">ℹ️ À propos de First Delivery</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Livraison rapide et fiable</li>
          <li>Suivi en temps réel de votre commande</li>
          <li>Support client 24/7</li>
        </ul>
      </div>
    </div>
  );
};
