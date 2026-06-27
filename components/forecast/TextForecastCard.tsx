"use client";

import type { DailyTextForecast } from "@/lib/chmi/text";

export function TextForecastCard({ day }: { day: DailyTextForecast }) {
  const intro = day.sections.find((s) => s.name === "textIntro")?.text;
  const weather = day.sections.find((s) => s.name === "textWeather")?.text;

  // Combine intro and weather details nicely
  const summaryText = [intro, weather].filter(Boolean).join(" ");

  return (
    <div className="text-[#16161a]">
      <div className="text-[9px] tracking-[0.16em] text-[#6b6b70] font-bold mb-[4px]">
        DNES
      </div>
      <div className="text-[13px] leading-[1.4] text-[#16161a] font-normal">
        {summaryText || day.headline}
      </div>
    </div>
  );
}
