import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiGet } from "@/lib/api";
import { NAVIGATION_ITEMS, HEADER_LINKS_EXTENDED, FOOTER_SECTIONS_EXTENDED } from "@/lib/pageData";
  const navigationItems = NAVIGATION_ITEMS;

const headerLinks = HEADER_LINKS_EXTENDED;

  const footerSections = FOOTER_SECTIONS_EXTENDED;


export const ConseilsSant = (): JSX.Element => {

  const [isCartOpen, setIsCartOpen] = useState(false);
    const [articles, setArticles] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  // const [related, setRelated] = useState<any[]>([]);

useEffect(() => {
  // 1️⃣ Initial fetch (fast, minimal data with images)
  const fetchArticles = async () => {
    setLoading(true);
    try {
      const articles = await apiGet("/api/conseils?fields=id,title,image&limit=10");

      const articlesWithUrls = (articles || []).map((article: any) => ({
        ...article,
        imageUrl: article.image || null,
      }));

      setArticles(articlesWithUrls);
    } catch (err) {
      console.error("Initial fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchArticles();

  // 2️⃣ Background fetch (full data) after 30s
  const timeoutId = setTimeout(async () => {
    try {
      const fullArticles = await apiGet("/api/conseils");

      const fullArticlesWithImages = (fullArticles || []).map((article: any) => ({
        ...article,
        imageUrl: article.image || null,
      }));

      setArticles(fullArticlesWithImages); // update state once
    } catch (err) {
      console.error("Full fetch error:", err);
    }
  }, 10000); // 30s delay

  // cleanup timeout on unmount
  return () => clearTimeout(timeoutId);

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);



// if (loading) return (
//   <div className="flex items-center justify-center py-20">
//     <Loader2 className="h-10 w-10 animate-spin text-accent" />
//     <span className="ml-3 text-lg font-medium text-gray-700">
//       Chargement des articles...
//     </span>
//   </div>
// ); 

return (
    <div className="bg-white min-h-screen">

      {/* Header */}
   <Header
         headerLinks={headerLinks}
         navigationItems={navigationItems}
         isCartOpen={isCartOpen}
         setIsCartOpen={setIsCartOpen}
       />


      {/* Category Navigation */}
      {/* <nav className="w-full h-[78px] bg-app-primary flex items-center justify-center">
        <div className="flex items-center gap-8">
          {navigationItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="[font-family:'Inter',Helvetica] font-medium text-text-light text-base">
                {item}
              </span>
              <ChevronDownIcon className="w-[11px] h-1.5" />
            </div>
          ))}
        </div>
      </nav> */}

      {/* Hero Section */}
      <section className="w-full h-[200px] bg-[url(/figmaAssets/conseil/rectangle-230.png)] bg-cover bg-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-app-secondary to-transparent" />
        <div className="relative px-[84px] py-[57px]">
          <h1 className="[font-family:'Inter',Helvetica] font-bold text-text-light text-[32px] mb-4">
            Conseils & Santé
          </h1>
          <div className="[font-family:'Inter',Helvetica] font-medium text-text-light text-base">
            Accueil &gt; Conseils &amp; santé
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex gap-8 px-[86px] py-8">
        {/* Sidebar */}
        <aside className="w-[414px]">
          {/* SearchIcon */}
          {/* <Card className="bg-card-background rounded-[5px] p-8 mb-8">
            <CardContent className="p-0">
              <div className="relative">
                <Input
                  className="w-full h-[60px] bg-white border border-[#d9d9d9] rounded-[5px] pl-6 pr-12 [font-family:'Inter',Helvetica] font-semibold text-[#b3b3b3] text-base placeholder:text-[#b3b3b3]"
                  placeholder="RECHERCHE"
                />
                <SearchIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4" />
              </div>
            </CardContent>
          </Card> */}

          {/* Featured Image */}
          <img
            className="w-[414px] h-[837px] rounded-[5px] object-cover"
            alt="Rectangle"
            src="/figmaAssets/conseil/rectangle-260.png"
          />
        </aside>

        {/* Articles Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-3 gap-8 mb-8">
            {articles.map((article) => (
              <Card
                key={article.id}
                className="bg-card-background rounded-[5px] overflow-hidden"
              >
                <CardContent className="p-0">
                  <img
                    className="w-full h-[271px] object-cover"
                    alt="Rectangle"
                    src={article.image}
                  />
                  <div className="p-[30px]">
             <div className="[font-family:'Inter',Helvetica] font-normal text-text-dark text-xs mb-4">
    {new Date(article.created_at).toLocaleDateString("fr-FR")}
  </div>
                    <h3 className="[font-family:'Inter',Helvetica] font-semibold text-text-dark text-lg leading-[30px] mb-4">
                      {article.title}
                    </h3>
<Button
  asChild
  variant="link"
  className="[font-family:'Inter',Helvetica] font-thin text-app-secondary text-base p-0 h-auto underline decoration-app-primary hover:text-app-primary"
>
  <Link to={`/detailsconseil/${article.id}`}>LIRE PLUS</Link>
</Button>

                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {/* <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="w-[52px] h-[52px] rounded-[5px] border-[#b3b3b3]"
            >
              <ChevronLeftIcon className="w-1.5 h-[11px]" />
            </Button>
            <Button className="w-[52px] h-[52px] bg-app-primary rounded-[5px] [font-family:'Inter',Helvetica] font-semibold text-text-light text-base">
              1
            </Button>
            <Button
              variant="outline"
              className="w-[52px] h-[52px] rounded-[5px] border-[#b3b3b3] [font-family:'Inter',Helvetica] font-semibold text-text-dark text-base"
            >
              2
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-[52px] h-[52px] rounded-[5px] border-[#b3b3b3]"
            >
              <ChevronRightIcon className="w-1.5 h-[11px]" />
            </Button>
          </div> */}
        </div>
      </main>

      {/* Footer */}
        <Footer footerSections={footerSections} />

    </div>
  );
};
