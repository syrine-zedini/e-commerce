import React, { useEffect, useState } from "react";
import { apiGet, listStorage } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { convertImageUrl } from "@/lib/imageUtils";

interface Product {
  id: number;
  name: string;
  code: string;
  description: string;
  original_price?: number;
  discounted_price?: number;
  category_id: number;
  categoryName?: string;
  image_path: string;
  imageUrls?: string[];
}
interface ProductDetailsProps {
  id: number;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ id }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);

      // 1. Fetch product by id
      let productData: any = null;
      try {
        productData = await apiGet(`/api/products/${Number(id)}`);
      } catch (error) {
        console.error("Error fetching product:", error);
        setLoading(false);
        return;
      }

      // 2. Fetch category name
      let categoryName = "Uncategorized";
      if (productData.category_id) {
        try {
          const allCategories = await apiGet("/api/categories");
          const categoryData = (allCategories || []).find((c: any) => c.id === productData.category_id);
          if (categoryData) categoryName = categoryData.name;
        } catch {
          // keep default categoryName on error
        }
      }

      const enrichedProduct = { ...productData, categoryName };
      setProduct(enrichedProduct);

      // 4. Fetch similar products
      if (productData.category_id) {
        let similar: any[] | null = null;
        try {
          similar = await apiGet(
            `/api/products?categoryId=${productData.category_id}&excludeId=${productData.id}&limit=5`
          );
        } catch {
          similar = null;
        }

        if (similar) {
          const similarWithImages = await Promise.all(
            similar.map(async (p) => {
              let imageUrl: string | null = null;
              if (p.image_path) {
                if (p.image_path.startsWith("http")) {
                  imageUrl = p.image_path;
                } else {
                  const folder = p.image_path.replace(/^image\//, "");
                  try {
                    const files = await listStorage(`image/${folder}`);
                    if (files && files.length > 0) {
                      const sorted = files.sort((a, b) => a.name.localeCompare(b.name));
                      imageUrl = sorted[0].url;
                    }
                  } catch {
                    // keep imageUrl null on error
                  }
                }
              }
              return { ...p, imageUrl };
            })
          );
          setSimilarProducts(similarWithImages);
        }
      }

      setLoading(false);
    }

    fetchProduct();
  }, [id]);

  if (loading || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <p>Chargement du produit...</p>
      </div>
    );
  }

  return (
<div className="p-6 space-y-6">
  <div className="flex flex-col md:flex-row gap-6">
    {/* Images grid 3 by row */}
  <div className="flex-1  mt-24">
  {product.image_path ? (
    <img
      src={convertImageUrl(product.image_path)}
      alt={product.name}
      className="w-full h-64 object-cover rounded"
    />
  ) : (
    <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded">
      No Image
    </div>
  )}
</div>


    {/* Product info (unchanged) */}
<div className="flex-1 flex flex-col gap-4 mt-6 p-6 bg-white rounded-xl shadow-md">
  <h1 className="text-3xl font-extrabold text-gray-800">{product.name}</h1>

  <p className="text-gray-600 text-base whitespace-pre-line leading-relaxed">
    {product.description
      .replace(/\\n/g, "\n")
      .replace(/\n/g, "\n")}
  </p>

<div className="flex items-center gap-3 mt-2">
  <p className="text-2xl font-bold text-green-600">
    {(!product.discounted_price || product.discounted_price === product.original_price)
      ? product.original_price
      : product.discounted_price} DT
  </p>
  {product.discounted_price &&
    product.original_price &&
    product.discounted_price < product.original_price && (
      <p className="text-gray-400 line-through decoration-[#1D8EE6]/60 decoration-[1.5px] text-lg">
        {product.original_price} DT
      </p>
    )}
</div>


  <div className="flex flex-col gap-1 mt-3 text-gray-500 text-sm">
    <p>
      <span className="font-semibold">Catégorie:</span> {product.categoryName}
    </p>
    <p>
      <span className="font-semibold">Code produit:</span> {product.code}
    </p>
  </div>
</div>

  </div>
</div>


  );
};
