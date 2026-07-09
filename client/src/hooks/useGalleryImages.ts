import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { GALLERY_FALLBACK_IMAGES } from "@/lib/pageData";

// Shared between Home and Homemobile (identical fetch + fallback logic).
export function useGalleryImages() {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchImages = async () => {
      let data: any[] = [];
      try {
        data = await apiGet("/api/gallery-images");
      } catch {
        setImages(GALLERY_FALLBACK_IMAGES);
        return;
      }

      setImages([...GALLERY_FALLBACK_IMAGES, ...(data?.map((item) => item.image_url) || [])]);
    };

    fetchImages();
  }, []);

  return images;
}
