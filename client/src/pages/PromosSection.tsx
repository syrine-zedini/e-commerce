import React, { useEffect, useState } from 'react';

import { apiGet } from '@/lib/api';
import { Link } from 'wouter';

interface Conseil {
  id: number;
  title: string;
  content: string;
  image: string;
  category: string;
}

const PromosSection: React.FC = () => {
  const [conseils, setConseils] = useState<Conseil[]>([]);

const fetchConseils = async () => {
  try {
    const data = await apiGet('/api/conseils?sort=id&order=desc&limit=3');
    setConseils(data || []);
  } catch (error) {
    console.error(error);
  }
};

const truncateContent = (text: string, wordLimit: number) => {
  const words = text.split(' ');
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ') + '...';
};


  useEffect(() => {
    fetchConseils();
  }, []);

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8">
          <span className="text-xs font-bold text-[#C86D85] tracking-widest uppercase mb-1.5 block">CONSEILS DE NOS PHARMACIENS</span>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight">
            Conseils & Santé
          </h2>
          <div className="w-12 h-[3px] bg-[#C86D85] mt-3 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {conseils.map((conseil) => (
            <div
              key={conseil.id}
              className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col group"
            >
              {/* Image Container */}
              <div className="relative h-56 overflow-hidden bg-slate-50">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={conseil.title}
                  src={conseil.image}
                />
                {conseil.category && (
                  <span className="absolute top-4 left-4 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
                    {conseil.category}
                  </span>
                )}
              </div>

              {/* Text Content */}
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-bold text-slate-800 text-base lg:text-lg mb-2 line-clamp-2 hover:text-[#C86D85] transition-colors leading-snug">
                  {conseil.title}
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm mb-4 line-clamp-3 leading-relaxed flex-1">
                  {truncateContent(conseil.content, 18)}
                </p>
                <Link to={`/detailsconseil/${conseil.id}`}>
                  <span className="inline-flex items-center text-[#C86D85] hover:text-blue-700 font-bold text-sm transition-colors cursor-pointer">
                    Lire l'article <span className="ml-1.5 group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromosSection;
