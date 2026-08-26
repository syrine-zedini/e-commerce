import { Home } from '@/pages/Home';
import React from 'react';
import { Helmet } from 'react-helmet-async';

export function ResponsiveHome() {
  return (
    <>
      <Helmet>
        <title>GLOW Store - Parapharmacie en Ligne</title>
        <meta
          name="description"
          content="Découvrez GLOW Store, votre parapharmacie en ligne en Tunisie. Produits de beauté, soins, santé et bien-être pour toute la famille."
        />
        <meta name="keywords" content="GLOW, parapharmacie, santé, beauté, soins, bien-être, Tunisie" />
        <meta property="og:title" content="GLOW Store - Parapharmacie en Ligne" />
        <meta property="og:description" content="Produits de beauté, santé et bien-être – votre parapharmacie GLOW Store." />
        <meta property="og:image" content="/figmaAssets/brand/glow-store-logo.jpeg" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="GLOW Store - Parapharmacie en Ligne" />
        <meta name="twitter:description" content="Produits de beauté, santé et bien-être – votre parapharmacie GLOW Store." />
        <meta name="twitter:image" content="/figmaAssets/brand/glow-store-logo.jpeg" />
      </Helmet>

      <Home />
    </>
  );
}
