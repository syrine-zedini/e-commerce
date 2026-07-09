import React, { useState, useEffect, useMemo } from 'react';
import {
  Trash2, Eye, RotateCcw, XCircle, AlertTriangle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Search, RefreshCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiGet, apiPost } from '@/lib/api';
import { convertImageUrl, onImgError } from '@/lib/imageUtils';
import { getStatutLabel, getStatutColor } from '@shared/orderStatus';

const DELETED_ORDERS_KEY = 'yjpara_deleted_orders';
const ORDERS_PER_PAGE = 10;

interface DeletedOrder {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  adresse: string;
  ville: string;
  code_postal: string;
  paiement_mode: string;
  frais_livraison: number;
  total: number;
  produits: any;
  created_at: string;
  statut: string;
  phone: string;
  deleted_at: string; // timestamp of soft-delete
}

// ─── LocalStorage helpers ──────────────────────────────────────────────────
export const getDeletedOrders = (): DeletedOrder[] => {
  try {
    const raw = localStorage.getItem(DELETED_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addToDeletedOrders = (order: Omit<DeletedOrder, 'deleted_at'>) => {
  const current = getDeletedOrders();
  const already = current.find((o) => o.id === order.id);
  if (already) return; // don't duplicate
  const updated = [{ ...order, deleted_at: new Date().toISOString() }, ...current];
  localStorage.setItem(DELETED_ORDERS_KEY, JSON.stringify(updated));
};

const removeFromDeletedOrders = (id: string) => {
  const current = getDeletedOrders();
  localStorage.setItem(
    DELETED_ORDERS_KEY,
    JSON.stringify(current.filter((o) => o.id !== id))
  );
};

// ─── Component ────────────────────────────────────────────────────────────
export const DeletedOrdersManagement: React.FC = () => {
  const [deletedOrders, setDeletedOrders] = useState<DeletedOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<DeletedOrder | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  const load = () => setDeletedOrders(getDeletedOrders());

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      const PAGE = 1000;
      let all: any[] = [];
      let from = 0;
      let hasMore = true;
      while (hasMore) {
        const data = await apiGet(`/api/products?withImageOnly=1&fields=name,image_path&limit=${PAGE}&offset=${from}`);
        if (data && data.length > 0) {
          all = [...all, ...data];
          from += PAGE;
          hasMore = data.length === PAGE;
        } else {
          hasMore = false;
        }
      }
      setAllProducts(all);
    };
    fetchProducts();
  }, []);

  const productImageMap = useMemo(() => {
    const map = new Map<string, string>();
    allProducts.forEach(p => { if (p.name && p.image_path) map.set(p.name.toLowerCase().trim(), p.image_path); });
    return map;
  }, [allProducts]);

  const getProductImage = (rawName: string): string | undefined => {
    if (!rawName) return undefined;
    const cleaned = rawName.replace(/\s*[×x]\s*\d+/gi, '').trim();
    let img = productImageMap.get(cleaned.toLowerCase());
    if (img) return img;
    const parts = cleaned.split(/\s+\+\s+/);
    for (const part of parts) {
      const key = part.trim().toLowerCase();
      img = productImageMap.get(key);
      if (img) return img;
      if (key.length >= 10) {
        const prefix = key.substring(0, 25);
        for (const [k, v] of Array.from(productImageMap.entries())) {
          if (k.startsWith(prefix)) return v;
        }
      }
    }
    return undefined;
  };

  // Filter
  const filtered = deletedOrders.filter((o) => {
    const q = searchTerm.toLowerCase();
    return (
      String(o.id).toLowerCase().includes(q) ||
      (o.nom + ' ' + o.prenom).toLowerCase().includes(q) ||
      (o.email || '').toLowerCase().includes(q) ||
      o.phone?.toLowerCase().includes(q)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / ORDERS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  };

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  // ── Restore ──
  const handleRestore = async (order: DeletedOrder) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Restaurer la commande <span className="font-bold text-blue-600">#{String(order.id).slice(0, 8)}</span> ?</p>
          <p className="text-xs text-gray-500">Elle sera réinsérée dans la table commandes.</p>
          <div className="flex justify-end gap-2 mt-1">
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
                  const { deleted_at, ...orderData } = order;
                  await apiPost('/api/commandes', orderData);
                  removeFromDeletedOrders(order.id);
                  load();
                  toast.success('✅ Commande restaurée avec succès !');
                } catch {
                  toast.error('❌ Une erreur inattendue s\'est produite.');
                }
              }}
              className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md"
            >
              Restaurer
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  // ── Permanent delete ──
  const handlePermanentDelete = (orderId: string) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm font-medium">Supprimer définitivement cette commande ?</p>
          </div>
          <p className="text-xs text-gray-500">Cette action est <strong>irréversible</strong>.</p>
          <div className="flex justify-end gap-2 mt-1">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                removeFromDeletedOrders(orderId);
                load();
                toast.success('🗑️ Commande supprimée définitivement.');
              }}
              className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md"
            >
              Supprimer définitivement
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  // ── Clear all ──
  const handleClearAll = () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm font-medium">Vider toute la corbeille ?</p>
          </div>
          <p className="text-xs text-gray-500">Toutes les commandes supprimées seront perdues définitivement.</p>
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md">Annuler</button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                localStorage.removeItem(DELETED_ORDERS_KEY);
                load();
                toast.success('🗑️ Corbeille vidée.');
              }}
              className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md"
            >
              Vider la corbeille
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-red-500" />
            Commandes Supprimées
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} commande{filtered.length > 1 ? 's' : ''} dans la corbeille
            {totalPages > 1 && ` · Page ${currentPage}/${totalPages}`}
          </p>
        </div>
        {deletedOrders.length > 0 && (
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg transition font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Vider la corbeille
          </button>
        )}
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">Commandes dans la corbeille</p>
          <p>Ces commandes ont été supprimées de la liste principale. Vous pouvez les <strong>restaurer</strong> pour les réinsérer dans la base de données, ou les <strong>supprimer définitivement</strong>.</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par ID, nom, email, téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {deletedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <RefreshCcw className="w-12 h-12 opacity-30" />
            <p className="text-lg font-medium">La corbeille est vide</p>
            <p className="text-sm">Les commandes supprimées apparaîtront ici.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">Aucune commande trouvée.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {paginated.map((order) => (
              <article key={order.id} className="p-4 sm:p-5 bg-red-50/30 hover:bg-red-50/60 transition-colors">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.25fr)_minmax(110px,0.4fr)_minmax(120px,0.45fr)_minmax(100px,0.4fr)_minmax(200px,0.75fr)] lg:items-start">
                  {/* Articles */}
                  <div className="min-w-0">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 lg:hidden">Articles</p>
                    {order.produits && order.produits.length > 0 ? (
                      <ul className="space-y-1 text-sm text-gray-700">
                        {order.produits.map((p: any, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            {(getProductImage(p.name) || p.image_path || p.image) && (
                              <img src={convertImageUrl(getProductImage(p.name) || p.image_path || p.image)} alt={p.name} className="h-8 w-8 shrink-0 rounded object-cover" onError={onImgError} />
                            )}
                            <span className="break-words leading-snug font-medium">
                              {p.name} <span className="text-gray-500">x {p.quantity}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm text-gray-400">Aucun produit</span>
                    )}
                  </div>

                  {/* Client */}
                  <div className="min-w-0 text-sm">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 lg:hidden">Client</p>
                    <div className="font-medium text-gray-900 break-words">{order.nom} {order.prenom}</div>
                    <div className="text-gray-500 break-words">{order.phone}</div>
                    <div className="text-xs text-gray-500 leading-tight mt-0.5">{order.adresse}, {order.ville}</div>
                    <div className="mt-1 break-all text-xs text-purple-500">ID : {order.id}</div>
                  </div>

                  {/* Total */}
                  <div className="min-w-0 text-sm font-semibold text-gray-900">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 lg:hidden">Total</p>
                    {Number(order.total).toFixed(3)} DT
                  </div>

                  {/* Statut */}
                  <div className="min-w-0">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 lg:hidden">Statut</p>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatutColor(order.statut)}`}>
                      {getStatutLabel(order.statut)}
                    </span>
                  </div>

                  {/* Supprimé le */}
                  <div className="min-w-0 text-sm text-gray-500">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 lg:hidden">Supprimé le</p>
                    <span className="text-red-500 text-xs font-medium">
                      🗑️ {new Date(order.deleted_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="min-w-0">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 lg:hidden">Actions</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Voir */}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50"
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {/* Restaurer */}
                      <button
                        onClick={() => handleRestore(order)}
                        className="inline-flex items-center gap-1 rounded-md bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 px-2 py-1 text-xs font-medium transition"
                        title="Restaurer la commande"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restaurer
                      </button>
                      {/* Supprimer définitivement */}
                      <button
                        onClick={() => handlePermanentDelete(order.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 px-2 py-1 text-xs font-medium transition"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="h-3 w-3" />
                        Suppr. déf.
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 flex-wrap py-2">
          <button onClick={() => goToPage(1)} disabled={currentPage === 1} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
            <ChevronsLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          {getPageNumbers().map((page, i) =>
            page === '...' ? (
              <span key={`el-${i}`} className="px-2 text-gray-400 select-none">…</span>
            ) : (
              <button
                key={page}
                onClick={() => goToPage(page as number)}
                className={`w-9 h-9 rounded-full text-sm font-semibold transition ${currentPage === page ? 'bg-red-500 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {page}
              </button>
            )
          )}
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
            <ChevronsRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-400" />
                Détails — Commande supprimée
              </h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-3 break-words text-sm">
              <p><strong>ID :</strong> {selectedOrder.id}</p>
              <p><strong>Statut :</strong> <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatutColor(selectedOrder.statut)}`}>{getStatutLabel(selectedOrder.statut)}</span></p>
              <p><strong>Client :</strong> {selectedOrder.nom} {selectedOrder.prenom}</p>
              <p><strong>Téléphone :</strong> {selectedOrder.phone}</p>
              <p><strong>Adresse :</strong> {selectedOrder.adresse}, {selectedOrder.ville}, {selectedOrder.code_postal}</p>
              <p><strong>Paiement :</strong> {selectedOrder.paiement_mode}</p>
              <p><strong>Livraison :</strong> {Number(selectedOrder.frais_livraison).toFixed(3)} DT</p>
              <p><strong>Total :</strong> {Number(selectedOrder.total).toFixed(3)} DT</p>
              <p><strong>Commandé le :</strong> {new Date(selectedOrder.created_at).toLocaleDateString('fr-FR')}</p>
              <p className="text-red-500"><strong>Supprimé le :</strong> {new Date(selectedOrder.deleted_at).toLocaleString('fr-FR')}</p>
              <div>
                <p className="font-semibold mb-1">Produits :</p>
                <ul className="space-y-1 pl-3">
                  {selectedOrder.produits?.map((p: any, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      {(getProductImage(p.name) || p.image_path || p.image) && <img src={convertImageUrl(getProductImage(p.name) || p.image_path || p.image)} alt={p.name} className="h-7 w-7 rounded object-cover" onError={onImgError} />}
                      <span>{p.name} × {p.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => { setSelectedOrder(null); handleRestore(selectedOrder); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition"
                >
                  <RotateCcw className="w-4 h-4" /> Restaurer
                </button>
                <button
                  onClick={() => { setSelectedOrder(null); handlePermanentDelete(selectedOrder.id); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition"
                >
                  <Trash2 className="w-4 h-4" /> Supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
