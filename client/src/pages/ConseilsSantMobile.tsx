import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiGet } from "@/lib/api";
import { Link } from "wouter";
import { FooterMobile } from "@/components/ui/FooterMobile";
import { MobileHeader } from "@/components/MobileHeader";
import { NAV_LINKS_EXTENDED, FOOTER_SECTIONS_EXTENDED_MOBILE } from "@/lib/pageData";

export const ConseilsSantMobile = (): JSX.Element => {
  const footerSections = FOOTER_SECTIONS_EXTENDED_MOBILE;
  const navLinks = NAV_LINKS_EXTENDED;

    const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const data = await apiGet("/api/conseils");
        setArticles(data);
      } catch (error) {
        console.error("Error fetching articles:", error);
      }
      setLoading(false);
    };

    fetchArticles();
  }, []);

  if (loading) return <div>Loading...</div>;
  return (
    <div className="bg-white grid justify-items-center w-screen">
      <div className="bg-white overflow-hidden w-full relative">
        {/* Top Banner */}
        <MobileHeader navLinks={navLinks} />



        {/* Hero Section */}
        <div className="relative w-[375px] h-40 bg-[url(/figmaAssets/conseilsantem/rectangle-230.png)] bg-cover bg-[50%_50%]">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(69,171,164,1)_0%,rgba(69,171,164,0)_100%)]" />
          <div className="absolute top-[54px] left-[11px] [font-family:'Inter',Helvetica] font-bold text-text-light text-[21px] tracking-[0] leading-[normal] whitespace-nowrap">
            Conseils & Santé
          </div>
          <div className="absolute top-[89px] left-[11px] [font-family:'Inter',Helvetica] font-medium text-text-light text-xs tracking-[0] leading-[normal]">
            Accueil &gt; Conseils &amp; santé
          </div>
        </div>

        {/* Articles */}
        <div className="px-[11px] py-8 space-y-8">
          {articles.map((article) => (
            <Card
              key={article.id}
              className="bg-card-background rounded-[5px] overflow-hidden"
            >
              <CardContent className="p-0">
                <img
                  className="w-full h-[215px] object-cover"
                  alt="Rectangle"
                  src={article.image}
                />
                <div className="p-[27px]">
                  <div className="[font-family:'Inter',Helvetica] font-normal text-text-dark text-[11px] tracking-[0] leading-[normal] mb-6">
                    {article.date}
                  </div>
                  <div className="[font-family:'Inter',Helvetica] font-semibold text-text-dark text-sm tracking-[0] leading-[25px] mb-6">
                    {article.title}
                  </div>
                  <Button
                    variant="link"
                    className="p-0 h-auto [font-family:'Inter',Helvetica] font-semibold text-app-secondary text-xs tracking-[0] leading-[normal] underline"
                  >
          <Link to={`/detailsconseil/${article.id}`}>LIRE PLUS</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {/* <div className="flex justify-center items-center gap-4 pb-8">
          <Button
            variant="outline"
            size="icon"
            className="w-[38px] h-[38px] rounded-[5px] border-[#b3b3b3]"
          >
            <img
              className="w-1 h-2"
              alt="Vector"
              src="/figmaAssets/conseilsantem/vector-2.svg"
            />
            <img
              className="w-1 h-2"
              alt="Vector"
              src="/figmaAssets/conseilsantem/vector-2.svg"
            />
          </Button>

          <Button className="w-[38px] h-[38px] bg-app-primary rounded-[5px] [font-family:'Inter',Helvetica] font-semibold text-text-light text-xs tracking-[0] leading-[23px]">
            1
          </Button>

          <Button
            variant="outline"
            className="w-[38px] h-[38px] rounded-[5px] border-[#b3b3b3] [font-family:'Inter',Helvetica] font-semibold text-text-dark text-xs tracking-[0] leading-[23px]"
          >
            2
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="w-[38px] h-[38px] rounded-[5px] border-[#b3b3b3]"
          >
            <img
              className="w-1 h-2"
              alt="Vector"
              src="/figmaAssets/conseilsantem/vector-5.png"
            />
            <img
              className="w-[5px] h-2"
              alt="Vector"
              src="/figmaAssets/conseilsantem/vector-5.png"
            />
          </Button>
        </div> */}

        {/* Footer */}
    <FooterMobile sections={footerSections} />

      </div>
    </div>
  );
};
