import { cookies } from "next/headers";
import { Suspense } from "react";
import { AlertBanner } from "@/components/forecast/AlertBanner";
import {
  DailySkeleton,
  HeroSkeleton,
  HourlySkeleton,
} from "@/components/forecast/ForecastSkeleton";
import {
  ForecastDaily,
  ForecastHero,
  ForecastHourly,
  ForecastView,
} from "@/components/forecast/ForecastView";
import { TextForecastCard } from "@/components/forecast/TextForecastCard";
import { getAladinForecast } from "@/lib/chmi/aladin";
import { getActiveAlerts, type WeatherAlert } from "@/lib/chmi/alerts";
import { DEFAULT_LOCATION } from "@/lib/chmi/config";
import {
  type DailyTextForecast,
  getNationalTextForecast,
} from "@/lib/chmi/text";
import { isNightHour } from "@/lib/weather-codes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function ForecastPage() {
  const cookieStore = await cookies();
  const locationCookie = cookieStore.get("user-location")?.value;

  let lat = DEFAULT_LOCATION.lat;
  let lon = DEFAULT_LOCATION.lon;
  let locationLabel = "Praha";

  if (locationCookie) {
    try {
      const parsed = JSON.parse(locationCookie);
      if (typeof parsed.lat === "number" && typeof parsed.lon === "number") {
        lat = parsed.lat;
        lon = parsed.lon;
        locationLabel = parsed.name || "Lokace";
      }
    } catch {}
  }

  // Pre-fetch forecasts from the server (either for user's cookie location or default Prague)
  const aladinPromise = getAladinForecast(lat, lon).catch(() => null);
  const textPromise = getNationalTextForecast().catch(() => []);
  const alertsPromise = getActiveAlerts().catch(() => []);

  return (
    <ForecastView
      initialLocationLabel={locationLabel}
      initialLat={lat}
      initialLon={lon}
      aladinPromise={aladinPromise}
    >
      <Suspense fallback={<HeroPlaceholder />}>
        <ForecastHero aladinPromise={aladinPromise} />
      </Suspense>

      <main className="flex flex-col gap-4 px-[26px] pt-4 pb-32">
        <Suspense fallback={null}>
          <Alerts alertsPromise={alertsPromise} />
        </Suspense>

        <Suspense fallback={null}>
          <TextCard textPromise={textPromise} />
        </Suspense>

        <Suspense fallback={<HourlyPlaceholder />}>
          <ForecastHourly aladinPromise={aladinPromise} />
        </Suspense>

        <Suspense fallback={<DailyPlaceholder />}>
          <ForecastDaily
            aladinPromise={aladinPromise}
            textPromise={textPromise}
          />
        </Suspense>
      </main>
    </ForecastView>
  );
}

function HeroPlaceholder() {
  return (
    <HeroSkeleton
      isNight={isNightHour(
        new Date().toISOString(),
        DEFAULT_LOCATION.lat,
        DEFAULT_LOCATION.lon,
      )}
    />
  );
}

function HourlyPlaceholder() {
  return <HourlySkeleton />;
}

function DailyPlaceholder() {
  return <DailySkeleton />;
}

async function Alerts({
  alertsPromise,
}: {
  alertsPromise: Promise<WeatherAlert[]>;
}) {
  const alerts = await alertsPromise;
  return <AlertBanner alerts={alerts} />;
}

async function TextCard({
  textPromise,
}: {
  textPromise: Promise<DailyTextForecast[]>;
}) {
  const textDays = await textPromise;
  if (!textDays[0]) return null;

  return (
    <div className="animate-fade-up animation-delay-225">
      <TextForecastCard day={textDays[0]} />
    </div>
  );
}
