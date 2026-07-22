import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Eye, EyeOff } from 'lucide-react';
import { apiGet, apiPost, apiDelete, fetchAllProducts, listStorage } from '@/lib/api';
import { convertImageUrl } from '@/lib/imageUtils';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  name: string;
  original_price: number;
  discounted_price: number | null;
  promo: boolean;
  image_path?: string;
  imageUrl?: string;
  stock_status?: string;
}

interface Promotion {
  id: number;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  productIds?: (string | number)[];
}

export const PromotionManagement: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [activePromotionId, setActivePromotionId] = useState<string | number | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    isActive: true,
    selectedProducts: [] as number[],
  });

  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0, hours: 0, minutes: 0, seconds: 0,
  });
  const [activePromotionIdForTimer, setActivePromotionIdForTimer] = useState<string | number | null>(null);

  useEffect(() => {
    if (!activePromotionIdForTimer) return;
    const promo = promotions.find((p) => String(p.id) === String(activePromotionIdForTimer));
    if (!promo) return;
    const endDate = new Date(promo.end_date);
    const timer = setInterval(() => {
      const diff = endDate.getTime() - Date.now();
      if (diff <= 0) { clearInterval(timer); setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activePromotionIdForTimer, promotions]);

  const fetchProducts = async () => {
    const prodData = await fetchAllProducts('/api/products');
    if (!prodData || prodData.length === 0) return;
    const productsWithExtras = await Promise.all(
      prodData.map(async (product: any) => {
        let imageUrl = '';
        if (product.image_path) {
          if (product.image_path.startsWith('http')) {
            imageUrl = product.image_path;
          } else {
            const isFolder = !product.image_path.match(/\.(jpg|jpeg|png|gif|webp)$/i);
            if (isFolder) {
              const folder = product.image_path.replace(/^image\//, '');
              const files = await listStorage(`image/${folder}`);
              if (files && files.length > 0) {
                const sorted = files.sort((a, b) => a.name.localeCompare(b.name));
                imageUrl = sorted[0].url;
              }
            } else {
              imageUrl = product.image_path;
            }
          }
        }
        return { ...product, imageUrl };
      })
    );
    setProducts(productsWithExtras);
  };

  const fetchPromotions = async () => {
    const promoData = await apiGet('/api/promotions?sort=created_at');
    if (!promoData) return;
    const promosWithProducts = await Promise.all(
      promoData.map(async (promo: Promotion) => {
        const pp = await apiGet(`/api/promotion-products?promotionIds=${promo.id}`);
        return { ...promo, productIds: (pp || []).map((x: any) => x.product_id) };
      })
    );
    setPromotions(promosWithProducts);
  };

  useEffect(() => {
    fetchProducts();
    fetchPromotions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPost('/api/promotions/save', {
        promotion: {
          name: formData.name,
          type: formData.type,
          value: parseFloat(formData.value),
          start_date: formData.startDate || new Date().toISOString().slice(0, 10),
          end_date: formData.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          is_active: formData.isActive,
        },
        selectedProductIds: formData.selectedProducts,
        editingId: editingPromotion?.id ?? null,
      });
      toast.success(editingPromotion ? 'Promotion modifiée !' : 'Promotion créée !');
      await fetchPromotions();
      await fetchProducts();
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const resetForm = () => {
    setFormData({ name: '', type: 'percentage', value: '', startDate: today, endDate: nextWeek, isActive: true, selectedProducts: [] });
    setEditingPromotion(null);
    setShowModal(false);
  };

  const handleEdit = async (promotion: Promotion) => {
    const pp = await apiGet(`/api/promotion-products?promotionIds=${promotion.id}`);
    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name,
      type: 'percentage',
      value: promotion.value.toString(),
      startDate: promotion.start_date,
      endDate: promotion.end_date,
      isActive: promotion.is_active,
      selectedProducts: (pp || []).map((p: any) => Number(p.product_id)),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string | number) => {
    const toastId = toast.loading('Suppression en cours...');
    try {
      const promo = promotions.find((p) => String(p.id) === String(id));
      const productIds = (promo?.productIds || []).map((pid) => Number(pid));

      await apiDelete(`/api/promotions/${id}`, { productIds });

      toast.success('Promotion supprimée !', { id: toastId });
      setPromotions((prev) => prev.filter((p) => String(p.id) !== String(id)));
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression', { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestion Promotion</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Ajouter Promotion</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold">{p.name}</h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {p.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span>Remise</span>
              <span>{p.type === 'percentage' ? `${p.value}%` : `${p.value} DT`}</span>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button onClick={() => handleEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const newId = String(activePromotionId) === String(p.id) ? null : p.id;
                  setActivePromotionId(newId);
                  setActivePromotionIdForTimer(newId);
                }}
                className="mt-2 p-2 bg-purple-700 text-white rounded-full flex items-center justify-center"
              >
                {String(activePromotionId) === String(p.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {String(activePromotionId) === String(p.id) && (
              <div className="mt-2 bg-red-500 rounded-full px-4 py-2 text-white text-sm font-medium inline-block">
                Se termine dans :&nbsp;
                <span className="font-bold">
                  {timeLeft.days}j : {timeLeft.hours}h : {timeLeft.minutes}min : {timeLeft.seconds}s
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {promotions.map((promotion) =>
          String(activePromotionId) === String(promotion.id)
            ? products
                .filter((p) => promotion.productIds?.includes(p.id))
                .map((p) => (
                  <div key={`${promotion.id}-${p.id}`} className="border rounded-lg p-3 flex flex-col items-center space-y-2 shadow-sm mt-2">
                    <img src={convertImageUrl(p.image_path)} alt={p.name} className="w-24 h-24 rounded object-cover" />
                    <span className="font-medium text-center text-sm">{p.name}</span>
                    <span className="text-sm text-gray-500">
                      {Number(p.discounted_price || p.original_price).toFixed(3)} DT
                    </span>
                  </div>
                ))
            : null
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingPromotion ? 'Modifier la Promotion' : 'Ajouter une Promotion'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Type</label>
                <div className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-700 select-none">
                  Pourcentage (%)
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Valeur</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Produits Applicables</label>
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full px-2 py-1 mb-2 border border-gray-300 rounded text-sm"
                />
                <div className="max-h-40 overflow-y-auto border p-2 rounded space-y-1">
                  {products
                    .filter((p) => p.stock_status !== "en rupture de stock")
                    .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                    .map((product) => (
                      <label key={product.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.selectedProducts.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData((prev) => ({ ...prev, selectedProducts: [...prev.selectedProducts, product.id] }));
                            } else {
                              setFormData((prev) => ({ ...prev, selectedProducts: prev.selectedProducts.filter((id) => id !== product.id) }));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        {product.image_path && (
                          <img src={convertImageUrl(product.image_path)} alt={product.name} className="w-8 h-8 object-cover rounded" />
                        )}
                        <span className="text-sm">{product.name}</span>
                      </label>
                    ))}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Date de fin</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="font-medium">Active</label>
              </div>

              <div className="flex justify-end space-x-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 border rounded hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60">
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
