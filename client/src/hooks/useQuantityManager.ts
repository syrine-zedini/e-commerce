import { useState } from "react";

// Per-product-id quantity selector state, e.g. the +/- steppers on product
// cards. Shared between Home/Homemobile and Produits/ProduitsMobile.
export function useQuantityManager() {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const getQty = (id: number) => quantities[id] ?? 1;
  const changeQty = (id: number, delta: number) =>
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, (prev[id] ?? 1) + delta) }));

  return { quantities, getQty, changeQty };
}
