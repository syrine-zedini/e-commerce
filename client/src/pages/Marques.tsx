import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useBrandLogos } from "@/hooks/useBrandLogos";
import { NAVIGATION_ITEMS, HEADER_LINKS_EXTENDED, FOOTER_SECTIONS_EXTENDED } from "@/lib/pageData";

const navigationItems = NAVIGATION_ITEMS;
const headerLinks = HEADER_LINKS_EXTENDED;
const footerSections = FOOTER_SECTIONS_EXTENDED;

export const Marques = (): JSX.Element => {
  
  const brandLogos = useBrandLogos();  // ✅ inside component
function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}

// Example: 4 logos per row
const brandRows = chunk(brandLogos, 4);

  const [isCartOpen, setIsCartOpen] = useState(false);
  return (
    <div className="bg-white grid justify-items-center w-screen">
      <div className="bg-white overflow-hidden w-full max-w-[1920px] min-h-screen relative">

        {/* Header */}
   <Header
         headerLinks={headerLinks}
         navigationItems={navigationItems}
         isCartOpen={isCartOpen}
         setIsCartOpen={setIsCartOpen}
       />



        {/* Navigation Bar */}
        {/* <nav className="w-full h-[78px] bg-app-primary flex items-center justify-center">
          <div className="flex items-center gap-8">
            {navigationItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="[font-family:'Inter',Helvetica] font-medium text-text-light text-base tracking-[0] leading-[normal] whitespace-nowrap">
                  {item.label}
                </div>
                {item.hasDropdown && (
                  <img
                    className="w-[11px] h-1.5"
                    alt="Dropdown"
                    src="/figmaAssets/marques/vector-2.svg"
                  />
                )}
              </div>
            ))}
          </div>
        </nav> */}

        {/* Hero Section */}
        <section className="w-full h-[200px] relative bg-[url(/figmaAssets/marques/rectangle-230.png)] bg-[100%_100%]">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(69,171,164,1)_0%,rgba(69,171,164,0)_100%)]" />
          <div className="relative px-[84px] py-[57px]">
            <h1 className="[font-family:'Inter',Helvetica] font-bold text-text-light text-[32px] tracking-[0] leading-[normal] mb-4">
              Marques
            </h1>
            <div className="[font-family:'Inter',Helvetica] font-medium text-text-light text-base tracking-[0] leading-[normal]">
              Accueil &gt; Marques
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
        <main className="px-[84px] py-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="[font-family:'Inter',Helvetica] font-bold text-black text-[32px] tracking-[0] leading-[normal]">
              Marques populaires
            </h2>

            {/* <div className="w-[343px] h-[60px]">
              <div className="relative w-full h-full bg-light-background rounded-[5px] border border-solid border-[#d9d9d9] flex items-center">
                <Input
                  className="w-full h-full bg-transparent border-none pl-6 pr-12 [font-family:'Inter',Helvetica] font-semibold text-[#b3b3b3] text-base placeholder:text-[#b3b3b3]"
                  placeholder="RECHERCHE"
                />
                <SearchIcon className="absolute right-6 w-4 h-4 text-[#b3b3b3]" />
              </div>
            </div> */}
          </div>

          {/* Brand Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8">
  {brandRows.map((row) =>
    row.map((brand) => (
      <Card
        key={brand.src}
        className="w-full h-[211px] bg-card-background rounded-[15px] border-none"
      >
        <CardContent className="flex items-center justify-center h-full p-0">
          <img
            className="object-contain max-h-[150px]"
            alt={brand.alt}
            src={brand.src}
          />
        </CardContent>
      </Card>
    )),
  )}
</div>

        </main>

        {/* Footer */}
           <Footer footerSections={footerSections} />

      </div>
    </div>
  );
};
