import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost, apiDelete, uploadStorage, deleteStorage } from "@/lib/api";

type BrandLogo = {
  id: number;
  name: string | null;
  image: string;
};

export default function MarquesManagment() {
  const [logos, setLogos] = useState<BrandLogo[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchLogos = async () => {
    try {
      const data = await apiGet("/api/marques");
      setLogos(data);
    } catch {
      // ignore, mirrors previous silent-fail behavior
    }
  };

  useEffect(() => {
    fetchLogos();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const { url } = await uploadStorage("dismarques", file);
      await apiPost("/api/marques", { image: url, order: logos.length });
      await fetchLogos();
    } finally {
      setUploading(false);
    }
    e.target.value = "";
  };

  const handleDelete = async (logo: BrandLogo) => {
    try {
      await apiDelete(`/api/marques/${logo.id}`);
      setLogos((prev) => prev.filter((l) => l.id !== logo.id));
      const filename = logo.image.split("/").pop();
      if (filename) await deleteStorage("dismarques", filename).catch(() => {});
    } catch {
      // ignore, mirrors previous silent-fail behavior
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-end mb-4">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleUpload}
        />
        <Button
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {uploading ? "Chargement..." : "Téléverser le logo"}
        </Button>
      </div>

      {logos.length === 0 && (
        <p className="text-gray-400 text-center mt-8">Aucun logo disponible.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {logos.map((logo) => (
          <div
            key={logo.id}
            className="relative flex flex-col items-center border rounded-lg p-3 hover:shadow-md transition-shadow bg-white"
          >
            <img
              src={logo.image}
              alt={logo.name || "Marque"}
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
              loading="lazy"
            />
            <Button
              variant="destructive"
              size="sm"
              className="mt-2 w-full"
              onClick={() => handleDelete(logo)}
            >
              Supprimer
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
