import { fetchAllProducts } from "@/lib/api";
import React, { createContext, useContext, useState, useEffect } from "react";

interface ProductsContextType {
  products: any[];
  loading: boolean;
  error: any;
}

const ProductsContext = createContext<ProductsContextType | null>(null);

export const ProductsProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error] = useState<any>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const data = await fetchAllProducts("/api/products");
      setProducts(data);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  return (
    <ProductsContext.Provider value={{ products, loading, error }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductsProvider");
  }
  return context;
};
