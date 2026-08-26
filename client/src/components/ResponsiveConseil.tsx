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
        <title>GLOW Store - Conseils Santé &amp; Bien-être</title>
        <meta
          name="description"
          content="Découvrez nos conseils santé et bien-être sur GLOW Store en Tunisie. Astuces beauté, soins et santé pour toute la famille."
        />
        <meta
          name="keywords"
          content="GLOW, conseils santé, bien-être, beauté, soins, parapharmacie, Tunisie"
        />
        <meta property="og:title" content="GLOW Store - Conseils Santé &amp; Bien-être" />
        <meta
          property="og:description"
          content="Astuces et conseils santé, beauté et bien-être – GLOW Store."
        />
        <meta property="og:image" content="/figmaAssets/brand/glow-store-logo.jpeg" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="GLOW Store - Conseils Santé &amp; Bien-être" />
        <meta
          name="twitter:description"
          content="GLOW Store en Tunisie. Conseils santé, beauté et bien-être."
        />
        <meta name="twitter:image" content="/figmaAssets/brand/glow-store-logo.jpeg" />
      </Helmet>

      {isMobile ? <ConseilsSantMobile /> : <ConseilsSant />}
    </>
  );
}
