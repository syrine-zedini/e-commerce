import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck, BadgeCheck, Zap, Headphones } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import Header from "@/components/Header";
import { MobileHeader } from "@/components/MobileHeader";
import Footer from "@/components/Footer";
import { HEADER_LINKS, NAVIGATION_ITEMS, FOOTER_SECTIONS } from "@/lib/pageData";
import { useConseils } from "@/hooks/useConseils";
import { useBrandLogos } from "@/hooks/useBrandLogos";

const serviceFeatures = [
  {
    icon: ShieldCheck,
    title: "Paiement à la livraison",
    description: "Payez en espèces à la réception de votre commande.",
    link: "/propos",
    bgClass: "bg-indigo-50/80 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_10px_20px_-5px_rgba(79,70,229,0.3)]",
  },
  {
    icon: BadgeCheck,
    title: "Produits certifiés",
    description: "Nos articles respectent des normes de qualité strictes.",
    link: "/propos",
    bgClass: "bg-rose-50/80 text-rose-600 group-hover:bg-rose-600 group-hover:text-white group-hover:shadow-[0_10px_20px_-5px_rgba(217,119,6,0.3)]",
  },
  {
    icon: Zap,
    title: "Livraison rapide",
    description: "Recevez votre commande dans les plus brefs délais.",
    link: "/propos",
    bgClass: "bg-emerald-50/80 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-[0_10px_20px_-5px_rgba(5,150,105,0.3)]",
  },
  {
    icon: Headphones,
    title: "Service client 24/7",
    description: "Notre équipe est disponible pour vous aider à tout moment.",
    link: "/contact",
    bgClass: "bg-rose-50/80 text-rose-600 group-hover:bg-rose-600 group-hover:text-white group-hover:shadow-[0_10px_20px_-5px_rgba(219,39,119,0.3)]",
  },
];

const missionPoints = [
  {
    icon: "/figmaAssets/propos/secure-payment-1.png",
    text: "Garantir un achat simple, rapide et sécurisé",
  },
  {
    icon: "/figmaAssets/propos/group-84-1.png",
    text: "Offrir des produits de qualité, certifiés et adaptés à chaque besoin",
  },
  {
    icon: "/figmaAssets/propos/vector.svg",
    text: "Créer un espace de confiance en ligne, où le client est au centre de tout",
  },
];



const footerSections = FOOTER_SECTIONS;

  const navigationItems = NAVIGATION_ITEMS;

