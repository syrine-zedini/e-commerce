import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

export interface Conseil {
  id: number;
  title: string;
  content: string;
  image: string;
  category?: string;
}

export function useConseils(query: string = "sort=id&order=desc&limit=3") {
  const [conseils, setConseils] = useState<Conseil[]>([]);
  useEffect(() => {
    apiGet(`/api/conseils?${query}`)
      .then((data) => setConseils(data || []))
      .catch((error) => console.error(error));
  }, [query]);
  return conseils;
}
