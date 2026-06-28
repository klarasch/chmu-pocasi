import {
  DailySkeleton,
  HeroSkeleton,
  HourlySkeleton,
} from "@/components/forecast/ForecastSkeleton";
import { isNightHour } from "@/lib/weather-codes";

// Shown only during the brief window where Next fetches this route's RSC
// payload on a client-side tab switch (e.g. Radar -> Předpověď); the page
// itself isn't async, so its own Suspense fallbacks (same skeletons) take
// over immediately after. Mirrors the real layout to avoid any visible jump.
export default function ForecastLoading() {
  return (
    <div className="flex flex-col animate-fade-in">
      <HeroSkeleton isNight={isNightHour(new Date().toISOString())} />
      <main className="flex flex-col gap-4 px-[26px] pt-4 pb-32">
        <HourlySkeleton />
        <DailySkeleton />
      </main>
    </div>
  );
}
