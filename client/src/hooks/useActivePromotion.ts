import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Fetches the single active promotion closest to expiring and counts down
// to its end_date. Shared between Home and Homemobile (identical logic;
// Home currently doesn't render the countdown in its JSX, Homemobile does —
// this hook doesn't change that, it only supplies the same data either way).
export function useActivePromotion() {
  const [offerEndDate, setOfferEndDate] = useState<string>("");
  const [promoName, setPromoName] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const fetchActivePromotion = async () => {
      let data: any = null;
      try {
        const rows = await apiGet("/api/promotions?active=1&limit=1&sort=end_date");
        data = rows?.[0] || null;
      } catch {
        return;
      }

      if (!data) {
        return;
      }

      if (data?.end_date) {
        setOfferEndDate(data.end_date);
      }
      if (data?.name) {
        setPromoName(data.name);
      }
    };

    fetchActivePromotion();
  }, []);

  useEffect(() => {
    if (!offerEndDate) return;

    const end = new Date(offerEndDate);
    const timer = setInterval(() => {
      const now = new Date();
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [offerEndDate]);

  return { offerEndDate, promoName, timeLeft };
}
