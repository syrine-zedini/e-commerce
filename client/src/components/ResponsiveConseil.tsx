import { ConseilsSant } from '@/pages/ConseilsSant';
import { ConseilsSantMobile } from '@/pages/ConseilsSantMobile';
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

export function ResponsiveConseil() {
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
        <title>Conseils Santé & Bien-être</title>
        <meta
          name="description"
          content="Découvrez nos conseils santé et bien-être sur votre parapharmacie en ligne en Tunisie. Astuces beauté, soins et santé pour toute la famille."
        />
        <meta
          name="keywords"
          content="conseils santé, bien-être, beauté, soins, parapharmacie, Tunisie"
        />
        <meta property="og:title" content="Conseils Santé & Bien-être" />
        <meta
          property="og:description"
          content="Astuces et conseils santé, beauté et bien-être – votre parapharmacie en ligne."
        />
        <meta property="og:image" content="/figmaAssets/productsm/flor-a-logos-01-180.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Conseils Santé & Bien-être" />
        <meta
          name="twitter:description"
          content="Votre parapharmacie en ligne en Tunisie. Conseils santé, beauté et bien-être."
        />
        <meta name="twitter:image" content="/figmaAssets/productsm/flor-a-logos-01-180.png" />
      </Helmet>

      {isMobile ? <ConseilsSantMobile /> : <ConseilsSant />}
    </>
  );
}
