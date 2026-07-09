import { Produits } from '@/pages/Produits';
import React from 'react';
import { Helmet } from 'react-helmet-async';

export function ResponsiveProducts() {
  return (
    <>
      <Helmet>
        <title>YJ PARA | Produits de Santé &amp; Beauté</title>
        <meta
          name="description"
          content="Découvrez notre gamme complète de produits de santé, beauté et bien-être sur YJ PARA, votre parapharmacie en ligne en Tunisie."
        />
        <meta name="keywords" content="produits, parapharmacie, santé, beauté, soins, Tunisie" />
        <meta property="og:title" content="YJ PARA | Produits de Santé & Beauté" />
        <meta
          property="og:description"
          content="Explorez YJ PARA, votre parapharmacie en ligne, pour tous vos besoins en santé, beauté et bien-être."
        />
        <meta property="og:image" content="/figmaAssets/productsm/flor-a-logos-01-180.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="YJ PARA | Produits de Santé & Beauté" />
        <meta
          name="twitter:description"
          content="YJ PARA, votre parapharmacie en ligne en Tunisie. Produits de santé, beauté et bien-être."
        />
        <meta name="twitter:image" content="/figmaAssets/productsm/flor-a-logos-01-180.png" />
      </Helmet>

      <Produits />
    </>
  );
}
