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
        <title>GLOW Store - Nos Marques</title>
        <meta
          name="description"
          content="Découvrez les marques disponibles sur GLOW Store en Tunisie. Produits de santé, beauté et bien-être de qualité."
        />
        <meta
          name="keywords"
          content="GLOW, marques, parapharmacie, santé, beauté, soins, bien-être, Tunisie"
        />
        <meta property="og:title" content="GLOW Store - Nos Marques" />
        <meta
          property="og:description"
          content="Explorez nos marques sur GLOW Store, pour tous vos besoins en santé, beauté et bien-être."
        />
        <meta property="og:image" content="/figmaAssets/brand/glow-store-logo.jpeg" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="GLOW Store - Nos Marques" />
        <meta
          name="twitter:description"
          content="GLOW Store en Tunisie. Découvrez toutes nos marques et produits."
        />
        <meta name="twitter:image" content="/figmaAssets/brand/glow-store-logo.jpeg" />
      </Helmet>

      {isMobile ? <MarquesMobile /> : <Marques />}
    </>
  );
}
