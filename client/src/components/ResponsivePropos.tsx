import { Propos } from '@/pages/Propos';
import React from 'react';
import { Helmet } from 'react-helmet-async';

export function ResponsivePropos() {
  return (
    <>
      <Helmet>
        <title>GLOW Store - À propos</title>
        <meta
          name="description"
          content="En savoir plus sur GLOW Store en Tunisie. Notre mission, notre équipe et nos engagements pour la santé et le bien-être."
        />
        <meta
          name="keywords"
          content="GLOW, à propos, parapharmacie, santé, beauté, soins, Tunisie"
        />
        <meta property="og:title" content="GLOW Store - À propos" />
        <meta
          property="og:description"
          content="Découvrez GLOW Store en Tunisie, et notre engagement pour la santé et le bien-être."
        />
        <meta property="og:image" content="/figmaAssets/brand/glow-store-logo.jpeg" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="GLOW Store - À propos" />
        <meta
          name="twitter:description"
          content="En savoir plus sur GLOW Store en Tunisie."
        />
        <meta name="twitter:image" content="/figmaAssets/brand/glow-store-logo.jpeg" />
      </Helmet>

      <Propos />
    </>
  );
}

