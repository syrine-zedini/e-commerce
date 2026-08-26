import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FooterMobile } from "@/components/ui/FooterMobile";
import { MobileHeader } from "@/components/MobileHeader";
import { Link } from "wouter";
import { HEADER_LINKS, toMobileFooterSections } from "@/lib/pageData";
import { useConseils } from "@/hooks/useConseils";

export const ProposMobile = (): JSX.Element => {
  const footerSections = toMobileFooterSections();
  const productCategories = useConseils();
  void productCategories;

  const brandLogos = [
    { src: "/figmaAssets/aproposm/177.png", alt: "Brand 1" },
    { src: "/figmaAssets/aproposm/36.png", alt: "Brand 2" },
    { src: "/figmaAssets/aproposm/8.png", alt: "Brand 3" },
    { src: "/figmaAssets/aproposm/77.png", alt: "Brand 4" },
    { src: "/figmaAssets/aproposm/57.png", alt: "Brand 5" },
  ];

  const features = [
    {
      icon: "/figmaAssets/aproposm/secure-payment.png",
      title: "Procéder au paiement",
      description: "Payez en espèces à la réception de votre commande.",
      link: "/propos",
    },
    {
      icon: "/figmaAssets/aproposm/group-84.png",
      title: "Produits certifiés",
      description: "Nos articles respectent des normes de qualité strictes.",
      link: "/propos",
    },
    {
      icon: "/figmaAssets/aproposm/vector-1.svg",
      title: "Livraison rapide",
      description: "Recevez votre commande dans les plus brefs délais.",
      link: "/propos",
    },
    {
      icon: "/figmaAssets/aproposm/group-85.png",
      title: "Service client 24/7",
      description: "Notre équipe est disponible pour vous aider à tout moment.",
      link: "/contact",
    },
  ];

  const missionPoints = [
    {
      icon: "/figmaAssets/aproposm/secure-payment-1.png",
      title: "Garantir un achat simple, rapide et sécurisé",
    },
    {
      icon: "/figmaAssets/aproposm/group-84-1.png",
      title:
        "Offrir des produits de qualité, certifiés et adaptés à chaque besoin",
    },
    {
      icon: "/figmaAssets/aproposm/vector-1.svg",
      title:
        "Créer un espace de confiance en ligne, où le client est au centre de tout",
    },
  ];
  const navLinks = HEADER_LINKS;

  return (
    <div className="bg-white grid justify-items-center [align-items:start] w-screen">
      <div className="bg-white overflow-hidden w-[375px] relative">
      <MobileHeader navLinks={navLinks} />


    {/* Hero Section */}
    <section className="relative w-full h-40 bg-[url('/figmaAssets/aproposm/rectangle-276.png')] bg-cover rounded-lg mb-6 flex items-end p-4 text-white">
      <nav className="text-xs">Accueil &gt; à propos</nav>
      <h1 className="font-bold text-lg">À propos</h1>
    </section>

    {/* Main Content */}
<main className="space-y-6 px-4 md:px-6">
      {/* About Image */}
      <img
        className="w-full h-auto rounded-lg"
        alt="About us"
        src="/figmaAssets/aproposm/rectangle-267.svg"
      />

      {/* Mission */}
      <section className="space-y-2">
        <h2 className="text-black font-bold text-lg leading-6">
          Notre parapharmacie est née de la volonté de rendre les soins parapharmaceutiques plus accessibles, plus proches des gens et parfaitement adaptés aux besoins de chacun.
        </h2>
        <p className="text-text-dark text-xs">
          Notre mission : être à vos côtés au quotidien en vous proposant une sélection soigneusement élaborée de produits reconnus pour leur efficacité et leur qualité...
        </p>
      </section>

      {/* Mission Points */}
      <div className="space-y-4">
        {missionPoints.map((point, idx) => (
          <Card key={idx} className="flex items-start gap-4 p-4 rounded-lg bg-card-background">
            <div className="w-12 h-12 bg-text-light rounded-full flex items-center justify-center">
              <img src={point.icon} alt={point.title} className="w-6 h-6" />
            </div>
            <p className="font-semibold text-text-dark text-xs">{point.title}</p>
          </Card>
        ))}
      </div>



      {/* Brands */}
      <section>
        <h2 className="font-bold text-lg text-black mb-2">Marques populaires</h2>
        <ScrollArea className="w-full">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {brandLogos.map((brand, idx) => (
              <Card key={idx} className="flex-shrink-0 w-60 h-40 rounded-lg bg-card-background flex items-center justify-center border border-slate-100/50 hover:border-[#C86D85]/25 hover:shadow-md active:scale-95 transition-all duration-300 group cursor-pointer">
                <CardContent className="p-2">
                  <img src={brand.src} alt={brand.alt} className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105" />
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </section>

      {/* Features */}
      <section className="space-y-4">
        {features.map((feat, idx) => (
          <Link key={idx} to={feat.link} className="block cursor-pointer">
            <Card className="flex items-center gap-4 p-4 rounded-lg bg-card-background border border-transparent hover:border-[#C86D85]/20 hover:shadow-md transition-all duration-300 group">
              <div className="w-16 h-16 bg-text-light rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-[#C86D85]/10 transition-colors duration-300">
                <img src={feat.icon} alt={feat.title} className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div>
                <h3 className="font-semibold text-text-dark text-sm group-hover:text-[#C86D85] transition-colors">{feat.title}</h3>
                <p className="text-[11px] text-text-dark mt-1">{feat.description}</p>
              </div>
            </Card>
          </Link>
        ))}
      </section>
    </main>

    {/* Footer */}
    <FooterMobile sections={footerSections} />
  </div>
</div>

  );
};