import { Marques } from '@/pages/Marques';
import { MarquesMobile } from '@/pages/MarquesMobile';
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

export function ResponsiveMarques() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768); // breakpoint example
    }

    handleResize(); // initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <Helmet>
        <title>YJ PARA | Nos Marques</title>
        <meta
          name="description"
          content="Découvrez les marques disponibles sur YJ PARA, votre parapharmacie en ligne en Tunisie. Produits de santé, beauté et bien-être de qualité."
        />
        <meta
          name="keywords"
          content="marques, parapharmacie, santé, beauté, soins, bien-être, Tunisie"
        />
        <meta property="og:title" content="YJ PARA | Nos Marques" />
        <meta
          property="og:description"
          content="Explorez les marques de YJ PARA, votre parapharmacie en ligne, pour tous vos besoins en santé, beauté et bien-être."
        />
        <meta property="og:image" content="/figmaAssets/productsm/flor-a-logos-01-180.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="YJ PARA | Nos Marques" />
        <meta
          name="twitter:description"
          content="YJ PARA, votre parapharmacie en ligne en Tunisie. Découvrez toutes nos marques et produits."
        />
        <meta name="twitter:image" content="/figmaAssets/productsm/flor-a-logos-01-180.png" />
      </Helmet>

      {isMobile ? <MarquesMobile /> : <Marques />}
    </>
  );
}
