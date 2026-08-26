import React, { useState, useEffect } from 'react';
import { Heart, Eye } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { Link } from 'wouter';
import { convertImageUrl, onImgError } from '@/lib/imageUtils';

export const Wishlist: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clientSession = localStorage.getItem("clientSession");
    if (clientSession) setUser(JSON.parse(clientSession));
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);

      // fetch products
      let productsData: any[];
      try {
        productsData = await apiGet("/api/products?activeOnly=1");
      } catch (prodError: any) {
        console.error("Error fetching products:", prodError?.message);
        setLoading(false);
        return;
      }

      // fetch categories
      let categories: any[] = [];
      try {
        categories = await apiGet("/api/categories");
      } catch (catError: any) {
        console.error("Error fetching categories:", catError?.message);
      }

      // enrich products
      const productsWithExtras = await Promise.all(
        (productsData || []).map(async (product) => {
          const category = categories?.find((c) => c.id === product.category_id);
          const categoryName = category ? category.name : "Uncategorized";

          // image_path is already a usable URL (see convertImageUrl usage below),
          // so no bucket/storage lookup is needed here.
          const imageUrl: string | null = product.image_path || null;

          return { ...product, categoryName, imageUrl };
        })
      );

      // build wishlist items for this user
      if (user.produits) {
        const userWishlist = user.produits.map((p: any) => {
          const fullProduct = productsWithExtras.find(prod => prod.id === p.id);
          return {
            id: p.id.toString(),
            productId: p.id,
            product: fullProduct || p,
            createdAt: p.created_at || new Date().toISOString(),
            userId: user.id
          };
        });
        setWishlist(userWishlist);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const userWishlist = wishlist.filter(item => item.userId === user?.id);

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Mes Favoris</h1>
      </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {userWishlist.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                  className="absolute top-3 left-3 z-10 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <img
                  src={convertImageUrl(item.product.image_path) || 'https://via.placeholder.com/200'}
                  alt={item.product.name}
                  className="w-full h-48 object-cover"
                  onError={onImgError}
                />
                <button
                  onClick={() => setWishlist(prev => prev.filter(w => w.id !== item.id))}
                  className="absolute bottom-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                >
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.product.name}</h3>
<div className="flex items-center justify-between mb-3">
  <div>
 {item.product.discounted_price && item.product.discounted_price !== item.product.original_price ? (
  <>
    <span className="text-lg font-bold text-gray-900">
      {item.product.discounted_price} DT
    </span>
    <span className="text-sm text-gray-500 line-through decoration-[#C86D85]/60 decoration-[1.5px] ml-2">
      {item.product.original_price} DT
    </span>
  </>
) : (
  <span className="text-lg font-bold text-gray-900">
    {item.product.original_price} DT
  </span>
)}

  </div>
</div>
              <Link
            to={`/detailsprod/${item.product.id}`} // route to details page
            className="mt-2 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg flex items-center justify-center"
          >
                  <Eye className="w-4 h-4 inline mr-1" /> Voir Produit
                </Link>
              </div>
            </div>
          ))}
        </div>
     
    </div>
  );
};
