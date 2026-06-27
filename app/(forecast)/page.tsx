import { Suspense } from "react";
import { AlertBanner } from "@/components/forecast/AlertBanner";
import { CurrentConditions } from "@/components/forecast/CurrentConditions";
import { DailyList } from "@/components/forecast/DailyList";
import { HourlyStrip } from "@/components/forecast/HourlyStrip";
import { TextForecastCard } from "@/components/forecast/TextForecastCard";
import {
  type AladinForecast,
  fromNow,
  getAladinForecast,
} from "@/lib/chmi/aladin";
import { getActiveAlerts, type WeatherAlert } from "@/lib/chmi/alerts";
import { DEFAULT_LOCATION } from "@/lib/chmi/config";
import {
  type DailyTextForecast,
  getNationalTextForecast,
} from "@/lib/chmi/text";

export const dynamic = "force-dynamic";

// Each section gets its own promise + Suspense boundary so the page shell
// (and whichever sections resolve first) can stream in immediately instead
// of the whole route blocking on the slowest upstream fetch (ALADIN GRIB2).
export default function ForecastPage() {
  const aladinPromise = getAladinForecast(
    DEFAULT_LOCATION.lat,
    DEFAULT_LOCATION.lon,
  ).catch(() => null);
  const textPromise = getNationalTextForecast().catch(() => []);
  const alertsPromise = getActiveAlerts().catch(() => []);

  return (
    <div className="flex flex-col animate-fade-in">
      <Suspense fallback={<HeroPlaceholder />}>
        <Hero aladinPromise={aladinPromise} />
      </Suspense>

      <main className="flex flex-col gap-4 px-[26px] pt-4 pb-32">
        <Suspense fallback={null}>
          <Alerts alertsPromise={alertsPromise} />
        </Suspense>

        <Suspense fallback={null}>
          <TextCard textPromise={textPromise} />
        </Suspense>

        <Suspense fallback={<HourlyPlaceholder />}>
          <Hourly aladinPromise={aladinPromise} />
        </Suspense>

        <Suspense fallback={<DailyPlaceholder />}>
          <Daily aladinPromise={aladinPromise} textPromise={textPromise} />
        </Suspense>
      </main>
    </div>
  );
}

async function Hero({
  aladinPromise,
}: {
  aladinPromise: Promise<AladinForecast | null>;
}) {
  const aladin = await aladinPromise;
  const current = aladin && fromNow(aladin.hourly)[0];
  const today = aladin?.daily[0];

  if (!current) {
    return (
      <div className="px-4 pb-2 pt-[max(3.5rem,calc(env(safe-area-inset-top)+1.5rem))]">
        <div className="rounded-2xl border border-border-subtle bg-surface p-3 text-xs text-white/55">
          Numerická předpověď ALADIN momentálně není dostupná, zobrazena je jen
          slovní předpověď ČHMÚ.
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <CurrentConditions
        time={current.time}
        temperatureC={current.temperatureC}
        precipMm={current.precipMm}
        cloudCoverPct={current.cloudCoverPct}
        windSpeedKmh={current.windSpeedKmh}
        windDirDeg={current.windDirDeg}
        highC={today?.highC}
        lowC={today?.lowC}
      />
    </div>
  );
}

function HeroPlaceholder() {
  return (
    <div className="flex flex-col items-center gap-3 px-4 pb-12 pt-[max(3.5rem,calc(env(safe-area-inset-top)+1.5rem))]">
      <div className="text-sm font-medium text-white/55">Praha</div>
      <div className="py-6 text-sm text-white/55">Načítání počasí…</div>
    </div>
  );
}

async function Alerts({
  alertsPromise,
}: {
  alertsPromise: Promise<WeatherAlert[]>;
}) {
  const alerts = await alertsPromise;
  return <AlertBanner alerts={alerts} />;
}

async function Hourly({
  aladinPromise,
}: {
  aladinPromise: Promise<AladinForecast | null>;
}) {
  const aladin = await aladinPromise;
  if (!aladin) return null;

  return (
    <div className="animate-fade-up animation-delay-150">
      <HourlyStrip hourly={fromNow(aladin.hourly).slice(0, 24)} />
    </div>
  );
}

function HourlyPlaceholder() {
  return (
    <div className="px-4 py-7 text-center text-xs text-white/55">
      Načítání hodinové předpovědi…
    </div>
  );
}

async function Daily({
  aladinPromise,
  textPromise,
}: {
  aladinPromise: Promise<AladinForecast | null>;
  textPromise: Promise<DailyTextForecast[]>;
}) {
  const [aladin, textDays] = await Promise.all([aladinPromise, textPromise]);

  return (
    <div className="animate-fade-up animation-delay-300">
      <DailyList numericDays={aladin?.daily ?? []} qualitativeDays={textDays} />
    </div>
  );
}

function DailyPlaceholder() {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface px-4 py-7 text-center text-xs text-white/55">
      Načítání předpovědi na 7 dní…
    </div>
  );
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
