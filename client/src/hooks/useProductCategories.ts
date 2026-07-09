import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

// GET /api/categories — used identically across several pages.
export function useProductCategories() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    apiGet("/api/categories")
      .then((data) => setCategories(data || []))
      .catch((error) => console.error("Error fetching categories:", error?.message || error));
  }, []);

  return categories;
}
