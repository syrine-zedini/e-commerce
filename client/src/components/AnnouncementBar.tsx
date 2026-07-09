import React from "react";

export default function AnnouncementBar() {
  return (
    <>
      <style>{`
        @keyframes slideInText {
          0% { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerBar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes glowPulse {
          0%, 100% { text-shadow: 0 0 6px rgba(29,142,230,0.4); box-shadow: 0 0 10px rgba(29,142,230,0.3); }
          50%       { text-shadow: 0 0 16px rgba(29,142,230,0.9), 0 0 30px rgba(29,142,230,0.4); box-shadow: 0 0 20px rgba(29,142,230,0.6); }
        }
        @keyframes badgePop {
          0%   { transform: scale(0.85); opacity: 0; }
          60%  { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }

        /* Truck continuously moving to simulate driving */
        @keyframes truckDrive {
          0%   { transform: translateY(0) translateX(0) rotate(0deg); }
          25%  { transform: translateY(-2px) translateX(3px) rotate(-1deg); }
          50%  { transform: translateY(0px) translateX(6px) rotate(0deg); }
          75%  { transform: translateY(-1px) translateX(3px) rotate(1deg); }
          100% { transform: translateY(0) translateX(0) rotate(0deg); }
        }

        /* Speed lines moving past the truck */
        @keyframes speedLines {
          0% { stroke-dashoffset: 20; opacity: 0; }
          50% { opacity: 1; }
          100% { stroke-dashoffset: -20; opacity: 0; }
        }

        /* Text gradient shine animation */
        @keyframes textShine {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .announce-text-container {
          animation: slideInText 0.6s ease both;
        }

        .announce-text-shine {
          background: linear-gradient(to right, #1e293b 20%, #1D8EE6 50%, #1e293b 80%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: textShine 3s linear infinite;
        }

        .truck-icon {
          animation: truckDrive 1s ease-in-out infinite;
        }

        .speed-line {
          stroke-dasharray: 10;
          animation: speedLines 1s linear infinite;
        }
        .speed-line-2 {
          stroke-dasharray: 10;
          animation: speedLines 1.2s linear infinite 0.3s;
        }
        .speed-line-3 {
          stroke-dasharray: 10;
          animation: speedLines 0.8s linear infinite 0.1s;
        }

        .shimmer-bar {
          animation: shimmerBar 2.4s linear infinite;
        }
        .glow-price {
          animation: glowPulse 2s ease-in-out infinite;
        }
        .badge-pop {
          animation: badgePop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.3s both;
        }
      `}</style>

      {/* Banner */}
      <div className="w-full bg-gradient-to-r from-[#dbeeff] via-[#EBF5FC] to-[#dbeeff] py-5 border-b border-[#bae6fd]/60 shadow-sm relative overflow-hidden">

        {/* Shimmer sweep */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="shimmer-bar absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>

        <div className="w-full px-6 flex items-center justify-center gap-4">

          {/* Truck — now continuously drives/bounces */}
          <div className="truck-icon flex-shrink-0">
            <svg width="38" height="28" viewBox="0 0 52 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Body */}
              <rect x="5" y="6" width="30" height="20" rx="3" fill="#1D8EE6" />
              {/* Cabin */}
              <path d="M35 10h10l5 7v9H35V10z" fill="#0e72c5" />
              {/* Window */}
              <path d="M37 12h7l3 5H37v-5z" fill="#dbeeff" opacity="0.85" />
              {/* Wheels */}
              <circle cx="15" cy="28" r="4" fill="#0a4d8c" />
              <circle cx="15" cy="28" r="2" fill="#EBF5FC" />
              <circle cx="43" cy="28" r="4" fill="#0a4d8c" />
              <circle cx="43" cy="28" r="2" fill="#EBF5FC" />
              {/* Animated Speed lines */}
              <line className="speed-line" x1="-10" y1="13" x2="10" y2="13" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
              <line className="speed-line-2" x1="-5" y1="18" x2="8" y2="18" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
              <line className="speed-line-3" x1="-8" y1="23" x2="12" y2="23" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Title text */}
          <div className="announce-text-container font-bold tracking-widest text-[11px] md:text-[13px] uppercase flex items-center gap-2 select-none">
            <span className="announce-text-shine">Livraison gratuite à partir de</span>
            <span className="badge-pop inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#1D8EE6] text-white font-extrabold text-[12px] md:text-[14px] glow-price border border-blue-400">
              69 TND
            </span>
            <span className="announce-text-shine">d'achats dans toute la Tunisie</span>
          </div>

        </div>
      </div>
    </>
  );
}
