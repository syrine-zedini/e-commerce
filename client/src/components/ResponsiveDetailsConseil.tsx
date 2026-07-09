import { DetailsConseilMobile } from '@/pages/ConseilDetailsMobile';
import { DetailconseilsSant } from '@/pages/DetailconseilsSant';
import React, { useState, useEffect } from 'react';

export function ResponsiveDeatilsConseil() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to check if window is mobile size
    function handleResize() {
      setIsMobile(window.innerWidth < 768); // breakpoint example: <768px = mobile
    }

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile ? < DetailsConseilMobile/> : <DetailconseilsSant/>;
}
