"use client";

import { useState } from "react";
import { useForecast } from "@/components/forecast/ForecastView";

function ForecastIcon() {
  return (
    <span
      className="flex flex-col gap-[2px] w-[11px] shrink-0"
      aria-hidden="true"
    >
      <span className="h-[1.5px] bg-current rounded-[1px] w-full" />
      <span className="h-[1.5px] bg-current rounded-[1px] w-full" />
      <span className="h-[1.5px] bg-current rounded-[1px] w-[7px]" />
    </span>
  );
}

function RadarIcon() {
  return (
    <span className="relative w-[11px] h-[11px] shrink-0" aria-hidden="true">
      <span className="absolute inset-0 border-[1.5px] border-current rounded-full" />
      <span className="absolute inset-[2.5px] border-[1px] border-current rounded-full" />
      <span className="absolute left-[4px] top-[4px] w-[3px] h-[3px] bg-current rounded-full" />
    </span>
  );
}

function InfoIcon() {
  return (
    <span
      className="relative w-[18px] h-[18px] shrink-0 flex items-center justify-center font-serif text-[12px] font-bold border border-current rounded-full"
      aria-hidden="true"
    >
      i
    </span>
  );
}

export function NavTabs() {
  const { activeTab, setActiveTab } = useForecast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const btnStyle = (active: boolean) =>
    `border-none cursor-pointer font-sans text-[13px] font-semibold tracking-[0.02em] py-[10px] px-[22px] rounded-[30px] flex items-center gap-[8px] transition-all duration-150 active:scale-95 ${
      active
        ? "bg-[rgba(255,255,255,0.85)] text-[#16161a] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.22)]"
        : "bg-transparent text-[rgba(40,40,44,0.55)] hover:text-[rgba(40,40,44,0.8)]"
    }`;

  return (
    <>
      <nav
        className="fixed inset-x-0 z-50 flex justify-center items-center gap-[10px] pointer-events-none"
        style={{ bottom: "var(--nav-tabs-bottom)" }}
      >
        {/* Main Tab Pill */}
        <div
          className="pointer-events-auto flex items-center gap-[4px] p-[6px] rounded-[40px] bg-[rgba(255,255,255,0.4)] border border-[rgba(255,255,255,0.65)] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.85),inset_0_-8px_16px_-10px_rgba(120,120,140,0.3)]"
          style={{
            backdropFilter: "blur(20px) saturate(1.8)",
            WebkitBackdropFilter: "blur(20px) saturate(1.8)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("forecast")}
            className={btnStyle(activeTab === "forecast")}
          >
            <ForecastIcon />
            Předpověď
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("radar")}
            className={btnStyle(activeTab === "radar")}
          >
            <RadarIcon />
            Radar
          </button>
        </div>

        {/* Separate Circular Info Button */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="pointer-events-auto flex items-center justify-center w-[60px] h-[60px] rounded-full border border-[rgba(255,255,255,0.65)] bg-[rgba(255,255,255,0.4)] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.85),inset_0_-8px_16px_-10px_rgba(120,120,140,0.3)] hover:bg-[rgba(255,255,255,0.55)] active:scale-95 transition-all duration-150 text-[rgba(40,40,44,0.55)] hover:text-[rgba(40,40,44,0.8)] cursor-pointer"
          style={{
            backdropFilter: "blur(20px) saturate(1.8)",
            WebkitBackdropFilter: "blur(20px) saturate(1.8)",
          }}
          title="Informace a data"
          aria-label="Zobrazit informace o aplikaci a zdroje dat"
        >
          <InfoIcon />
        </button>
      </nav>

      {/* Frosted Glass Attribution Modal */}
      {isModalOpen && (
        /* biome-ignore lint/a11y/noStaticElementInteractions: click outside backdrop to close */
        /* biome-ignore lint/a11y/useKeyWithClickEvents: click outside backdrop to close */
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/15 backdrop-blur-md animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          {/* biome-ignore lint/a11y/noStaticElementInteractions: stopPropagation on modal container */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation on modal container */}
          <div
            className="bg-[rgba(244,243,240,0.92)] border border-[#cfcdc6] p-6 rounded-2xl w-full max-w-[340px] shadow-2xl relative flex flex-col gap-4 text-left font-sans text-[#16161a] animate-fade-up"
            style={{
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div>
              <div className="text-[9px] tracking-[0.16em] text-[#6b6b70] font-bold mb-[2px] uppercase">
                O Aplikaci
              </div>
              <h2 className="text-lg font-bold tracking-tight">ČHMÚ Počasí</h2>
            </div>

            {/* Info contents */}
            <div className="flex flex-col gap-3 text-xs leading-relaxed text-[#6b6b70]">
              <p>
                Projekt minimalistické a přehledné předpovědi počasí využívající
                oficiální otevřená data.
              </p>
              <div className="border-t border-[#cfcdc6]/40 pt-3 flex flex-col gap-2">
                <div>
                  <span className="font-semibold text-[#16161a]">Vývoj: </span>
                  <a
                    href="https://ksch.cz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[#16161a] font-medium"
                  >
                    Klára Scholleová
                  </a>
                </div>
                <div>
                  <span className="font-semibold text-[#16161a]">
                    Předpovědní data:{" "}
                  </span>
                  <a
                    href="https://www.chmi.cz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[#16161a] font-medium"
                  >
                    ČHMÚ
                  </a>
                  , licence CC BY 4.0. Zahrnuje numerický model ALADIN a textové
                  předpovědi.
                </div>
                <div>
                  <span className="font-semibold text-[#16161a]">
                    Radar &amp; Mapy:{" "}
                  </span>
                  <a
                    href="https://openfreemap.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[#16161a] font-medium"
                  >
                    OpenFreeMap
                  </a>{" "}
                  &amp;{" "}
                  <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[#16161a] font-medium"
                  >
                    OpenStreetMap
                  </a>{" "}
                  přispěvatelé.
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="border-none cursor-pointer mt-2 w-full py-[10px] rounded-xl text-center text-xs font-semibold tracking-wide bg-[#16161a] text-[#f4f3f0] hover:bg-[#28282c] transition-colors active:scale-95 duration-100"
            >
              Zavřít
            </button>
          </div>
        </div>
      )}
    </>
  );
}
