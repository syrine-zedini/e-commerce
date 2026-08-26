import { toast } from "react-hot-toast";

// Shared between the product-listing pages (Home/Homemobile,
// Produits/ProduitsMobile) — previously copy-pasted identically in each.

export const isProductAvailable = (product: any): boolean => {
  const isOutOfStockStatus = String(product?.stock_status ?? "en stock").trim().toLowerCase() === "en rupture de stock";
  const stockNum = (product?.form !== null && product?.form !== undefined && product?.form !== "")
    ? Number(product.form) : null;
  const isOutOfStock = stockNum !== null && stockNum <= 0;
  const hasNoPrice = product?.original_price === null || product?.original_price === undefined || Number(product.original_price) <= 0;
  return !isOutOfStockStatus && !isOutOfStock && !hasNoPrice;
};

export const showToast = (message: string) => {
  if (message.includes('déjà')) {
    toast.error(message, {
      style: { borderRadius: '10px', background: '#333', color: '#fff' }
    });
  } else {
    toast.success(message, {
      style: { borderRadius: '10px', background: '#fff', color: '#333', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
      iconTheme: { primary: '#C86D85', secondary: '#fff' }
    });
  }
};
