import { Produits } from '@/pages/Produits';
import React from 'react';
import { Helmet } from 'react-helmet-async';

export function ResponsiveProducts() {
  return (
    <>
      <Helmet>
        <title>GLOW Store - Produits de Santé &amp; Beauté</title>
        <meta
          name="description"
          content="Découvrez la gamme complète de produits de santé, beauté et bien-être sur GLOW Store en Tunisie."
        />
        <meta name="keywords" content="GLOW, produits, parapharmacie, santé, beauté, soins, Tunisie" />
        <meta property="og:title" content="GLOW Store - Produits de Santé &amp; Beauté" />
        <meta
          property="og:description"
          content="Explorez GLOW Store pour tous vos besoins en santé, beauté et bien-être."
        />
        <meta property="og:image" content="/figmaAssets/brand/glow-store-logo.jpeg" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="GLOW Store - Produits de Santé &amp; Beauté" />
        <meta
          name="twitter:description"
          content="GLOW Store en Tunisie. Produits de santé, beauté et bien-être."
        />
        <meta name="twitter:image" content="/figmaAssets/brand/glow-store-logo.jpeg" />
      </Helmet>

      <Produits />
    </>
  );
}
