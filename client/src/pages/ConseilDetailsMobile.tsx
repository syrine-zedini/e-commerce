import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FooterMobile } from "@/components/ui/FooterMobile";
import { MobileHeader } from "@/components/MobileHeader";
import { Link, useParams } from "wouter";
import { apiGet } from "@/lib/api";
import { NAV_LINKS_EXTENDED, FOOTER_SECTIONS_EXTENDED_MOBILE } from "@/lib/pageData";

  const footerSections = FOOTER_SECTIONS_EXTENDED_MOBILE;
interface Conseil {
  id: number;
  title: string;
  content?: string;
  image?: string;
  created_at?: string;
  categories?: string;
}

export const DetailsConseilMobile = (): JSX.Element => {
     const { id } = useParams<{ id: string }>();
         const [conseil, setConseil] = useState<Conseil | null>(null);
      const [, setLoading] = useState(true);
      const [, setError] = useState<string | null>(null);
          const [related, setRelated] = useState<Conseil[]>([]);

      useEffect(() => {
        const fetchConseil = async () => {
          try {
            const data = await apiGet(`/api/conseils/${id}`);
            setConseil(data);
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          } finally {
            setLoading(false);
          }
        };
    
        fetchConseil();
      }, [id]);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const data = await apiGet(
          `/api/conseils?fields=id,title,image&excludeId=${id}&limit=2`
        );
        setRelated(data || []);
      } catch (error) {
        console.error("Error fetching related conseils:", error);
      }
    };

    fetchRelated();
  }, [id]);
    const navLinks = NAV_LINKS_EXTENDED;

  return (
    <div className="bg-white grid justify-items-center [align-items:start] w-screen">
      <div className="bg-white overflow-hidden w-full h-[2603px] relative">
      <MobileHeader navLinks={navLinks} />

<section className="w-full h-[200px] sm:h-[250px] md:h-[300px] bg-[url(/figmaAssets/detailsconseil/rectangle-230.png)] bg-cover bg-center relative">
  <div className="absolute inset-0 bg-gradient-to-r from-app-secondary to-transparent" />
  <div className="relative px-4 sm:px-8 md:px-16 lg:px-[84px] py-6 sm:py-10 md:py-[57px]">
    <h1 className="[font-family:'Inter',Helvetica] font-bold text-text-light text-lg sm:text-2xl md:text-[32px] mb-4 leading-snug">
      Cheveux, ongles et peau : Les meilleurs compléments alimen ...
    </h1>
    <div className="[font-family:'Inter',Helvetica] font-medium text-text-light text-xs sm:text-sm md:text-base">
      Accueil &gt; Conseils &amp; santé &gt; Cheveux, ongles et peau : Les meilleurs compléments alimen ...
    </div>
  </div>
</section>

{/* Main Content */}
<main className="flex flex-col lg:flex-row gap-6 lg:gap-8 px-4 sm:px-6 md:px-10 lg:px-[84px] py-6 sm:py-8">
  {/* Article Content */}
  <article className="flex-1">
  <div className="mb-6">
    {/* Date (only if conseil exists and has created_at) */}
    {conseil?.created_at && (
      <div className="[font-family:'Inter',Helvetica] font-normal text-text-dark text-xs sm:text-sm md:text-base mb-4">
        {new Date(conseil.created_at).toLocaleDateString("fr-FR")}
      </div>
    )}

    {/* Image */}
    {conseil?.image && (
      <img
        className="w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-[627px] rounded-[5px] object-cover mb-4 sm:mb-8"
        src={conseil.image}
        alt={conseil.title}
      />
    )}


    {/* Example Quote Section */}
    {conseil?.title && (
      <div className="flex flex-col sm:flex-row mb-4 sm:mb-8">
        <div className="w-full sm:w-[7px] bg-app-primary mb-2 sm:mb-0" />
        <Card className="flex-1 bg-card-background border-none">
          <CardContent className="p-4 sm:p-7">
            <div className="[font-family:'Inter',Helvetica] font-semibold text-text-dark text-base sm:text-lg md:text-2xl leading-snug">
              {conseil.title}
            </div>
          </CardContent>
        </Card>
      </div>
    )}
    {/* Content */}
    <div className="[font-family:'Inter',Helvetica] font-normal text-text-dark text-sm sm:text-base leading-5 sm:leading-6 mb-4 sm:mb-8">
      {conseil?.content ?? "No description available"}
    </div>


  </div>
</article>


  {/* Sidebar */}
  {/* <aside className="w-full lg:w-[300px] space-y-4 lg:space-y-6">
    <Card className="bg-card-background border-none">
      <CardContent className="p-4 sm:p-6 lg:p-[46px]">
        <div className="relative">
          <Input
            placeholder="RECHERCHE"
            className="w-full h-[40px] sm:h-[50px] md:h-[60px] bg-white border border-[#d9d9d9] rounded-[5px] pl-3 sm:pl-4 md:pl-6 pr-8 sm:pr-10 md:pr-12 [font-family:'Inter',Helvetica] font-semibold text-[#b3b3b3] text-xs sm:text-sm md:text-base"
          />
          <img
            className="absolute w-3 h-3 sm:w-4 sm:h-4 right-2 sm:right-4 top-1/2 -translate-y-1/2"
            alt="Search"
            src="/figmaAssets/detailsconseil/vector-1.svg"
          />
        </div>
      </CardContent>
    </Card>

    <Card className="bg-card-background border-none">
      <CardContent className="p-4 sm:p-6 lg:p-[42px]">
        <h3 className="[font-family:'Inter',Helvetica] font-bold text-black text-base sm:text-lg md:text-[21px] mb-3 sm:mb-4">
          Filtrer par catégories
        </h3>
        <div className="space-y-2 sm:space-y-3 md:space-y-6">
          {sidebarCategories.map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="[font-family:'Inter',Helvetica] font-medium text-text-dark text-sm sm:text-base">
                {category.label}
              </span>
              <img
                className="w-3 h-3 sm:w-[5px] sm:h-[9px]"
                alt="Arrow"
                src={
                  category.hasArrow
                    ? "/figmaAssets/detailsconseil/vector-3.svg"
                    : "/figmaAssets/detailsconseil/vector-12.svg"
                }
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <img
      className="w-full h-[150px] sm:h-[250px] md:h-[400px] lg:h-[837px] rounded-[5px] object-cover"
      alt="Featured content"
      src="/figmaAssets/detailsconseil/rectangle-260.png"
    />
  </aside> */}
</main>

{/* Related Articles */}
  <section className="px-4 sm:px-6 md:px-10 lg:px-[84px] py-6 sm:py-8">
      <Separator className="mb-6 sm:mb-8" />

   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
  {related.map((item, index) => (
    <Link
      key={item.id}
      href={`/detailsconseil/${item.id}`}
      className={`flex flex-col ${
        index === 1 ? "sm:flex-row-reverse" : "sm:flex-row"
      } gap-4 hover:opacity-90 transition`}
    >
      <img
        className="w-full sm:w-[163px] h-[150px] sm:h-[149px] rounded object-cover"
        alt={item.title}
        src={item.image || "/placeholder.jpg"}
      />
      <div
        className={`flex-1 ${
          index === 1 ? "text-left sm:text-right" : ""
        }`}
      >
        <div className="font-normal text-text-dark text-xs mb-2">
          {item.created_at && new Date(item.created_at).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </div>
        <h3 className="font-semibold text-text-dark text-base sm:text-lg leading-snug">
          {item.title}
        </h3>
      </div>
    </Link>
  ))}
</div>
    </section>

        {/* Footer */}
          <FooterMobile sections={footerSections} />

      </div>
    </div>
  );
};
