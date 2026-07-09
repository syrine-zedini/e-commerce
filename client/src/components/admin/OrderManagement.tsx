import React, { useEffect, useState, useMemo } from 'react';
import { Search, Eye, CheckCircle, Clock, XCircle, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Save, FileText } from 'lucide-react';
import { apiGet, apiPut, apiDelete } from '@/lib/api';
import { addToDeletedOrders } from './DeletedOrdersManagement';
import { FirstDeliveryIntegration } from '@/components/FirstDeliveryIntegration';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { convertImageUrl, onImgError } from '@/lib/imageUtils';
import { TUNISIA_DATA as tunisiaData, findProvinceForCity } from '@/lib/tunisiaData';
import { getStatutLabel, getStatutColor as getstatutColor } from '@shared/orderStatus';

interface Order {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  adresse: string;
  province?: string;
  ville: string;
  code_postal: string;
  mot_de_passe: string;
  paiement_mode: string;
  frais_livraison: number;
  total: number;
  produits: any;
  created_at: string;
  statut: string;
  phone: string;
  first_delivery_barcode?: string | null;
  first_delivery_status?: string | null;
}

interface OrderManagementProps {
  initialOrderId?: string | null;
}

const ORDERS_PER_PAGE = 10;

export const OrderManagement: React.FC<OrderManagementProps> = ({ initialOrderId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setstatutFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [selectedProdIds, setSelectedProdIds] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nom: '',
    prenom: '',
    phone: '',
    adresse: '',
    province: '',
    ville: '',
    code_postal: '',
    produits: [] as any[],
  });

  useEffect(() => {
    const fetchAllProducts = async () => {
      const PAGE_SIZE = 1000;
      let allData: any[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        try {
          const data = await apiGet(
            `/api/products?activeOnly=1&fields=id,name,original_price,discounted_price,image_path,form,stock_status&sort=name&order=asc&limit=${PAGE_SIZE}&offset=${from}`
          );

          if (data && data.length > 0) {
            allData = [...allData, ...data];
            from += PAGE_SIZE;
            hasMore = data.length === PAGE_SIZE;
          } else {
            hasMore = false;
          }
        } catch (error) {
          console.error('Erreur chargement produits:', error);
          break;
        }
      }

      setAllProducts(allData);
    };
    fetchAllProducts();
  }, []);

  // Map name → image_path for quick lookup in order items (case-insensitive)
  const productImageMap = useMemo(() => {
    const map = new Map<string, string>();
    allProducts.forEach(p => {
      if (p.name && p.image_path) map.set(p.name.toLowerCase().trim(), p.image_path);
    });
    return map;
  }, [allProducts]);

  const getOrderProductImage = (rawName: string): string | undefined => {
    if (!rawName) return undefined;
    // Remove embedded quantities: "× 2", "x 1"
    const cleaned = rawName.replace(/\s*[×x]\s*\d+/gi, '').trim();
    // Try exact match
    let img = productImageMap.get(cleaned.toLowerCase());
    if (img) return img;
    // Split by " + " to handle combined product names
    const parts = cleaned.split(/\s+\+\s+/);
    for (const part of parts) {
      const key = part.trim().toLowerCase();
      img = productImageMap.get(key);
      if (img) return img;
      // Prefix match: first 25 characters
      if (key.length >= 10) {
        const prefix = key.substring(0, 25);
        for (const [k, v] of Array.from(productImageMap.entries())) {
          if (k.startsWith(prefix)) return v;
        }
      }
    }
    return undefined;
  };

  const calculateEditTotals = () => {
    const productsList = isEditing ? editForm.produits : (selectedOrder?.produits || []);

    const sousTotal = productsList.reduce((sum: number, item: any) => {
      const price = Number(item.discounted_price || item.price || item.original_price || 0);
      return sum + price * Number(item.quantity);
    }, 0);

    const fraisLivraison = productsList.length === 0
      ? 0
      : sousTotal >= 69
      ? 0
      : 7.2;

    const total = sousTotal + fraisLivraison;

    return {
      sousTotal: Number(sousTotal.toFixed(2)),
      fraisLivraison: Number(fraisLivraison.toFixed(1)),
      total: Number(total.toFixed(2))
    };
  };

  const currentTotals = selectedOrder ? calculateEditTotals() : { sousTotal: 0, fraisLivraison: 0, total: 0 };

  const startEditing = () => {
    if (!selectedOrder) return;
    const initialProvince = selectedOrder.province || findProvinceForCity(selectedOrder.ville || '');
    setEditForm({
      nom: selectedOrder.nom || '',
      prenom: selectedOrder.prenom || '',
      phone: selectedOrder.phone || '',
      adresse: selectedOrder.adresse || '',
      province: initialProvince,
      ville: selectedOrder.ville || '',
      code_postal: selectedOrder.code_postal || '',
      produits: selectedOrder.produits ? JSON.parse(JSON.stringify(selectedOrder.produits)) : [],
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedOrder) return;
    try {
      const totals = calculateEditTotals();
      try {
        await apiPut(`/api/commandes/${selectedOrder.id}`, {
          nom: editForm.nom,
          prenom: editForm.prenom,
          phone: editForm.phone,
          adresse: editForm.adresse,
          province: editForm.province,
          ville: editForm.ville,
          code_postal: editForm.code_postal,
          produits: editForm.produits,
          frais_livraison: totals.fraisLivraison,
          total: totals.total,
        });
      } catch (error) {
        toast.error('❌ Impossible de mettre à jour les informations');
        console.error(error);
        return;
      }

      toast.success('💾 Informations mises à jour !');
      setIsEditing(false);
      
      const updatedOrder = {
        ...selectedOrder,
        ...editForm,
        frais_livraison: totals.fraisLivraison,
        total: totals.total,
      };
      setSelectedOrder(updatedOrder);
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
    } catch (err) {
      toast.error("❌ Une erreur s'est produite lors de l'enregistrement");
    }
  };

  const toggleProductSelection = (id: string | number) => {
    setSelectedProdIds(prev =>
      prev.includes(String(id))
        ? prev.filter(i => i !== String(id))
        : [...prev, String(id)]
    );
  };

  const addSelectedProducts = () => {
    if (selectedProdIds.length === 0) return;
    setEditForm(prev => {
      let newProds = [...prev.produits];
      selectedProdIds.forEach(id => {
        const prod = allProducts.find(p => String(p.id) === String(id));
        if (prod) {
          const existing = newProds.find(p => String(p.id) === String(id));
          if (existing) {
            newProds = newProds.map(p =>
              String(p.id) === String(id) ? { ...p, quantity: p.quantity + 1 } : p
            );
          } else {
            newProds.push({
              id: String(prod.id),
              name: prod.name,
              original_price: prod.original_price || 0,
              discounted_price: prod.discounted_price || prod.original_price || 0,
              price: prod.discounted_price || prod.original_price || 0,
              image_path: prod.image_path || '',
              quantity: 1
            });
          }
        }
      });
      return { ...prev, produits: newProds };
    });
    setSelectedProdIds([]);
    setProductSearch('');
    setIsProductDropdownOpen(false);
    toast.success('📦 Produits ajoutés à la commande !');
  };

  const updateProductQuantity = (productId: string, delta: number) => {
    if (delta > 0) {
      const prod = allProducts.find(ap => String(ap.id) === String(productId));
      const stockVal = prod?.form != null && prod.form !== "" ? Number(prod.form) : null;
      const maxOrderable = stockVal !== null && !isNaN(stockVal) ? stockVal - 3 : null;
      const current = editForm.produits.find(p => String(p.id) === String(productId));
      const currentQty = current?.quantity ?? 0;
      if (maxOrderable !== null && currentQty + delta > maxOrderable) {
        toast.error(
          maxOrderable > 0
            ? `Stock insuffisant ! Maximum ${maxOrderable} unité${maxOrderable > 1 ? 's' : ''} commandable${maxOrderable > 1 ? 's' : ''}.`
            : `Stock insuffisant pour ce produit.`,
          { style: { borderRadius: '10px', background: '#333', color: '#fff' } }
        );
        return;
      }
    }
    setEditForm(prev => {
      const updated = prev.produits.map(p => {
        if (String(p.id) === String(productId)) {
          const newQty = Math.max(0, p.quantity + delta);
          return { ...p, quantity: newQty };
        }
        return p;
      }).filter(p => p.quantity > 0);
      return { ...prev, produits: updated };
    });
  };

  const generateInvoice = async (order: Order) => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    // ── Logo ──
    try {
      const res = await fetch('/figmaAssets/logo YJPARA.jpeg');
      const blob = await res.blob();
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = () => {
          const base64 = reader.result as string;
          doc.addImage(base64, 'JPEG', 14, 10, 38, 18);
          resolve();
        };
        reader.readAsDataURL(blob);
      });
    } catch {
      // logo non disponible, on continue sans
    }

    // ── En-tête ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(29, 142, 230);
    doc.text('FACTURE', pageW - 14, 20, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Date : ${new Date(order.created_at).toLocaleDateString('fr-FR')}`, pageW - 14, 27, { align: 'right' });
    doc.text(`N° commande : ${order.id}`, pageW - 14, 32, { align: 'right' });

    // ── Ligne séparatrice ──
    doc.setDrawColor(29, 142, 230);
    doc.setLineWidth(0.5);
    doc.line(14, 34, pageW - 14, 34);

    // ── Infos client ──
    let y = 42;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40);
    doc.text('Informations client', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.text(`Nom : ${order.nom || ''} ${order.prenom || ''}`, 14, y); y += 5;
    doc.text(`Téléphone : ${order.phone || '—'}`, 14, y); y += 5;
    doc.text(`Adresse : ${order.adresse || '—'}`, 14, y); y += 5;
    doc.text(`Ville : ${order.ville || '—'}${order.code_postal ? ', ' + order.code_postal : ''}`, 14, y); y += 5;
    if (order.email) { doc.text(`Email : ${order.email}`, 14, y); y += 5; }

    // ── Statut ──
    const statutLabel = getStatutLabel(order.statut);
    doc.text(`Statut : ${statutLabel}`, 14, y); y += 5;
    doc.text(`Mode de paiement : ${order.paiement_mode || '—'}`, 14, y); y += 10;

    // ── Tableau produits ──
    const produits = order.produits || [];
    const rows = produits.map((p: any) => {
      const priceTTC = Number(p.discounted_price || p.price || p.original_price || 0);
      const tvaRate = p.tva ? Number(p.tva) : 0;
      const tvaCoeff = tvaRate / (100 + tvaRate);
      const tvaUnit = tvaRate > 0 ? priceTTC * tvaCoeff : 0;
      const priceHT = priceTTC - tvaUnit;
      const qty = Number(p.quantity || 1);
      return [
        p.name,
        qty,
        `${priceHT.toFixed(3)} TND`,
        `${tvaRate}% - ${tvaUnit.toFixed(3)} TND`,
        `${priceTTC.toFixed(3)} TND`,
        `${(priceTTC * qty).toFixed(3)} TND`,
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['Produit', 'Qte', 'Prix HT', 'TVA (taux - montant)', 'Prix TTC', 'Total TTC']],
      body: rows,
      headStyles: { fillColor: [29, 142, 230], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: 50 },
      alternateRowStyles: { fillColor: [240, 247, 255] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 12, halign: 'center' },
        2: { cellWidth: 26, halign: 'right' },
        3: { cellWidth: 26, halign: 'right' },
        4: { cellWidth: 26, halign: 'right' },
        5: { cellWidth: 26, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
      styles: { overflow: 'linebreak' },
    });

    // ── Totaux ──
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    const sousTotalTTC = produits.reduce((sum: number, p: any) => {
      const price = Number(p.discounted_price || p.price || p.original_price || 0);
      return sum + price * Number(p.quantity || 1);
    }, 0);
    const totalTVA = produits.reduce((sum: number, p: any) => {
      const priceTTC = Number(p.discounted_price || p.price || p.original_price || 0);
      const qty = Number(p.quantity || 1);
      const tvaRate = p.tva ? Number(p.tva) : 0;
      const tvaCoeff = tvaRate / (100 + tvaRate);
      return sum + (tvaRate > 0 ? priceTTC * qty * tvaCoeff : 0);
    }, 0);
    const sousTotalHT = sousTotalTTC - totalTVA;
    const frais = Number(order.frais_livraison || 0);
    const total = Number(order.total || sousTotalTTC + frais);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    doc.text(`Total HT : ${sousTotalHT.toFixed(3)} TND`, pageW - 14, finalY, { align: 'right' });
    doc.text(`TVA : ${totalTVA.toFixed(3)} TND`, pageW - 14, finalY + 6, { align: 'right' });
    doc.text(`Frais de livraison : ${frais.toFixed(3)} TND`, pageW - 14, finalY + 12, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(29, 142, 230);
    doc.text(`Total TTC : ${total.toFixed(3)} TND`, pageW - 14, finalY + 21, { align: 'right' });

    // ── Pied de page ──
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('YJ PARA — Merci pour votre confiance !', pageW / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

    doc.save(`facture-${String(order.id).slice(0, 8)}.pdf`);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/commandes');
      setOrders(data || []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    if (initialOrderId && orders.length > 0) {
      const order = orders.find(o => o.id === initialOrderId);
      if (order) {
        setSelectedOrder(order);
        setSearchTerm(String(order.id));
      }
    }
  }, [initialOrderId, orders]);

  const filteredOrders = orders.filter(order => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      String(order.id).toLowerCase().includes(search) ||
      (order.nom + ' ' + order.prenom).toLowerCase().includes(search) ||
      (order.email || '').toLowerCase().includes(search);
    const matchesstatut = !statutFilter || order.statut === statutFilter;
    return matchesSearch && matchesstatut;
  });

  // Reset to page 1 when filters change
  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, statutFilter]);

  const totalOrderPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  const goToOrderPage = (page: number) => {
    if (page < 1 || page > totalOrderPages) return;
    setCurrentPage(page);
  };

  const getOrderPageNumbers = (): (number | '...')[] => {
    if (totalOrderPages <= 7) return Array.from({ length: totalOrderPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalOrderPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalOrderPages - 2) pages.push('...');
    pages.push(totalOrderPages);
    return pages;
  };

  // ── Status helpers ──
  const getstatutIcon = (statut: string) => {
    switch (statut) {
      case 'pending':             return <Clock className="w-4 h-4" />;
      case 'preconfirmed':        return <CheckCircle className="w-4 h-4" />;
      case 'confirmed':           return <CheckCircle className="w-4 h-4" />;
      case 'en_cours':            return <Clock className="w-4 h-4" />;
      case 'au_magasin':          return <Clock className="w-4 h-4" />;
      case 'retour_expediteur':   return <XCircle className="w-4 h-4" />;
      case 'retour_client':       return <XCircle className="w-4 h-4" />;
      case 'retour_depot':        return <XCircle className="w-4 h-4" />;
      case 'delivered':           return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':           return <XCircle className="w-4 h-4" />;
      default:                    return <Clock className="w-4 h-4" />;
    }
  };

  // ── Soft-delete (moves to trash) ──
  const handleDeleteOrder = (orderId: string) => {
    const orderToDelete = orders.find((o) => o.id === orderId);
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Supprimer cette commande ?</p>
          <p className="text-xs text-gray-500">Elle sera placée dans la corbeille et pourra être restaurée.</p>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Annuler
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  // Save to trash (localStorage) before deleting
                  if (orderToDelete) {
                    addToDeletedOrders(orderToDelete);
                  }
                  try {
                    await apiDelete(`/api/commandes/${orderId}`);
                  } catch (error) {
                    toast.error('❌ Impossible de supprimer la commande');
                    return;
                  }
                  toast.success('🗑️ Commande déplacée dans la corbeille !');
                  fetchOrders();
                } catch (err) {
                  toast.error("❌ Une erreur inattendue s'est produite");
                }
              }}
              className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md"
            >
              Supprimer
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  // ── Status update ──
  const handlestatutUpdate = async (orderId: string, newstatut: string) => {
    try {
      const currentOrder = orders.find(o => o.id === orderId);
      const oldStatut = currentOrder?.statut || '';

      let updatedOrder;
      try {
        updatedOrder = await apiPut(`/api/commandes/${orderId}`, { statut: newstatut });
      } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du statut:', error);
        return;
      }

      fetchOrders();

      try {
        await axios.post('/send-status-change-email', {
          order: updatedOrder,
          oldStatut,
          newStatut: newstatut,
        });
        toast.success('📧 Notification admin envoyée !');
      } catch (emailError: any) {
        // Non-blocking: the status update itself already succeeded above;
        // failing to send the admin notification email shouldn't surface
        // as a user-facing error.
        console.error('❌ Erreur notification admin:', emailError);
      }

    } catch (err) {
      toast.error("❌ Une erreur inattendue s'est produite");
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Gestion Des Commandes</h1>
        <div className="text-sm text-gray-500">
          {filteredOrders.length} Commande{filteredOrders.length > 1 ? 's' : ''}
          {totalOrderPages > 1 && ` · Page ${currentPage}/${totalOrderPages}`}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher commandes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={statutFilter}
              onChange={(e) => setstatutFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous</option>
              <option value="pending">En attente</option>
              <option value="preconfirmed">Pré-confirmée</option>
              <option value="confirmed">Confirmée</option>
              <option value="en_cours">En cours de livraison</option>
              <option value="au_magasin">Au magasin</option>
              <option value="retour_expediteur">Retour expéditeur</option>
              <option value="retour_client">Retour client/agence</option>
              <option value="retour_depot">Retour dépôt</option>
              <option value="delivered">Livrée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-sm text-gray-500">Chargement des commandes...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">Aucune commande trouvée.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {paginatedOrders.map((order) => {
              const statusLabel = getStatutLabel(order.statut);

              const isAdmin = user?.role === 'admin' || user?.role === 'admin_commercial';
              const isPending = order.statut === 'pending';
              const isPreconfirmed = order.statut === 'preconfirmed';

              return (
                <article key={order.id} className="p-4 transition-colors hover:bg-gray-50 sm:p-5">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.25fr)_minmax(120px,0.45fr)_minmax(150px,0.55fr)_minmax(120px,0.45fr)_minmax(180px,0.7fr)] lg:items-start">

                    {/* ARTICLES */}
                    <div className="min-w-0">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 lg:hidden">Articles</p>
                      {order.produits && order.produits.length > 0 ? (
                        <ul className="space-y-2 text-sm text-gray-700">
                          {order.produits.map((product: any, index: number) => (
                            <li key={index} className="flex min-w-0 items-start gap-2">
                            {(() => {
                              const imgUrl = getOrderProductImage(product.name) || product.image_path || product.image || product.imageUrl;
                              return imgUrl ? (
                                <img src={convertImageUrl(imgUrl)} alt={product.name} className="h-9 w-9 shrink-0 rounded object-cover" onError={onImgError} />
                              ) : null;
                            })()}
                              <div className="min-w-0 flex-1">
                                <span className="break-words font-medium leading-snug text-gray-800">{product.name}</span>
                                {product.quantity && (
                                  <span className="ml-1 whitespace-nowrap text-gray-500">x {product.quantity}</span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-sm text-gray-400">Aucun produit</span>
                      )}
                    </div>

                    {/* CLIENT */}
                    <div className="min-w-0 text-sm">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 lg:hidden">Client</p>
                      <div className="break-words font-medium text-gray-900">{order.nom} {order.prenom}</div>
                      <div className="break-words text-gray-500">{order.phone}</div>
                      <div className="break-words text-xs leading-tight text-gray-500">{order.adresse}, {order.ville}, {order.code_postal}</div>
                      <div className="mt-1 break-all text-xs text-purple-500">ID : {order.id}</div>
                    </div>

                    {/* TOTAL */}
                    <div className="min-w-0 text-sm font-semibold text-gray-900">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 lg:hidden">Total</p>
                      <span className="break-words">{Number(order.total || 0).toFixed(3)} DT</span>
                    </div>

                    {/* STATUS */}
                    <div className="min-w-0">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 lg:hidden">Statut</p>
                      <span className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-medium ${getstatutColor(order.statut)}`}>
                        <span className="shrink-0">{getstatutIcon(order.statut)}</span>
                        <span className="ml-1 break-words">{statusLabel}</span>
                      </span>
                    </div>

                    {/* DATE */}
                    <div className="min-w-0 text-sm text-gray-500">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 lg:hidden">Date</p>
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>

                    {/* ACTIONS */}
                    <div className="min-w-0">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 lg:hidden">Actions</p>
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-900"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50 hover:text-red-800"
                          title="Mettre à la corbeille"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => !isPending && generateInvoice(order)}
                          disabled={isPending}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${isPending ? 'text-gray-300 cursor-not-allowed' : 'text-green-600 hover:bg-green-50 hover:text-green-800'}`}
                          title={isPending ? 'Facture disponible après confirmation' : 'Télécharger la facture PDF'}
                        >
                          <FileText className="h-4 w-4" />
                        </button>

                        {isPending && isAdmin && (
                          <>
                            <button
                              onClick={() => handlestatutUpdate(order.id, 'preconfirmed')}
                              className="rounded bg-orange-500 px-2 py-1 text-xs font-medium text-white hover:bg-orange-600"
                            >
                              Pré-confirmer
                            </button>
                            <button
                              onClick={() => handlestatutUpdate(order.id, 'cancelled')}
                              className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
                            >
                              Annuler
                            </button>
                          </>
                        )}

                        {isPreconfirmed && (
                          <button
                            onClick={() => handlestatutUpdate(order.id, 'confirmed')}
                            className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            Confirmer
                          </button>
                        )}

                        {order.statut === 'confirmed' && (
                          <button
                            onClick={() => handlestatutUpdate(order.id, 'en_cours')}
                            className="rounded bg-purple-600 px-2 py-1 text-xs font-medium text-white hover:bg-purple-700"
                          >
                            En cours de livraison
                          </button>
                        )}

                        {order.statut === 'en_cours' && (
                          <>
                            <button
                              onClick={() => handlestatutUpdate(order.id, 'au_magasin')}
                              className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                            >
                              Au magasin
                            </button>
                            <button
                              onClick={() => handlestatutUpdate(order.id, 'delivered')}
                              className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                            >
                              Livrée
                            </button>
                            <button
                              onClick={() => handlestatutUpdate(order.id, 'retour_expediteur')}
                              className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
                            >
                              Retour expéditeur
                            </button>
                          </>
                        )}

                        {order.statut === 'au_magasin' && (
                          <>
                            <button
                              onClick={() => handlestatutUpdate(order.id, 'delivered')}
                              className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                            >
                              Livrée
                            </button>
                            <button
                              onClick={() => handlestatutUpdate(order.id, 'retour_expediteur')}
                              className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
                            >
                              Retour expéditeur
                            </button>
                          </>
                        )}

                        {(order.statut === 'retour_expediteur' || order.statut === 'retour_client') && (
                          <button
                            onClick={() => handlestatutUpdate(order.id, 'retour_depot')}
                            className="rounded bg-gray-600 px-2 py-1 text-xs font-medium text-white hover:bg-gray-700"
                          >
                            Retour dépôt
                          </button>
                        )}

                        {['delivered', 'cancelled', 'retour_depot'].includes(order.statut) && (
                          <span className="text-xs italic text-gray-400">Aucune action</span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalOrderPages > 1 && (
        <div className="flex items-center justify-center gap-1 flex-wrap py-2">
          <button onClick={() => goToOrderPage(1)} disabled={currentPage === 1} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
            <ChevronsLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={() => goToOrderPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          {getOrderPageNumbers().map((page, i) =>
            page === '...' ? (
              <span key={`el-${i}`} className="px-2 text-gray-400 select-none">…</span>
            ) : (
              <button
                key={page}
                onClick={() => goToOrderPage(page as number)}
                className={`w-9 h-9 rounded-full text-sm font-semibold transition ${currentPage === page ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {page}
              </button>
            )
          )}
          <button onClick={() => goToOrderPage(currentPage + 1)} disabled={currentPage === totalOrderPages} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={() => goToOrderPage(totalOrderPages)} disabled={currentPage === totalOrderPages} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
            <ChevronsRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Détails de la commande</h2>
                <p className="text-xs text-purple-500 mt-0.5 break-all">ID : {selectedOrder.id}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isEditing ? (
                  <button
                    onClick={startEditing}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg transition"
                    title="Modifier les informations"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Modifier</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition"
                      title="Enregistrer les modifications"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Enregistrer</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition"
                    >
                      <span>Annuler</span>
                    </button>
                  </>
                )}
                <button onClick={() => { setSelectedOrder(null); setIsEditing(false); }} className="text-gray-400 hover:text-gray-600 ml-1">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-5 break-words text-sm">

              {/* Statut + Date */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Statut</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${getstatutColor(selectedOrder.statut)}`}>
                  {getstatutIcon(selectedOrder.statut)}
                  <span>
                    {selectedOrder.statut === 'pending' ? 'En attente'
                    : selectedOrder.statut === 'preconfirmed' ? 'Pré-confirmée'
                    : selectedOrder.statut === 'confirmed' ? 'Confirmée'
                    : selectedOrder.statut === 'delivered' ? 'Livrée'
                    : selectedOrder.statut === 'cancelled' ? 'Annulée'
                    : selectedOrder.statut}
                  </span>
                </span>
                <span className="ml-auto text-gray-400 text-xs">
                  {new Date(selectedOrder.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Informations client */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">📋 Informations client</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Nom</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.nom}
                        onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                        className="w-full mt-0.5 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-850 font-semibold bg-white text-sm"
                      />
                    ) : (
                      <p className="font-semibold text-gray-800">{selectedOrder.nom || '—'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Prénom</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.prenom}
                        onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                        className="w-full mt-0.5 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-850 font-semibold bg-white text-sm"
                      />
                    ) : (
                      <p className="font-semibold text-gray-800">{selectedOrder.prenom || '—'}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Numéro de téléphone</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full mt-0.5 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-850 font-semibold bg-white text-sm"
                      />
                    ) : (
                      <p className="font-semibold text-gray-800">{selectedOrder.phone || '—'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">📍 Adresse de livraison</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Adresse complète</p>
                    {isEditing ? (
                      <textarea
                        value={editForm.adresse}
                        onChange={(e) => setEditForm({ ...editForm, adresse: e.target.value })}
                        className="w-full mt-0.5 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-850 font-semibold bg-white text-sm"
                        rows={2}
                      />
                    ) : (
                      <p className="font-semibold text-gray-800">{selectedOrder.adresse || '—'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Gouvernorat</p>
                    {isEditing ? (
                      <select
                        value={editForm.province}
                        onChange={(e) => {
                          const prov = e.target.value;
                          setEditForm({ ...editForm, province: prov, ville: '' });
                        }}
                        className="w-full mt-0.5 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-850 font-semibold bg-white text-sm"
                      >
                        <option value="">Sélectionnez un gouvernorat</option>
                        {Object.keys(tunisiaData).map((province) => (
                          <option key={province} value={province}>{province}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="font-semibold text-gray-800">
                        {selectedOrder.province || findProvinceForCity(selectedOrder.ville) || '—'}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Ville</p>
                    {isEditing ? (
                      <select
                        value={editForm.ville}
                        onChange={(e) => setEditForm({ ...editForm, ville: e.target.value })}
                        disabled={!editForm.province}
                        className="w-full mt-0.5 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-850 font-semibold bg-white text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Sélectionnez une ville</option>
                        {editForm.province && tunisiaData[editForm.province]?.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="font-semibold text-gray-800">{selectedOrder.ville || '—'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Code postal</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.code_postal}
                        onChange={(e) => setEditForm({ ...editForm, code_postal: e.target.value })}
                        className="w-full mt-0.5 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-850 font-semibold bg-white text-sm"
                      />
                    ) : (
                      <p className="font-semibold text-gray-800">{selectedOrder.code_postal || '—'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Paiement & Total */}
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-green-600 mb-3">💳 Paiement & Total</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Mode de paiement</p>
                    <p className="font-semibold text-gray-800">{selectedOrder.paiement_mode || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Frais de livraison</p>
                    <p className="font-semibold text-gray-800">{Number(currentTotals.fraisLivraison || 0).toFixed(3)} DT</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Total commande</p>
                    <p className="text-2xl font-bold text-green-700">{Number(currentTotals.total || 0).toFixed(3)} DT</p>
                  </div>
                </div>
              </div>

              {/* Ajouter un produit (uniquement en mode édition) */}
              {isEditing && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 relative">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">➕ Ajouter un produit</h3>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Rechercher un produit à ajouter..."
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setIsProductDropdownOpen(true);
                        }}
                        onFocus={() => setIsProductDropdownOpen(true)}
                        className="w-full pl-3 pr-9 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {selectedProdIds.length > 0 && (
                      <button
                        type="button"
                        onClick={addSelectedProducts}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shrink-0"
                      >
                        Ajouter ({selectedProdIds.length})
                      </button>
                    )}
                  </div>
                  {isProductDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => {
                        setIsProductDropdownOpen(false);
                        setProductSearch('');
                      }} />
                      <ul className="absolute left-0 right-0 z-40 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm text-gray-700">
                        {(() => {
                          const filtered = allProducts.filter(p => {
                            const matches = p.name.toLowerCase().includes(productSearch.toLowerCase());
                            const inStock = p.stock_status !== "en rupture de stock";
                            const hasPrice = (p.discounted_price !== null && p.discounted_price > 0) || (p.original_price !== null && p.original_price > 0);
                            return matches && inStock && hasPrice;
                          });

                          // Sort: put products with images first, without images last
                          const sortedFiltered = filtered.sort((a, b) => {
                            const aHasImg = !!(a.image_path || a.image);
                            const bHasImg = !!(b.image_path || b.image);
                            if (aHasImg && !bHasImg) return -1;
                            if (!aHasImg && bHasImg) return 1;
                            return 0;
                          });

                          if (sortedFiltered.length === 0) {
                            return <li className="px-4 py-2 text-gray-400 italic">Aucun produit disponible</li>;
                          }

                          return (
                            <>
                              {/* Results count header */}
                              <li className="px-4 py-1.5 text-xs text-gray-400 font-semibold bg-gray-50 border-b border-gray-100 sticky top-0">
                                {sortedFiltered.length} résultat{sortedFiltered.length > 1 ? 's' : ''}
                              </li>
                              {sortedFiltered.map(p => {
                                const isChecked = selectedProdIds.includes(String(p.id));
                                const imagePath = getOrderProductImage(p.name) || p.image_path || p.image;
                                return (
                                  <li
                                    key={p.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleProductSelection(p.id);
                                    }}
                                    className="px-4 py-2.5 hover:bg-gray-100 cursor-pointer transition-colors text-left flex justify-between items-center gap-2 border-b border-gray-50 last:border-0"
                                  >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {}}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                                      />
                                      {imagePath && (
                                        <img src={convertImageUrl(imagePath)} alt={p.name} className="h-8 w-8 rounded object-cover shrink-0 border border-gray-100" onError={onImgError} />
                                      )}
                                      <span className="font-medium text-gray-800 line-clamp-1">{p.name}</span>
                                    </div>
                                    <span className="text-blue-600 font-bold shrink-0">
                                      {Number(p.discounted_price || p.original_price || 0).toFixed(3)} DT
                                    </span>
                                  </li>
                                );
                              })}
                            </>
                          );

                        })()}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {/* Produits */}
              <div className="border border-gray-200 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">🛒 Produits commandés</h3>
                <ul className="space-y-3">
                  {(isEditing ? editForm.produits : (selectedOrder.produits || []))?.map((p: any, i: number) => {
                    const price = Number(p.discounted_price || p.price || p.original_price || 0);
                    const imagePath = getOrderProductImage(p.name) || p.image_path || p.image;
                    return (
                      <li key={i} className="flex items-center gap-3 justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {imagePath && (
                            <img src={convertImageUrl(imagePath)} alt={p.name} className="h-11 w-11 rounded-lg object-cover shrink-0 border border-gray-100" onError={onImgError} />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-800 break-words leading-snug">{p.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {price.toFixed(3)} DT × {p.quantity}
                              {' = '}
                              <span className="font-semibold text-gray-700">
                                {(price * Number(p.quantity)).toFixed(3)} DT
                              </span>
                            </p>
                          </div>
                        </div>
                        {isEditing ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => updateProductQuantity(p.id, -1)}
                                className="w-6 h-6 flex items-center justify-center bg-white hover:bg-gray-200 text-gray-600 font-bold border border-gray-200 rounded transition"
                                title="Diminuer"
                              >
                                −
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-gray-700">{p.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateProductQuantity(p.id, 1)}
                                className="w-6 h-6 flex items-center justify-center bg-white hover:bg-gray-200 text-gray-600 font-bold border border-gray-200 rounded transition"
                                title="Augmenter"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditForm(prev => ({
                                  ...prev,
                                  produits: prev.produits.filter(item => String(item.id) !== String(p.id))
                                }));
                                toast.success('🗑️ Produit retiré de la commande');
                              }}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition shrink-0"
                              title="Retirer le produit"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="shrink-0 text-sm font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">×{p.quantity}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* First Delivery */}
              {selectedOrder.statut === 'confirmed' && (
                <div className="border-t border-gray-200 pt-4">
                  <FirstDeliveryIntegration
                    orderId={selectedOrder.id}
                    initialBarCode={selectedOrder.first_delivery_barcode}
                    initialStatus={selectedOrder.first_delivery_status}
                    onOrderCreated={(barCode, link) => {
                      console.log('Order created on First Delivery:', { barCode, link });
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
