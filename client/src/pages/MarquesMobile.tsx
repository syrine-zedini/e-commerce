import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FooterMobile } from "@/components/ui/FooterMobile";
import { MobileHeader } from "@/components/MobileHeader";
import { useBrandLogos } from "@/hooks/useBrandLogos";
import { NAV_LINKS_EXTENDED, FOOTER_SECTIONS_EXTENDED_MOBILE } from "@/lib/pageData";

  const footerSections = FOOTER_SECTIONS_EXTENDED_MOBILE;
export const MarquesMobile = (): JSX.Element => {
    const navLinks = NAV_LINKS_EXTENDED;
  const logos = useBrandLogos();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const logosPerPage = 12;

  const totalPages = Math.ceil(logos.length / logosPerPage);
  const startIndex = (currentPage - 1) * logosPerPage;
  const currentLogos = logos.slice(startIndex, startIndex + logosPerPage);
  return (
      <div className="bg-white grid justify-items-center [align-items:start] w-screen">
      <div className="bg-white overflow-hidden w-[375px] min-h-screen relative">
        <MobileHeader navLinks={navLinks} />

        {/* Hero Section */}
        <section className="w-[375px] h-40 mt-[40px] bg-[url(/figmaAssets/marquesm/rectangle-274.png)] bg-cover bg-[50%_50%] relative">
          <div className="absolute w-full h-full bg-[linear-gradient(90deg,rgba(69,171,164,1)_0%,rgba(69,171,164,0)_100%)]" />

          <nav className="absolute top-[89px] left-[11px] font-medium text-text-light text-xs">
            Accueil &gt; Marques
          </nav>

          <h1 className="absolute top-[54px] left-[11px] font-bold text-text-light text-[21px]">
            Marques
          </h1>
        </section>

        {/* Main Content */}
        <main className="w-[375px] mt-10 px-4">
          <h2 className="font-bold text-black text-[21px] mb-4">Marques</h2>
          <Separator className="mb-6" />

          {/* Logos Grid */}
          <div className="grid grid-cols-2 gap-4">
            {currentLogos.map((brand) => (
              <Card
                key={brand.src}
                className="w-full h-[120px] bg-card-background rounded-[15px] border-none flex items-center justify-center"
              >
                <CardContent className="p-2 flex justify-center items-center">
                  <img
                    className="max-h-[80px] object-contain"
                    alt={brand.alt}
                    src={brand.src}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <Button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Prev
              </Button>
              <span>
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </main>

        {/* Footer */}
        <div className="mt-10">
          <FooterMobile sections={footerSections} />
        </div>
      </div>
    </div>
  );
};
