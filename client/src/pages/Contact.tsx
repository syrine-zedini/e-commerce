import {
  MailIcon,
} from "lucide-react";
import React, { useState } from "react";
import Header from "@/components/Header";
import { MobileHeader } from "@/components/MobileHeader";
import Footer from "@/components/Footer";
import { HEADER_LINKS, NAVIGATION_ITEMS, FOOTER_SECTIONS } from "@/lib/pageData";
export const Contact = (): JSX.Element => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigationItems = NAVIGATION_ITEMS;

const footerSections = FOOTER_SECTIONS;

const headerLinks = HEADER_LINKS;

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
        <section className="w-full h-[200px] relative bg-[url(/figmaAssets/contact/rectangle-230.png)] bg-[100%_100%]">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(216,138,158,0.85)_0%,rgba(235,245,252,0.4)_100%)]" />
          <div className="relative px-[84px] py-[57px]">
            <h1 className="[font-family:'Inter',Helvetica] font-bold text-text-light text-[32px] tracking-[0] leading-[normal] mb-4">
              Contact
            </h1>
            <div className="[font-family:'Inter',Helvetica] font-medium text-text-light text-base tracking-[0] leading-[normal]">
              Accueil &gt; Contact
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="w-full px-[84px] mt-8">
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
        <main className="px-6 md:px-12 lg:px-20 py-12">
     
    <section className="w-full">
      {/* Title */}
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
          Contactez-nous pour toute question
        </h1>
        <div className="w-16 h-1 bg-[#C86D85] rounded-full mb-5"></div>
        <p className="max-w-3xl text-base md:text-lg text-slate-500 leading-relaxed">
          Vous avez une question sur nos produits, le suivi de votre commande ou
          besoin de conseils personnalisés ? L&#39;équipe de Florea est à votre
          écoute. <br />
          N&#39;hésitez pas à nous contacter via le formulaire ci-dessous ou
          directement par e-mail. Nous nous engageons à vous répondre dans les
          plus brefs délais.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
        {/* Left side: Contact info cards */}
        <div className="lg:col-span-2 space-y-5">
          {/* Adresse */}
          <div className="group bg-white rounded-2xl border border-slate-100 p-6 flex items-center gap-5 shadow-sm hover:shadow-md hover:border-[#C86D85]/30 transition-all duration-300 cursor-default">
            <div className="w-14 h-14 bg-[#F7F0DC] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#C86D85] transition-colors duration-300">
              <svg className="w-6 h-6 text-[#C86D85] group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7V2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-base">
                Parapharmacie 100% en ligne
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="group bg-white rounded-2xl border border-slate-100 p-6 flex items-center gap-5 shadow-sm hover:shadow-md hover:border-[#C86D85]/30 transition-all duration-300 cursor-default">
            <div className="w-14 h-14 bg-[#F7F0DC] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#C86D85] transition-colors duration-300">
              <MailIcon className="w-6 h-6 text-[#C86D85] group-hover:text-white transition-colors duration-300" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Email</p>
              <a href="mailto:y.jabbes@yjpharmaconsult.com" className="font-semibold text-slate-800 text-base hover:text-[#C86D85] transition-colors">
                y.jabbes@yjpharmaconsult.com
              </a>
            </div>
          </div>
        </div>

        {/* Right side: logo card matching height and width of the form */}
        <div className="lg:col-span-3 flex items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-10 min-h-[480px] w-full">
          <div className="w-56 h-56 rounded-full bg-black overflow-hidden flex items-center justify-center shadow-lg">
            <img
              src="/figmaAssets/brand/glow-store-logo.jpeg"
              alt="Glow Store Logo"
              className="w-full h-full object-cover scale-125 hover:scale-[1.35] transition-transform duration-300"
            />
          </div>
        </div>
      </div>
    </section>

        </main>

           {/* React-hot-toast handles toast notifications */}

        {/* Footer */}
           <Footer footerSections={footerSections} />

      </div>
    </div>
  );
};
