import { Propos } from '@/pages/Propos';
import React from 'react';
import { Helmet } from 'react-helmet-async';

export function ResponsivePropos() {
  return (
    <>
      <Helmet>
        <title>YJ PARA | À propos</title>
        <meta
          name="description"
          content="En savoir plus sur YJ PARA, votre parapharmacie en ligne en Tunisie. Notre mission, notre équipe et nos engagements pour la santé et le bien-être."
        />
        <meta
          name="keywords"
          content="YJ PARA, à propos, parapharmacie, santé, beauté, soins, Tunisie"
        />
        <meta property="og:title" content="YJ PARA | À propos" />
        <meta
          property="og:description"
          content="Découvrez YJ PARA, votre parapharmacie en ligne en Tunisie, et notre engagement pour la santé et le bien-être."
        />
        <meta property="og:image" content="/figmaAssets/productsm/flor-a-logos-01-180.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="YJ PARA | À propos" />
        <meta
          name="twitter:description"
          content="En savoir plus sur YJ PARA, votre parapharmacie en ligne en Tunisie."
        />
        <meta name="twitter:image" content="/figmaAssets/productsm/flor-a-logos-01-180.png" />
      </Helmet>

      <Propos />
    </>
  );
}

