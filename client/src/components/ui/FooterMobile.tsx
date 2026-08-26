import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Separator } from "./separator";
import { FaInstagram, FaFacebookF } from "react-icons/fa";
import { apiGet } from "@/lib/api";
import { FOOTER_TITLE_LINKS } from "@/lib/pageData";

interface FooterSection {
  title: string;
  items: string[];
  routeLinks?: string[];
}

const TITLE_LINKS = FOOTER_TITLE_LINKS;

interface FooterMobileProps {
  sections?: FooterSection[];
}

export const FooterMobile: React.FC<FooterMobileProps> = ({ sections }) => {
  const [, setLocation] = useLocation();
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  // Smart navigation: forces re-render even on same path
  const handleNavigation = (href: string) => {
    if (href.startsWith("/#")) {
      const hash = href.slice(1);
      if (window.location.pathname === "/") {
        const id = hash.slice(1);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = href;
      }
      return;
    }
    setLocation(href);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await apiGet("/api/categories").catch(() => null);
      if (data) {
        setCategories(data);
      }
    };
    fetchCategories();
  }, []);

  const defaultSections: FooterSection[] = [
    {
      title: "INFORMATIONS",
      items: ["Produits"],
      routeLinks: ["/products"],
    },
    {
      title: "PRODUITS",
      items: ["Promotions", "Nouveaux produits", "Meilleures ventes"],
      routeLinks: ["/#promotions", "/#derniers-produits", "/#meilleurs-produits"],
    },
    {
      title: "CATÉGORIES",
      items: categories.map(c => c.name),
      routeLinks: categories.map(c => `/products?category=${c.id}`),
    },
  ];

  const footerSections = sections ?? defaultSections;

  const activeFooterSections = footerSections.map((section) => {
    if (section.title.toUpperCase() === "CATÉGORIES") {
      return {
        ...section,
        items: categories.map(c => c.name),
        routeLinks: categories.map(c => `/products?category=${c.id}`),
      };
    }
    if (section.title.toUpperCase() === "PRODUITS") {
      return {
        ...section,
        items: ["Promotions", "Nouveaux produits", "Meilleures ventes"],
        routeLinks: ["/#promotions", "/#derniers-produits", "/#meilleurs-produits"],
      };
    }
    return section;
  });

  const categoriesSection = activeFooterSections.find(
    s => s.title.toUpperCase() === "CATÉGORIES"
  );
  const otherSections = activeFooterSections.filter(
    s => s.title.toUpperCase() !== "CATÉGORIES"
  );

  return (
    <footer className="bg-[#FDF5F6] text-slate-800 mt-16 border-t border-rose-100">
      {/* Brand block */}
      <div className="bg-white border-b border-rose-100/60 p-6">
        <div className="w-16 h-16 rounded-full bg-black overflow-hidden flex items-center justify-center mb-6 shadow-md">
          <img
            className="w-full h-full object-cover scale-125"
            alt="Glow Store logo"
            src="/figmaAssets/brand/glow-store-logo.jpeg"
          />
        </div>

        <p className="[font-family:'Inter',Helvetica] font-normal text-slate-500 text-xs leading-relaxed mb-8 max-w-[314px]">
          Une sélection de produits cosmétiques pensée pour révéler votre
          beauté naturelle et prendre soin de vous au quotidien.
        </p>

        <div className="flex gap-4 mt-8">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-[#C86D85] cursor-default">
            <FaFacebookF className="w-4 h-4" />
          </div>
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-[#C86D85] cursor-default">
            <FaInstagram className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="p-6 pt-8 bg-[#FDF5F6]">

        {/* INFORMATIONS & PRODUITS — 2 columns */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {otherSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <div className="mb-4">
                <button
                  onClick={() => handleNavigation(TITLE_LINKS[section.title.toUpperCase()] || "#")}
                  className="hover:text-[#C86D85] transition-colors text-left"
                >
                  <h3 className="[font-family:'Poppins','Inter',Helvetica] font-bold text-slate-800 text-sm mb-2 tracking-wide hover:text-[#C86D85] transition-colors cursor-pointer">
                    {section.title}
                  </h3>
                </button>
                <div className="w-[38px] h-1 bg-[#C86D85] rounded-full"></div>
              </div>
              <div className="space-y-3">
                {section.items.map((item, index) => {
                  const href = section.routeLinks?.[index] ?? '#';
                  return (
                    <button
                      key={index}
                      onClick={() => handleNavigation(href)}
                      className="[font-family:'Poppins','Inter',Helvetica] font-normal text-xs leading-5 block text-left text-slate-500 hover:text-[#C86D85] transition-colors duration-300 cursor-pointer w-full"
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* CATÉGORIES — full width, 2-column grid */}
        {categoriesSection && (
          <div className="mb-8 border-t border-slate-200 pt-6">
            <div className="mb-4">
              <button
                onClick={() => handleNavigation("/products")}
                className="hover:text-[#C86D85] transition-colors text-left"
              >
                <h3 className="[font-family:'Poppins','Inter',Helvetica] font-bold text-slate-800 text-sm mb-2 tracking-wide hover:text-[#C86D85] transition-colors cursor-pointer">
                  {categoriesSection.title}
                </h3>
              </button>
              <div className="w-[38px] h-1 bg-[#C86D85] rounded-full"></div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {categoriesSection.items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigation(categoriesSection.routeLinks?.[index] ?? '#')}
                  className="[font-family:'Poppins','Inter',Helvetica] font-normal text-xs leading-5 text-left text-slate-500 hover:text-[#C86D85] transition-colors duration-300 cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* NEWSLETTER */}
        <div className="border-t border-slate-200 pt-6 mb-8">
          <div className="mb-4">
            <Link href="/contact" className="hover:text-[#C86D85] transition-colors">
              <h3 className="[font-family:'Poppins','Inter',Helvetica] font-bold text-slate-800 text-sm mb-2 tracking-wide hover:text-[#C86D85] transition-colors cursor-pointer">
                NEWSLETTRES
              </h3>
            </Link>
            <div className="w-[38px] h-1 bg-[#C86D85] rounded-full"></div>
          </div>
          <p className="[font-family:'Poppins','Inter',Helvetica] font-normal text-xs leading-5 text-slate-500">
            Vous pouvez vous désinscrire à tout moment.
            Pour ce faire, veuillez trouver nos coordonnées.
          </p>
        </div>

        <Separator className="my-6 bg-slate-200" />

        <p className="[font-family:'Inter',Helvetica] font-medium text-xs text-center text-slate-400">
          <span>COPYRIGHT © 2026</span>
          <br />
          <span className="text-slate-400 font-normal mt-1 block">
            powered by <a href="https://genzbuildersltd.com/" target="_blank" rel="noopener noreferrer" className="text-[#C86D85] font-bold hover:underline">GenZ builders</a>
          </span>
        </p>
      </div>
    </footer>
  );
};
