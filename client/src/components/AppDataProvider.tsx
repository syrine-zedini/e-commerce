import { apiGet, fetchAllProducts } from "@/lib/api";
import React, { createContext, useContext, useState, useEffect } from "react";

interface AppDataContextType {
  products: any[];
  categories: any[];
  loading: boolean;
}

const AppDataContext = createContext<AppDataContextType>({
  products: [],
  categories: [],
  loading: true,
});

export const useAppData = () => useContext(AppDataContext);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const productsData = await fetchAllProducts("/api/products?activeOnly=1&inStockOnly=1&withPriceOnly=1");
        const categoriesData = await apiGet("/api/categories");

        setProducts(productsData || []);
        setCategories(categoriesData || []);
      } catch (err) {
        console.error("Error fetching app data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return (
    <AppDataContext.Provider value={{ products, categories, loading }}>
      {children}
    </AppDataContext.Provider>
  );
};