const headerLinks = HEADER_LINKS;
export const Propos = (): JSX.Element => {

    const [isCartOpen, setIsCartOpen] = useState(false);
    const categoryCards = useConseils();
    void categoryCards;
    const brandLogos = useBrandLogos();

    // Brand slider
    const brandScrollRef = useRef<HTMLDivElement>(null);
    const [isDraggingBrand, setIsDraggingBrand] = useState(false);
    const [startXBrand, setStartXBrand] = useState(0);
    const [scrollLeftBrand, setScrollLeftBrand] = useState(0);

    const handleMouseDownBrand = (e: React.MouseEvent) => {
      setIsDraggingBrand(true);
      setStartXBrand(e.pageX - (brandScrollRef.current?.offsetLeft || 0));
      setScrollLeftBrand(brandScrollRef.current?.scrollLeft || 0);
    };
    const handleMouseLeaveOrUpBrand = () => setIsDraggingBrand(false);
    const handleMouseMoveBrand = (e: React.MouseEvent) => {
      if (!isDraggingBrand) return;
      e.preventDefault();
      const x = e.pageX - (brandScrollRef.current?.offsetLeft || 0);
      const walk = (x - startXBrand) * 1.5;
      if (brandScrollRef.current) brandScrollRef.current.scrollLeft = scrollLeftBrand - walk;
    };
    const handleTouchStartBrand = (e: React.TouchEvent) => {
      setIsDraggingBrand(true);
      setStartXBrand(e.touches[0].pageX - (brandScrollRef.current?.offsetLeft || 0));
      setScrollLeftBrand(brandScrollRef.current?.scrollLeft || 0);
    };
    const handleTouchMoveBrand = (e: React.TouchEvent) => {
      if (!isDraggingBrand) return;
      const x = e.touches[0].pageX - (brandScrollRef.current?.offsetLeft || 0);
      const walk = (x - startXBrand) * 1.5;
      if (brandScrollRef.current) brandScrollRef.current.scrollLeft = scrollLeftBrand - walk;
    };

  return (
   <div className="bg-white grid justify-items-center w-screen">
      <div className="bg-white overflow-hidden w-full max-w-[1920px] min-h-screen relative">

        {/* Header */}
        <div className="hidden md:block">
          <Header
            headerLinks={headerLinks}
            navigationItems={navigationItems}
            isCartOpen={isCartOpen}
            setIsCartOpen={setIsCartOpen}
          />
        </div>
        <div className="block md:hidden">
          <MobileHeader navLinks={headerLinks} />
        </div>

        {/* Hero Section */}
        <section className="w-full h-[160px] md:h-[200px] relative bg-[url(/figmaAssets/propos/rectangle-230.png)] bg-cover md:bg-[100%_100%]">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(216,138,158,0.85)_0%,rgba(235,245,252,0.4)_100%)]" />
          <div className="relative px-6 md:px-[84px] py-8 md:py-[57px]">
            <h1 className="[font-family:'Inter',Helvetica] font-bold text-text-light text-2xl md:text-[32px] tracking-[0] leading-[normal] mb-4">
              A propos
            </h1>
            <div className="[font-family:'Inter',Helvetica] font-medium text-text-light text-sm md:text-base tracking-[0] leading-[normal]">
              Accueil &gt; A propos
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="w-full px-6 md:px-[84px] mt-8">
          <div className="relative">
            <img
              className="w-full h-[3px]"
              alt="Line"
              src="/figmaAssets/marques/line-8.svg"
            />
            <img
              className="absolute top-0 left-0 w-[38px] h-[7px]"
              alt="Line accent"
              src="/figmaAssets/marques/line-9.svg"
            />
          </div>
        </div>

        {/* Main Content */}
        <main className="px-6 md:px-[84px] py-8">
          <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-start">
            {/* Image */}
            <img
              className="w-full md:w-1/2 h-[515px] lg:h-[575px] rounded-2xl object-cover shadow-lg"
              alt="About us"
              src="/figmaAssets/propos/rectangle-267.svg"
            />

            {/* Texte */}
            <div className="flex-1 w-full">
      <h2 className="font-bold text-black text-lg sm:text-xl lg:text-2xl leading-snug mb-6">
        Notre parapharmacie est née de la volonté de rendre les soins
        parapharmaceutiques plus accessibles, plus proches des gens
        et parfaitement adaptés aux besoins de chacun.
      </h2>

      <div className="space-y-4 mb-8">
        <p className="text-gray-700 text-base leading-relaxed">
          <span className="font-bold">Notre mission :</span> être à vos côtés
          au quotidien en vous proposant une sélection soigneusement élaborée
          de produits reconnus pour leur efficacité et leur qualité. L&apos;écoute,
          l&apos;expertise d&apos;un docteur en pharmacie et l&apos;exigence qualité sont au
          fondement de notre engagement, soutenus par une offre large et diversifiée.
        </p>

        <p className="text-gray-700 text-base leading-relaxed">
          Chez nous, chaque produit est choisi avec soin pour prendre soin de vous :
          des sélections rigoureuses, des conseils sur mesure, et une équipe disponible
          pour vous accompagner à chaque instant de votre parcours bien-être.
        </p>
      </div>

      <Card className="bg-card-background rounded-xl border-0 shadow-sm">
        <CardContent className="p-6 space-y-4">
          {missionPoints.map((point, index) => (
            <div key={index} className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                style={{ background: 'linear-gradient(135deg, #C86D85 0%, #1D4ED8 100%)' }}
              >
                <img
                  className="max-w-[26px] max-h-[26px] brightness-0 invert"
                  alt="Feature icon"
                  src={point.icon}
                />
              </div>
              <span className="font-semibold text-gray-800 text-sm leading-snug">
                {point.text}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  </div>
    

        </main>



{/* Popular Brands */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6">
        <div className="h-[1px] bg-slate-100 relative">
          <div className="absolute top-0 left-0 w-16 h-[2px] bg-[#C86D85]" />
        </div>
      </div>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <span className="text-[11px] font-bold text-[#C86D85] tracking-[0.2em] uppercase mb-2 block">NOS PARTENAIRES</span>
            <h2 className="text-2xl lg:text-4xl font-extrabold text-slate-800 tracking-tight">
              Marques populaires
            </h2>
            <div className="w-14 h-[3px] bg-gradient-to-r from-[#C86D85] to-amber-400 mt-4 rounded-full" />
          </div>

          <div className="relative group/brand-slider w-full max-w-full mx-auto">
            <button
              onClick={() => { brandScrollRef.current?.scrollBy({ left: -260, behavior: "smooth" }); }}
              className="absolute left-0 md:-left-12 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-11 md:h-11 rounded-full bg-white border border-slate-200/80 shadow-md hover:shadow-lg active:scale-95 hover:scale-105 transition-all duration-300 flex items-center justify-center text-slate-600 hover:text-[#C86D85] focus:outline-none cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <button
              onClick={() => { brandScrollRef.current?.scrollBy({ left: 260, behavior: "smooth" }); }}
              className="absolute right-0 md:-right-12 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-11 md:h-11 rounded-full bg-white border border-slate-200/80 shadow-md hover:shadow-lg active:scale-95 hover:scale-105 transition-all duration-300 flex items-center justify-center text-slate-600 hover:text-[#C86D85] focus:outline-none cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <div
              ref={brandScrollRef}
              className="flex space-x-6 overflow-x-auto pb-4 px-10 md:px-0 scrollbar-hide cursor-grab active:cursor-grabbing scroll-smooth"
              onMouseDown={handleMouseDownBrand}
              onMouseLeave={handleMouseLeaveOrUpBrand}
              onMouseUp={handleMouseLeaveOrUpBrand}
              onMouseMove={handleMouseMoveBrand}
              onTouchStart={handleTouchStartBrand}
              onTouchEnd={handleMouseLeaveOrUpBrand}
              onTouchMove={handleTouchMoveBrand}
            >
              {brandLogos.map((brand, index) => (
                <Card key={index} className="bg-white rounded-2xl border border-slate-100/80 hover:border-[#C86D85]/20 aspect-square w-40 sm:w-48 md:w-52 flex-shrink-0 hover:shadow-card hover:-translate-y-1.5 transition-all duration-400 ease-[cubic-bezier(0.25,0.8,0.25,1)]">
                  <CardContent className="p-6 h-full flex items-center justify-center">
                    <img
                      className="max-w-full max-h-full object-contain transition-all duration-300"
                      alt="Brand logo"
                      src={brand.image}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

    {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6">
        <div className="h-[1px] bg-slate-100 relative">
          <div className="absolute top-0 left-0 w-16 h-[2px] bg-[#C86D85]" />
        </div>
      </div>

      {/* Service features */}
      <section className="py-20 bg-gray-100 border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceFeatures.map((feature, index) => (
              <Link key={index} to={feature.link} className="block cursor-pointer">
                <Card className="bg-white rounded-2xl border border-slate-100/80 hover:shadow-card hover:border-[#C86D85]/15 hover:-translate-y-1 transition-all duration-400 ease-[cubic-bezier(0.25,0.8,0.25,1)] group h-full">
                  <CardContent className="p-7 sm:p-8 flex items-center space-x-5 sm:space-x-6 h-full">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-sm ${feature.bgClass}`}>
                      <feature.icon
                        className="w-8 h-8 sm:w-10 sm:h-10 transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 text-base sm:text-lg mb-2 group-hover:text-[#C86D85] transition-colors leading-snug">
                        {feature.title}
                      </h3>
                      <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
        {/* Footer */}
            <Footer footerSections={footerSections} />

      </div>
    </div>
  );
};