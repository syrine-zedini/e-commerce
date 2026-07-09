import React, { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiGet, listStorage } from "@/lib/api";
import { NAVIGATION_ITEMS, HEADER_LINKS_EXTENDED, FOOTER_SECTIONS_EXTENDED } from "@/lib/pageData";

export const DetailconseilsSant = (): JSX.Element => {
    const { id } = useParams<{ id: string }>();
    const [conseil, setConseil] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [related, setRelated] = useState<any[]>([]);

useEffect(() => {
  if (!id) return;

  // Reset state immediately on ID change
  setConseil(null);
  setRelated([]);
  setError(null);
  setLoading(true);

  const fetchData = async () => {
    try {
      // Step 1: Fetch data only (no images yet)
      const conseilPromise = apiGet(`/api/conseils/${id}`);

      // NOTE: original code selected a non-existent "image_path" column on
      // the conseils table; the real schema/API only exposes "image".
      const relatedPromise = apiGet(
        `/api/conseils?fields=id,title,image&excludeId=${id}&limit=4`
      );

      const [mainConseilResult, relatedResultData] = await Promise.all([
        conseilPromise,
        relatedPromise,
      ]);

      let mainConseil = mainConseilResult;
      let relatedConseils = relatedResultData || [];

      // Step 2: Fetch images in parallel
      const fetchImage = async (image_path: string | null) => {
        if (!image_path) return null;
        const folder = image_path.replace(/^image\//, "");
        let files;
        try {
          files = await listStorage(`image/${folder}`);
        } catch (error) {
          return null;
        }

        if (!files || files.length === 0) return null;

        const sorted = files.sort((a, b) => a.name.localeCompare(b.name));
        return sorted[0].url;
      };

      mainConseil = {
        ...mainConseil,
        imageUrl: await fetchImage(mainConseil.image),
      };

      relatedConseils = await Promise.all(
        relatedConseils.map(async (item: any) => ({
          ...item,
          imageUrl: await fetchImage(item.image),
        }))
      );

      setConseil(mainConseil);
      setRelated(relatedConseils);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [id]);



const [isCartOpen, setIsCartOpen] = useState(false);
  const navigationItems = NAVIGATION_ITEMS;

const headerLinks = HEADER_LINKS_EXTENDED;
const footerSections = FOOTER_SECTIONS_EXTENDED;
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!conseil) return <div>No conseil found.</div>;

  return (
    <div className="bg-white grid justify-items-center w-screen">
      <div className="bg-white overflow-hidden w-full max-w-[1920px] min-h-screen relative">

        {/* Header */}
     {/* Header */}
   <Header
        headerLinks={headerLinks}
        navigationItems={navigationItems}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
      />

        {/* Hero Section */}
        <section className="w-full h-[200px] bg-[url(/figmaAssets/detailsconseil/rectangle-230.png)] bg-cover bg-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-app-secondary to-transparent" />
          <div className="relative px-[84px] py-[57px]">
            <h1 className="[font-family:'Inter',Helvetica] font-bold text-text-light text-[32px] mb-4">
              Cheveux, ongles et peau : Les meilleurs compléments alimen ...
            </h1>
            <div className="[font-family:'Inter',Helvetica] font-medium text-text-light text-base">
              Accueil &gt; Conseils &amp; santé &gt; Cheveux, ongles et peau :
              Les meilleurs compléments alimen ...
            </div>
          </div>
        </section>

        {/* Main Content */}
   <main className="flex flex-col lg:flex-row gap-6 lg:gap-8 px-4 sm:px-8 md:px-[84px] py-6 sm:py-8">
  {/* Article Content */}
  <article className="flex-1">
    <div className="mb-6">
      <div className="[font-family:'Inter',Helvetica] font-normal text-text-dark text-sm sm:text-base mb-4">
    {new Date(conseil.created_at).toLocaleDateString("fr-FR")}
      </div>
 {conseil.image && (
        <img
          className="w-full h-[300px] sm:h-[400px] md:h-[627px] rounded-[5px] object-cover mb-4 sm:mb-8"
          src={conseil.image}
          alt={conseil.title}
        />
      )}

      {/* Title */}
      {/* <h1 className="[font-family:'Inter',Helvetica] font-bold text-text-dark text-xl sm:text-2xl mb-4 sm:mb-8">
        {conseil.title}
      </h1> */}
    {/* Example Quote Section */}
      <div className="flex flex-col sm:flex-row mb-4 sm:mb-8">
        <div className="w-full sm:w-[7px] bg-app-primary mb-2 sm:mb-0" />
        <div className="flex-1 bg-card-background border-none p-4 sm:p-7 rounded-lg">
            <div className="[font-family:'Inter',Helvetica] font-semibold text-text-dark text-lg sm:text-2xl leading-6 sm:leading-[41px]">
              {conseil.title}
            </div>
        </div>
      </div>

      {/* Content */}
      <div className="[font-family:'Inter',Helvetica] font-normal text-text-dark text-sm sm:text-base leading-5 sm:leading-6 mb-4 sm:mb-8">
        {conseil.content || 'No description available'}
      </div>

  
      {/* <div className="[font-family:'Inter',Helvetica] font-normal text-text-dark text-sm sm:text-base leading-5 sm:leading-6 mb-4 sm:mb-8">
        Lorem ipsum dolor sit amet consectetur. ...
      </div> */}

      {/* Images Grid */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-4 sm:mb-8">
        <img
          className="w-full h-[200px] sm:h-[387px] rounded-[5px] object-cover"
          alt="Article image 1"
          src="/figmaAssets/detailsconseil/rectangle-278.png"
        />
        <img
          className="w-full h-[200px] sm:h-[387px] rounded-[5px] object-cover"
          alt="Article image 2"
          src="/figmaAssets/detailsconseil/rectangle-279.png"
        />
      </div> */}

      {/* <div className="[font-family:'Inter',Helvetica] font-normal text-text-dark text-sm sm:text-base leading-5 sm:leading-6">
        Lorem ipsum dolor sit amet consectetur. ...
      </div> */}
    </div>
  </article>

  {/* Sidebar */}
  <aside className="w-full lg:w-[300px] space-y-4 lg:space-y-6">
    {/* Search Widget */}
    {/* <Card className="bg-card-background border-none">
      <CardContent className="p-4 sm:p-[46px]">
        <div className="relative">
          <Input
            placeholder="RECHERCHE"
            className="w-full h-[50px] sm:h-[60px] bg-white border border-[#d9d9d9] rounded-[5px] pl-4 sm:pl-6 pr-10 sm:pr-12 [font-family:'Inter',Helvetica] font-semibold text-[#b3b3b3] text-sm sm:text-base"
          />
          <img
            className="absolute w-4 h-4 right-2 sm:right-4 top-1/2 -translate-y-1/2"
            alt="Search"
            src="/figmaAssets/detailsconseil/vector-1.svg"
          />
        </div>
      </CardContent>
    </Card> */}

    {/* Categories Filter */}
    {/* <Card className="bg-card-background border-none">
      <CardContent className="p-4 sm:p-[42px]">
        <h3 className="[font-family:'Inter',Helvetica] font-bold text-black text-lg sm:text-[21px] mb-2 sm:mb-4">
          Filtrer par catégories
        </h3>
        <div className="space-y-3 sm:space-y-6">
          {sidebarCategories.map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="[font-family:'Inter',Helvetica] font-medium text-text-dark text-sm sm:text-base">
                {category.label}
              </span>
              <img
                className="w-[5px] h-[9px]"
                alt="Arrow"
                src={category.hasArrow ? "/figmaAssets/detailsconseil/vector-3.svg" : "/figmaAssets/detailsconseil/vector-12.svg"}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card> */}

    {/* Featured Image */}
    {/* <img
      className="w-full h-[200px] sm:h-[400px] lg:h-[837px] rounded-[5px] object-cover"
      alt="Featured content"
      src="/figmaAssets/detailsconseil/rectangle-260.png"
    /> */}
  </aside>
</main>

        {/* Related Articles */}
        <section className="px-[84px] py-8">
          <hr className="mb-8 border-t border-slate-200" />
        </section>
  {/* 🔽 Articles Similaires Section */}
{related && related.length > 0 && (
  <section className="px-[86px] py-12">
    <hr className="mb-10 border-t border-slate-200" />
    <h2 className="font-bold text-black text-2xl sm:text-3xl mb-8">
      Articles similaires
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      {related.map((item) => (
        <Link
          key={item.id}
          to={`/detailsconseil/${item.id}`}
          className="group flex items-center gap-6 hover:opacity-90 transition"
        >
          {/* Image */}
          <div className="flex-shrink-0 w-[160px] h-[150px]">
            <img
              src={item.image || "/placeholder.jpg"}
              alt={item.title}
              className="w-full h-full object-cover rounded-md shadow-sm group-hover:scale-[1.02] transition-transform"
            />
          </div>

          {/* Content */}
          <div className="flex flex-col justify-center">
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-snug group-hover:text-app-primary transition-colors -mt-20">
              {item.title}
            </h3>
          </div>
        </Link>
      ))}
    </div>
  </section>
)}


        {/* Footer */}
           <Footer footerSections={footerSections} />

      </div>
    </div>
  );
};
