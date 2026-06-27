"use client";

import { useState } from "react";
import { CurrentConditions } from "@/components/forecast/CurrentConditions";
import {
  CONDITION_ICON,
  CONDITION_LABEL,
  type Condition,
} from "@/lib/weather-codes";

// Representative numeric inputs per condition so the conditions strip
// (precipitation / wind / humidity) shows sensible numbers for each state.
// The actual rendered condition is forced via `conditionOverride`, so these
// values only feed the secondary readouts.
const SAMPLES: Record<
  Condition,
  { temperatureC: number; precipMm: number; cloudCoverPct: number }
> = {
  clear: { temperatureC: 24, precipMm: 0, cloudCoverPct: 5 },
  "partly-cloudy": { temperatureC: 21, precipMm: 0, cloudCoverPct: 45 },
  cloudy: { temperatureC: 17, precipMm: 0, cloudCoverPct: 90 },
  rain: { temperatureC: 13, precipMm: 2.4, cloudCoverPct: 95 },
  storm: { temperatureC: 19, precipMm: 6, cloudCoverPct: 100 },
  snow: { temperatureC: -2, precipMm: 1.8, cloudCoverPct: 95 },
  fog: { temperatureC: 7, precipMm: 0, cloudCoverPct: 70 },
};

const CONDITIONS = Object.keys(SAMPLES) as Condition[];

export default function DebugPage() {
  const [condition, setCondition] = useState<Condition>("clear");
  const [isNight, setIsNight] = useState(false);

  const sample = SAMPLES[condition];

  return (
    <div className="flex flex-col min-h-dvh">
      <CurrentConditions
        time="2026-06-27T12:00:00Z"
        temperatureC={sample.temperatureC}
        precipMm={sample.precipMm}
        cloudCoverPct={sample.cloudCoverPct}
        windSpeedKmh={11}
        windDirDeg={225}
        highC={sample.temperatureC + 4}
        lowC={sample.temperatureC - 6}
        locationLabel="Debug"
        conditionOverride={condition}
        isNightOverride={isNight}
      />

      <div className="flex flex-col gap-4 px-[26px] py-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-[0.13em] text-foreground/60">
            DEBUG · STAVY POČASÍ
          </span>
          <button
            type="button"
            onClick={() => setIsNight((v) => !v)}
            className="text-[13px] font-semibold py-[7px] px-[14px] rounded-full border border-border-subtle bg-surface text-foreground active:scale-95 transition-transform"
          >
            {isNight ? "🌙 Noc" : "☀️ Den"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {CONDITIONS.map((c) => {
            const active = c === condition;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCondition(c)}
                className={`flex items-center gap-2 text-[14px] font-semibold py-[11px] px-[14px] rounded-[14px] border transition-all active:scale-95 ${
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border-subtle bg-surface text-foreground"
                }`}
              >
                <span className="text-[16px]">{CONDITION_ICON[c]}</span>
                {CONDITION_LABEL[c]}
              </button>
            );
          })}
        </div>

        <p className="text-[12px] text-foreground/60 leading-relaxed">
          Vyber stav a přepni den/noc pro náhled hero grafiky. Tato stránka je
          jen pro vývoj.
        </p>
      </div>
    </div>
  );
}
