"use client";

import { createContext, use, useContext, useEffect, useState } from "react";
import { CurrentConditions } from "@/components/forecast/CurrentConditions";
import { DailyList } from "@/components/forecast/DailyList";
import { HourlyStrip } from "@/components/forecast/HourlyStrip";
import { NavTabs } from "@/components/NavTabs";
import { PullToRefresh } from "@/components/PullToRefresh";
import { RadarView } from "@/components/radar/RadarView";
import type { AladinForecast, HourlyPoint } from "@/lib/chmi/aladin";
import { DEFAULT_LOCATION } from "@/lib/chmi/config";
import type { DailyTextForecast } from "@/lib/chmi/text";

function fromNow(hourly: HourlyPoint[]): HourlyPoint[] {
  const cutoff = Date.now() - 30 * 60_000;
  return hourly.filter((h) => new Date(h.time).getTime() >= cutoff);
}

interface ForecastContextType {
  aladin: AladinForecast | null;
  locationLabel: string;
  loading: boolean;
  boundaryWarning: string | null;
  activeTab: "forecast" | "radar";
  setActiveTab: (tab: "forecast" | "radar") => void;
  lat: number;
  lon: number;
}

const ForecastContext = createContext<ForecastContextType | null>(null);

const DEFAULT_CONTEXT: ForecastContextType = {
  aladin: null,
  locationLabel: "Praha",
  loading: false,
  boundaryWarning: null,
  activeTab: "forecast",
  setActiveTab: () => {},
  lat: DEFAULT_LOCATION.lat,
  lon: DEFAULT_LOCATION.lon,
};

export function useForecast() {
  const context = useContext(ForecastContext);
  return context || DEFAULT_CONTEXT;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null;
  return null;
}

