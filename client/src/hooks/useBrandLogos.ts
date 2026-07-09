import { apiGet } from "@/lib/api";
import { useEffect, useState } from "react";

// Brand logo objects carry both `{ image }` and `{ src, alt }` for the same
// URL because existing call sites render either shape (Home/Homemobile use
// `.image`, Marques/MarquesMobile use `.src`/`.alt`) — this keeps both
// working without touching their JSX.
export interface BrandLogo {
  image: string;
  src: string;
  alt: string;
}

export function useBrandLogos(): BrandLogo[] {
  const [logos, setLogos] = useState<BrandLogo[]>([]);

  useEffect(() => {
    async function fetchLogos() {
      let data: { name: string | null; image: string }[] | null = null;
      try {
        data = await apiGet("/api/marques");
      } catch (error: any) {
        console.error("❌ Error fetching logos:", error?.message || error);
        return;
      }

      setLogos((data || []).map((marque) => ({
        image: marque.image,
        src: marque.image,
        alt: marque.name || "Brand Logo",
      })));
    }

    fetchLogos();
  }, []);

  return logos;
}
