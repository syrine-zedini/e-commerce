import React from "react";
import { Card } from "@/components/ui/card";
import { FooterMobile } from "@/components/ui/FooterMobile";
import { MobileHeader } from "@/components/MobileHeader";
import { HEADER_LINKS, toMobileFooterSections } from "@/lib/pageData";

  const navLinks = HEADER_LINKS;

  const footerSections = toMobileFooterSections();
export const ContactMobile = (): JSX.Element => {

  return (
    <div className="bg-white grid justify-items-center [align-items:start] w-screen">
      <div className="bg-white overflow-hidden w-full h-[2831px] relative">
      <MobileHeader navLinks={navLinks} />

        {/* Hero Section */}
        <section className="absolute w-[375px] h-40 top-[210px] left-0 bg-[url(/figmaAssets/contactm/rectangle-276.png)] bg-cover bg-[50%_50%]">
          <div className="absolute w-[375px] h-40 top-0 left-0 bg-[linear-gradient(90deg,rgba(69,171,164,1)_0%,rgba(69,171,164,0)_100%)]" />
          <nav className="absolute top-[89px] left-[11px] [font-family:'Inter',Helvetica] font-medium text-text-light text-xs tracking-[0] leading-[normal]">
            Accueil &gt; Contact
          </nav>
          <h1 className="top-[54px] font-bold text-[21px] leading-[normal] absolute left-[11px] [font-family:'Inter',Helvetica] text-text-light tracking-[0] whitespace-nowrap">
            Contact
          </h1>
        </section>
    <div className="bg-white w-full px-4 py-6 flex flex-col items-center mt-36">
      {/* Title */}
      <h2 className="text-black font-bold text-lg md:text-xl text-center mb-2">
        Contactez-nous pour toute question
      </h2>

      {/* Line under title */}
      <div className="relative w-full max-w-[353px] h-1 mb-4">
        <div className="w-full h-1 bg-gray-300 rounded"></div>
        <div className="absolute left-0 top-0 w-10 h-1 bg-app-primary rounded"></div>
      </div>

      {/* Description */}
      <p className="text-text-dark text-xs leading-5 text-center max-w-[353px] mb-6">
        Vous avez une question sur nos produits, le suivi de votre commande ou
        besoin de conseils personnalisés ? L'équipe de Florea est à votre écoute.
        <br />
        N'hésitez pas à nous contacter via le formulaire ci-dessous ou directement
        par e-mail. Nous nous engageons à vous répondre dans les plus brefs délais.
      </p>

      {/* Contact Info */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between gap-4 w-full max-w-[353px] mb-6">
        {/* Address */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-card-background rounded-full flex items-center justify-center text-[#C86D85]">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7V2z" />
            </svg>
          </div>
          <div className="flex flex-col text-xs">
            <span className="font-semibold text-slate-800">Parapharmacie 100% en ligne</span>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-card-background rounded-full flex items-center justify-center">
            <img src="/figmaAssets/contactm/group-1.png" alt="Email" className="w-5 h-4" />
          </div>
          <div className="flex flex-col text-xs">
            <span className="font-normal">Adresse email:</span>
            <span className="font-semibold">
              <a href="mailto:Nourhenbouallegui1@gmail.com" className="hover:underline">
                Nourhenbouallegui1@gmail.com
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* Centered logo card matching height and width of the form */}
      <Card className="w-full max-w-[353px] bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6 flex items-center justify-center min-h-[300px]">
        <div className="w-40 h-40 rounded-full bg-black overflow-hidden flex items-center justify-center shadow-lg">
          <img
            src="/figmaAssets/brand/glow-store-logo.jpeg"
            alt="Glow Store Logo"
            className="w-full h-full object-cover scale-125"
          />
        </div>
      </Card>
   {/* React-hot-toast handles toast notifications */}
    </div>

        {/* Footer */}
          <FooterMobile sections={footerSections} />

      </div>
    </div>
  );
};