export function ForecastProvider({
  children,
  initialLocationLabel,
  initialLat,
  initialLon,
  aladinPromise,
}: {
  children: React.ReactNode;
  initialLocationLabel: string;
  initialLat: number;
  initialLon: number;
  aladinPromise: Promise<AladinForecast | null>;
}) {
  const [aladin, setAladin] = useState<AladinForecast | null>(null);
  const [locationLabel, setLocationLabel] =
    useState<string>(initialLocationLabel);
  const [loading, setLoading] = useState<boolean>(false);
  const [boundaryWarning, setBoundaryWarning] = useState<string | null>(null);
  const [activeTab, setActiveTabState] = useState<"forecast" | "radar">(
    "forecast",
  );
  const [lat, setLat] = useState<number>(initialLat);
  const [lon, setLon] = useState<number>(initialLon);

  // Sync initial state if it changes on the server (e.g. page refresh / router refresh)
  useEffect(() => {
    setLocationLabel(initialLocationLabel);
    setLat(initialLat);
    setLon(initialLon);
    aladinPromise.then((data) => {
      if (data) setAladin(data);
    });
  }, [initialLocationLabel, initialLat, initialLon, aladinPromise]);

  // Read initial URL path on mount to activate correct tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path === "/radar") {
        setActiveTabState("radar");
      }
    }
  }, []);

  // Check for app updates when PWA is resumed/focused
  useEffect(() => {
    if (typeof window === "undefined") return;

    let initialVersion: string | null = null;

    const checkUpdate = async () => {
      try {
        const res = await fetch("/api/version");
        if (res.ok) {
          const data = await res.json();
          const serverVersion = data.version;

          if (!initialVersion) {
            initialVersion = serverVersion;
          } else if (
            initialVersion !== "development" &&
            serverVersion !== "development" &&
            initialVersion !== serverVersion
          ) {
            console.log("New version detected, reloading...", {
              initialVersion,
              serverVersion,
            });
            window.location.reload();
          }
        }
      } catch (err) {
        console.warn("Failed to check app version:", err);
      }
    };

    // Run check on mount
    checkUpdate();

    // Run check when tab becomes visible or focused
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkUpdate();
      }
    };

    const handleFocus = () => {
      checkUpdate();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const setActiveTab = (tab: "forecast" | "radar") => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      const path = tab === "radar" ? "/radar" : "/";
      if (window.location.pathname !== path) {
        window.history.pushState(null, "", path);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        setActiveTabState(path === "/radar" ? "radar" : "forecast");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const updateLocation = async (userLat: number, userLon: number) => {
      setLoading(true);
      setBoundaryWarning(null);

      try {
        // 1. Fetch updated Aladin forecast
        const res = await fetch(`/api/forecast?lat=${userLat}&lon=${userLon}`);
        if (!res.ok) {
          throw new Error("Failed to fetch forecast from ALADIN API");
        }
        const newAladin: AladinForecast = await res.json();

        // 2. Reverse geocode coordinates
        let name = "Moje Poloha";
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${userLat}&lon=${userLon}&format=json&accept-language=cs`,
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const addr = geoData.address;
            if (addr) {
              name =
                addr.city ||
                addr.town ||
                addr.village ||
                addr.municipality ||
                addr.suburb ||
                addr.county ||
                "Moje Poloha";
            }
          }
        } catch (e) {
          console.error("Reverse geocoding error:", e);
        }

        // 3. Save states
        setAladin(newAladin);
        setLocationLabel(name);
        setLat(userLat);
        setLon(userLon);

        // 4. Update the cookie to cache coordinates and name for 1 year
        // biome-ignore lint/suspicious/noDocumentCookie: direct cookie assignment is used to persist location for server-side render
        document.cookie = `user-location=${JSON.stringify({ lat: userLat, lon: userLon, name })}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
      } catch (err) {
        console.error("Failed to load forecast for coordinates:", err);
        setBoundaryWarning(
          "Předpověď je dostupná pouze pro území ČR. Zobrazena je Praha.",
        );

        // Fall back to Prague
        try {
          const pragueRes = await fetch(
            `/api/forecast?lat=${DEFAULT_LOCATION.lat}&lon=${DEFAULT_LOCATION.lon}`,
          );
          if (pragueRes.ok) {
            const pragueAladin = await pragueRes.json();
            setAladin(pragueAladin);
            setLocationLabel("Praha");
            setLat(DEFAULT_LOCATION.lat);
            setLon(DEFAULT_LOCATION.lon);
            // Clear the invalid user location cookie
            // biome-ignore lint/suspicious/noDocumentCookie: direct cookie assignment is used to clear invalid location
            document.cookie = "user-location=; path=/; max-age=0; SameSite=Lax";
          }
        } catch (fallbackErr) {
          console.error("Fallback to Prague failed:", fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const snappedLat = Math.round(latitude * 100) / 100;
        const snappedLon = Math.round(longitude * 100) / 100;

        // Check if cached coordinates exist and match the snapped values
        const cachedCookie = getCookie("user-location");
        if (cachedCookie) {
          try {
            const parsed = JSON.parse(cachedCookie);
            const cachedSnappedLat = Math.round(parsed.lat * 100) / 100;
            const cachedSnappedLon = Math.round(parsed.lon * 100) / 100;

            if (
              snappedLat === cachedSnappedLat &&
              snappedLon === cachedSnappedLon
            ) {
              // Same grid cell/location, do nothing
              return;
            }
          } catch {}
        }

        updateLocation(latitude, longitude);
      },
      (err) => {
        console.warn("Geolocation failed or denied:", err);
      },
      { timeout: 8000 },
    );
  }, []);

  return (
    <ForecastContext.Provider
      value={{
        aladin,
        locationLabel,
        loading,
        boundaryWarning,
        activeTab,
        setActiveTab,
        lat,
        lon,
      }}
    >
      {children}
    </ForecastContext.Provider>
  );
}

export function ForecastView({
  children,
  initialLocationLabel,
  initialLat,
  initialLon,
  aladinPromise,
}: {
  children: React.ReactNode;
  initialLocationLabel: string;
  initialLat: number;
  initialLon: number;
  aladinPromise: Promise<AladinForecast | null>;
}) {
  return (
    <ForecastProvider
      initialLocationLabel={initialLocationLabel}
      initialLat={initialLat}
      initialLon={initialLon}
      aladinPromise={aladinPromise}
    >
      <ForecastLayout>{children}</ForecastLayout>
    </ForecastProvider>
  );
}

function ForecastLayout({ children }: { children: React.ReactNode }) {
  const { loading, boundaryWarning, activeTab } = useForecast();

  return (
    <div className="flex flex-col relative min-h-dvh">
      {/* Dynamic progress bar during client-side fetch */}
      {loading && (
        <div
          className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400 animate-pulse z-[100]"
          aria-hidden="true"
        />
      )}

      {boundaryWarning && activeTab === "forecast" && (
        <div className="mx-[26px] mt-4 p-3 rounded-xl border border-[#ef4b4b]/20 bg-[#ef4b4b]/5 text-xs text-[#ef4b4b] flex items-center gap-2 animate-fade-up">
          <svg
            className="shrink-0"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{boundaryWarning}</span>
        </div>
      )}

      {/* Forecast Page Container */}
      <PullToRefresh enabled={activeTab === "forecast"}>
        <div
          className="flex-col animate-fade-in relative"
          style={{ display: activeTab === "forecast" ? "flex" : "none" }}
        >
          {children}
        </div>
      </PullToRefresh>

      {/* Radar Page Container */}
      <div
        style={{ display: activeTab === "radar" ? "block" : "none" }}
        className="fixed inset-0 z-0"
      >
        <RadarView />
      </div>

      <NavTabs />
    </div>
  );
}

export function ForecastHero({
  aladinPromise,
}: {
  aladinPromise: Promise<AladinForecast | null>;
}) {
  const { aladin: clientAladin, locationLabel } = useForecast();
  const initialAladin = use(aladinPromise);
  const aladin = clientAladin || initialAladin;

  const current = aladin && fromNow(aladin.hourly)[0];
  const today = aladin?.daily[0];

  if (!current) {
    return (
      <div className="px-4 pb-2 pt-[max(1.5rem,calc(env(safe-area-inset-top)+6px))]">
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
        locationLabel={locationLabel}
      />
    </div>
  );
}

export function ForecastHourly({
  aladinPromise,
}: {
  aladinPromise: Promise<AladinForecast | null>;
}) {
  const { aladin: clientAladin } = useForecast();
  const initialAladin = use(aladinPromise);
  const aladin = clientAladin || initialAladin;

  if (!aladin) return null;

  return (
    <div className="animate-fade-up animation-delay-150">
      <HourlyStrip hourly={fromNow(aladin.hourly).slice(0, 24)} />
    </div>
  );
}

export function ForecastDaily({
  aladinPromise,
  textPromise,
}: {
  aladinPromise: Promise<AladinForecast | null>;
  textPromise: Promise<DailyTextForecast[]>;
}) {
  const { aladin: clientAladin } = useForecast();
  const initialAladin = use(aladinPromise);
  const textDays = use(textPromise);
  const aladin = clientAladin || initialAladin;

  return (
    <div className="animate-fade-up animation-delay-300">
      <DailyList numericDays={aladin?.daily ?? []} qualitativeDays={textDays} />
    </div>
  );
}
