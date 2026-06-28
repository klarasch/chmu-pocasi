// Skeleton placeholders for the forecast page's Suspense fallbacks (and the
// route's loading.tsx). Mirrors the real components' markup/sizing 1:1 so
// resolved content drops in without any layout shift, and reuses static
// chrome (masthead, section headers) verbatim since it needs no fetched data.

const HOURLY_SKELETON_KEYS = ["h0", "h1", "h2", "h3", "h4", "h5"];
const DAILY_SKELETON_KEYS = ["d0", "d1", "d2", "d3", "d4"];

export function HeroSkeleton({ isNight }: { isNight: boolean }) {
  const dateLabel = new Date()
    .toLocaleDateString("cs-CZ", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    .toUpperCase();

  return (
    <div className="flex flex-col select-none">
      {/* Masthead — identical to CurrentConditions; doesn't depend on fetched data */}
      <div className="px-[26px] pt-[max(1.25rem,calc(env(safe-area-inset-top)+6px))] pb-[9px] flex justify-between items-center border-b-[1.5px] border-foreground text-foreground z-10">
        <span className="text-xs font-bold tracking-[0.18em] flex items-center gap-[7px]">
          <span className="w-[7px] h-[7px] rounded-full bg-foreground" />
          PRAHA
        </span>
        <span className="text-[11px] tracking-[0.06em] text-foreground-muted">
          {dateLabel}
        </span>
      </div>

      <div
        className="relative h-[190px] shrink-0 overflow-hidden bg-[var(--hero-sky)]"
        data-hero-night={isNight ? "true" : undefined}
      >
        <div className="absolute left-[26px] bottom-[14px] z-10 flex flex-col gap-[16px]">
          <div className="skeleton w-[150px] h-[78px] rounded-[14px]" />
          <div className="skeleton w-[110px] h-[18px] rounded-[6px]" />
        </div>
      </div>

      {/* Conditions strip — labels are static, only the values are unknown yet */}
      <div className="flex border-t-[1.5px] border-t-foreground border-b border-b-border-subtle bg-background text-foreground">
        {["SRÁŽKY", "VÍTR", "VLHKOST"].map((label, i) => (
          <div
            key={label}
            className={`flex-1 py-[11px] ${i === 0 ? "pl-[26px]" : "pl-[18px] border-l border-l-border-subtle"}`}
          >
            <div className="text-[9px] tracking-[0.13em] font-bold text-foreground-muted">
              {label}
            </div>
            <div className="skeleton w-[34px] h-[19px] rounded-[5px] mt-[5px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HourlySkeleton() {
  return (
    <div className="py-[13px] bg-background text-foreground">
      <div className="flex overflow-x-hidden px-0 gap-0">
        {HOURLY_SKELETON_KEYS.map((key) => (
          <div
            key={key}
            className="w-[64px] shrink-0 border-l border-border-subtle px-[2px] flex flex-col items-center gap-[6px]"
          >
            <div className="skeleton w-[24px] h-[11px] rounded-[3px]" />
            <div className="skeleton w-[26px] h-[26px] rounded-full" />
            <div className="skeleton w-[20px] h-[16px] rounded-[4px]" />
            <div className="skeleton w-[18px] h-[10px] rounded-[3px]" />
            <div className="skeleton w-[24px] h-[9px] rounded-[3px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DailySkeleton() {
  return (
    <div className="bg-background text-foreground pb-[52px]">
      <div className="text-[9px] tracking-[0.16em] text-foreground-muted font-bold mb-[2px] px-0 border-t border-border-subtle pt-3">
        DALŠÍ DNY
      </div>
      <div className="px-0">
        {DAILY_SKELETON_KEYS.map((key, i) => (
          <div
            key={key}
            className={`flex items-center py-[6px] ${i === 0 ? "" : "border-t border-border-subtle"}`}
          >
            <span className="skeleton w-[30px] h-[13px] rounded-[3px] shrink-0" />
            <span className="skeleton w-[26px] h-[26px] rounded-full ml-[10px]" />
            <span className="skeleton w-[28px] h-[11px] rounded-[3px] ml-[16px]" />
            <span className="flex-1" />
            <span className="skeleton w-[40px] h-[11px] rounded-[3px] mr-3" />
            <span className="skeleton w-[54px] h-[3px] rounded-[2px] mr-[12px]" />
            <span className="skeleton w-[16px] h-[13px] rounded-[3px]" />
            <span className="skeleton w-[16px] h-[13px] rounded-[3px] ml-[4px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
