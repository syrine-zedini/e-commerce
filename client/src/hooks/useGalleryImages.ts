import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

// Shared between Home and Homemobile (identical fetch logic). Returns only
// admin-managed images from /api/gallery-images — an empty array means the
// caller should render its own fallback.
export function useGalleryImages() {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const data = await apiGet("/api/gallery-images");
        setImages(data?.map((item: any) => item.image_url) || []);
      } catch {
        setImages([]);
      }
    };

    fetchImages();
  }, []);

  return images;
}
