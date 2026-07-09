import { Separator } from "@radix-ui/react-separator";
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import { apiGet } from "@/lib/api";
import { FOOTER_TITLE_LINKS } from "@/lib/pageData";

interface FooterSection {
  title: string;
  links: { name: string; href: string }[];
}

interface FooterProps {
  footerSections?: FooterSection[];
}

const TITLE_LINKS = FOOTER_TITLE_LINKS;

const Footer: React.FC<FooterProps> = ({ footerSections }) => {
  const [, setLocation] = useLocation();
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  // Smart navigation: force re-render even if already on the same path
  const handleNavigation = (href: string) => {
    if (href.startsWith("/#")) {
      const hash = href.slice(1); // -> #section
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
      links: [
        { name: "À Propos", href: "/propos" },
        { name: "Produits", href: "/products" },
        { name: "Contact", href: "/contact" },
      ],
    },
    {
      title: "PRODUITS",
      links: [
        { name: "Promotions", href: "/#promotions" },
        { name: "Nouveaux produits", href: "/#derniers-produits" },
        { name: "Meilleures ventes", href: "/#meilleurs-produits" },
      ],
    },
    {
      title: "CATÉGORIES",
      links: categories.map(cat => ({
        name: cat.name,
        href: `/products?category=${cat.id}`
      })),
    },
    {
      title: "CONTACT",
      links: [
        { name: "Nous contacter", href: "/contact" },
        { name: "+216 53 230 222", href: "tel:+21653230222" },
      ],
    },
  ];

  const sectionsToRender = footerSections || defaultSections;

  const activeFooterSections = sectionsToRender.map((section) => {
    if (section.title.toUpperCase() === "CATÉGORIES") {
      return {
        ...section,
        links: categories.map(cat => ({
          name: cat.name,
          href: `/products?category=${cat.id}`
        })),
      };
    }
    if (section.title.toUpperCase() === "PRODUITS") {
      return {
        ...section,
        links: [
          { name: "Promotions", href: "/#promotions" },
          { name: "Nouveaux produits", href: "/#derniers-produits" },
          { name: "Meilleures ventes", href: "/#meilleurs-produits" },
        ],
      };
    }
    return section;
  });

  // Separate categories section from the rest
  const categoriesSection = activeFooterSections.find(
    s => s.title.toUpperCase() === "CATÉGORIES"
  );
  const otherSections = activeFooterSections.filter(
    s => s.title.toUpperCase() !== "CATÉGORIES"
  );

  return (
    <footer className="bg-[#EBF5FC] text-slate-800 border-t border-slate-200">
      <div className="flex flex-col lg:flex-row">
        {/* Company info section */}
        <div className="lg:w-1/3 bg-white p-8 lg:p-12 border-r border-slate-100">
          <img
            className="w-28 lg:w-[140px] h-auto mb-8"
            alt="YJ PARA logo"
            src="/figmaAssets/logo YJPARA.jpeg"
          />

          <p className="text-slate-500 text-sm leading-relaxed mb-8 font-medium">
            YJ PARA est née d'une ambition claire : rendre les soins de
            parapharmacie plus accessibles, plus humains et parfaitement adaptés
            aux besoins de chacun.
          </p>

          <div className="mb-4">
            <div className="text-slate-400 font-semibold text-sm tracking-wide uppercase">Appelez nous sur :</div>
            <div className="text-[#1D8EE6] font-bold text-3xl lg:text-4xl mt-2">
              <a href="tel:+21653230222" className="hover:text-blue-400 transition-colors">
                +216 53 230 222
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-[40px]">
            <a
              href="https://www.facebook.com/profile.php?id=61590827016876"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:text-white hover:bg-[#1D8EE6] hover:scale-105 transition-all duration-300"
            >
              <FaFacebookF className="w-4 h-4" />
            </a>
            <a
              href="https://www.instagram.com/yjpara.96830757?igsh=MW4zejl6NTVkeGk0Mw=="
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:text-white hover:bg-gradient-to-br hover:from-[#E1306C] hover:to-[#833AB4] hover:scale-105 transition-all duration-300"
            >
              <FaInstagram className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Footer links */}
        <div className="lg:w-2/3 bg-transparent p-8 lg:p-12">

          {/* Top row: Informations, Produits, Contact, Newslettres */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {otherSections.map((section, index) => (
              <div key={index}>
                <div className="mb-4">
                  <button
                    onClick={() => handleNavigation(TITLE_LINKS[section.title.toUpperCase()] || "#")}
                    className="hover:text-[#1D8EE6] transition-colors text-left"
                  >
                    <h3 className="font-bold text-slate-800 text-base mb-2 hover:text-[#1D8EE6] transition-colors cursor-pointer">
                      {section.title}
                    </h3>
                  </button>
                  <Separator className="w-10 h-1 bg-[#1D8EE6] rounded-full" />
                </div>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <button
                        onClick={() => handleNavigation(link.href)}
                        className="text-slate-500 hover:text-[#1D8EE6] transition-colors text-sm font-medium text-left w-full"
                      >
                        {link.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter section */}
            <div>
              <div className="mb-4">
                <Link to="/contact" className="hover:text-[#1D8EE6] transition-colors">
                  <h3 className="font-bold text-slate-800 text-base mb-2 hover:text-[#1D8EE6] transition-colors cursor-pointer">
                    NEWSLETTRES
                  </h3>
                </Link>
                <Separator className="w-10 h-1 bg-[#1D8EE6] rounded-full" />
              </div>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Vous pouvez vous désinscrire à tout moment.
                Pour ce faire, veuillez trouver nos coordonnées.
              </p>
            </div>
          </div>

          {/* Categories section - full width with 3-column grid */}
          {categoriesSection && (
            <div className="border-t border-slate-200 pt-8">
              <div className="mb-4">
                <button
                  onClick={() => handleNavigation("/products")}
                  className="hover:text-[#1D8EE6] transition-colors text-left"
                >
                  <h3 className="font-bold text-slate-800 text-base mb-2 hover:text-[#1D8EE6] transition-colors cursor-pointer">
                    {categoriesSection.title}
                  </h3>
                </button>
                <Separator className="w-10 h-1 bg-[#1D8EE6] rounded-full" />
              </div>
              <ul className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                {categoriesSection.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <button
                      onClick={() => handleNavigation(link.href)}
                      className="text-slate-500 hover:text-[#1D8EE6] transition-colors text-sm font-medium text-left w-full py-0.5"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Copyright */}
          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <div className="text-sm font-medium">
              <span className="font-bold text-[#1D8EE6]">YJ PARA</span>
              <span className="text-slate-400"> COPYRIGHT © 2026</span>
              <br />
              <span className="text-slate-400 font-normal mt-1 block">
                powered by <a href="https://genzbuildersltd.com/" target="_blank" rel="noopener noreferrer" className="text-[#1D8EE6] font-bold hover:underline">GenZ builders</a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
