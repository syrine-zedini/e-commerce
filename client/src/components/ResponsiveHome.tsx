import { Home } from '@/pages/Home';
import React from 'react';
import { Helmet } from 'react-helmet-async';

export function ResponsiveHome() {
  return (
    <>
      <Helmet>
        <title>YJ PARA | Parapharmacie en ligne</title>
        <meta
          name="description"
          content="Découvrez YJ PARA, votre parapharmacie en ligne en Tunisie. Produits de beauté, soins, santé et bien-être pour toute la famille."
        />
        <meta name="keywords" content="parapharmacie, santé, beauté, soins, bien-être, yj para, Tunisie" />
        <meta property="og:title" content="YJ PARA | Parapharmacie en ligne" />
        <meta property="og:description" content="Produits de beauté, santé et bien-être – YJ PARA, votre parapharmacie en ligne." />
        <meta property="og:image" content="/figmaAssets/productsm/flor-a-logos-01-180.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="YJ PARA | Parapharmacie en ligne" />
        <meta name="twitter:description" content="Produits de beauté, santé et bien-être – YJ PARA, votre parapharmacie en ligne." />
        <meta name="twitter:image" content="/figmaAssets/productsm/flor-a-logos-01-180.png" />
      </Helmet>

      <Home />
    </>
  );
}
