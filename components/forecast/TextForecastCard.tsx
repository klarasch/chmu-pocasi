import type { DailyTextForecast } from "@/lib/chmi/text";

const DAY_NAMES = ["Dnes", "Zítra"];

export function TextForecastCard({ day }: { day: DailyTextForecast }) {
  const label = DAY_NAMES[day.dayOffset] ?? day.headline;
  const intro = day.sections.find((s) => s.name === "textIntro");
  const weather = day.sections.find((s) => s.name === "textWeather");

  return (
    <div className="p-4">
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-white/60">
        {label}
      </div>
      <div className="mb-1.5 font-medium">{intro?.text ?? day.headline}</div>
      {weather && (
        <p className="text-[13px] leading-relaxed text-white/60">
          {weather.text}
        </p>
      )}
    </div>
  );
}
