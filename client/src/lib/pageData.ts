import { ShieldCheck, BadgeCheck, Zap, Headphones } from "lucide-react";

// Static data shared verbatim between the desktop and mobile versions of the
// same page (Home/Homemobile, Produits/ProduitsMobile, etc.) — previously
// copy-pasted with only variable-name differences in each file.

export const SERVICE_FEATURES = [
  {
    icon: ShieldCheck,
    title: "Procéder au paiement",
    description: "Payez en espèces à la réception de votre commande.",
    link: "/propos",
    bgClass: "bg-indigo-50/80 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_10px_20px_-5px_rgba(79,70,229,0.3)]",
  },
  {
    icon: BadgeCheck,
    title: "Produits certifiés",
    description: "Nos articles respectent des normes de qualité strictes.",
    link: "/propos",
    bgClass: "bg-amber-50/80 text-amber-600 group-hover:bg-amber-600 group-hover:text-white group-hover:shadow-[0_10px_20px_-5px_rgba(217,119,6,0.3)]",
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

// Desktop dropdown categories under the main nav (desktop-only feature).
export const NAVIGATION_ITEMS = [
  { name: "VISAGE" },
  { name: "CORPS" },
  { name: "CAPILLAIRE" },
  { name: "COMPLÈMENTS" },
  { name: "BEBE ET MAMAN" },
  { name: "HYGIENE" },
  { name: "NATURE ET BIO" },
  { name: "SOLAIRE" },
  { name: "HOMME" },
];

// Same 3 links used as both the desktop Header's `headerLinks` prop and the
// mobile MobileHeader's `navLinks` prop.
export const HEADER_LINKS = [
  { name: "À Propos", href: "/propos" },
  { name: "Produits", href: "/products" },
  { name: "Contact", href: "/contact" },
];

// Canonical footer data (desktop `Footer` shape). Mobile's `FooterMobile`
// expects `items`/`routeLinks` instead of `links` — derive that shape with
// toMobileFooterSections() rather than keeping a second copy of the data.
export const FOOTER_SECTIONS = [
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
      { name: "Promotions", href: "/products?filter=promotions" },
      { name: "Produits en vedette", href: "/products?filter=featured" },
      { name: "Nouveaux produits", href: "/products?filter=new" },
      { name: "Meilleures ventes", href: "/products?filter=best" },
    ],
  },
  {
    title: "CATÉGORIES",
    links: [
      { name: "Visage", href: "/products?cat=visage" },
      { name: "Corps", href: "/products?cat=corps" },
      { name: "Hygiène", href: "/products?cat=hygiene" },
      { name: "Bébé", href: "/products?cat=bebe" },
      { name: "Compléments", href: "/products?cat=complements" },
      { name: "Autres..", href: "/products?cat=autres" },
    ],
  },
];

export function toMobileFooterSections(sections: typeof FOOTER_SECTIONS = FOOTER_SECTIONS) {
  return sections.map((section) => ({
    title: section.title,
    items: section.links.map((l) => l.name),
    routeLinks: section.links.map((l) => l.href),
  }));
}

// Maps a footer section title to the link its "see all" click should go
// to — shared verbatim between Footer.tsx (desktop) and FooterMobile.tsx.
export const FOOTER_TITLE_LINKS: Record<string, string> = {
  "INFORMATIONS": "/propos",
  "PRODUITS": "/products",
  "CATÉGORIES": "/products",
  "CONTACT": "/contact",
  "NEWSLETTRES": "/contact",
};

export const GALLERY_FALLBACK_IMAGES = [
  "/figmaAssets/para/image3.webp",
  "/figmaAssets/para/image2.jpeg",
  "/figmaAssets/para/image1.png",
];

// ---------------------------------------------------------------------
// A second, "extended" nav/footer set shared identically by ConseilsSant,
// DetailconseilsSant and Marques (desktop) and their mobile counterparts —
// distinct from HEADER_LINKS/FOOTER_SECTIONS above (no "À Propos" on
// desktop, adds a "Livraison" footer entry). Kept separate rather than
// merged into the simpler set since the actual link lists differ.
// ---------------------------------------------------------------------

export const HEADER_LINKS_EXTENDED = [
  { name: "Produits", href: "/products" },
  { name: "Conseils Santé", href: "/conseils" },
  { name: "Marques", href: "/marques" },
  { name: "Contact", href: "/contact" },
];

export const NAV_LINKS_EXTENDED = [
  { name: "À Propos", href: "/propos" },
  { name: "Produits", href: "/products" },
  { name: "Conseils & santé", href: "/conseils" },
  { name: "Marques", href: "/marques" },
  { name: "Contact", href: "/contact" },
];

export const FOOTER_SECTIONS_EXTENDED = [
  {
    title: "INFORMATIONS",
    links: [
      { name: "À Propos", href: "/propos" },
      { name: "Produits", href: "/products" },
      { name: "Conseils & santé", href: "/conseils" },
      { name: "Marques", href: "/marques" },
      { name: "Contact", href: "/contact" },
      { name: "Livraison", href: "/livraison" },
    ],
  },
  {
    title: "PRODUITS",
    links: [
      { name: "Promotions", href: "/products?filter=promotions" },
      { name: "Produits en vedette", href: "/products?filter=featured" },
      { name: "Nouveaux produits", href: "/products?filter=new" },
      { name: "Meilleures ventes", href: "/products?filter=best" },
    ],
  },
  {
    title: "CATÉGORIES",
    links: [
      { name: "Visage", href: "/products?cat=visage" },
      { name: "Corps", href: "/products?cat=corps" },
      { name: "Hygiène", href: "/products?cat=hygiene" },
      { name: "Bébé", href: "/products?cat=bebe" },
      { name: "Compléments", href: "/products?cat=complements" },
      { name: "Autres..", href: "/products?cat=autres" },
    ],
  },
];

// Mobile shape for the same data — kept as its own literal (not derived via
// toMobileFooterSections) because the mobile "Livraison" entry points to
// /checkout while desktop points to /livraison, a genuine difference.
export const FOOTER_SECTIONS_EXTENDED_MOBILE = [
  {
    title: "INFORMATIONS",
    items: ["À Propos", "Produits", "Conseils & santé", "Marques", "Contact", "Livraison"],
    routeLinks: ["/propos", "/products", "/conseils", "/marques", "/contact", "/checkout"],
  },
  {
    title: "PRODUITS",
    items: ["Promotions", "Produits en vedette", "Nouveaux produits", "Meilleures ventes", "Connexion", "Inscription"],
    routeLinks: ["/products?filter=promotions", "/products?filter=featured", "/products?filter=new", "/products?filter=best", "/dashboard", "/signup"],
  },
  {
    title: "CATÉGORIES",
    items: ["Visage", "Corps", "Hygiène", "Bébé", "Compléments", "Autres.."],
    routeLinks: ["/products?cat=visage", "/products?cat=corps", "/products?cat=hygiene", "/products?cat=bebe", "/products?cat=complements", "/products?cat=autres"],
  },
];
