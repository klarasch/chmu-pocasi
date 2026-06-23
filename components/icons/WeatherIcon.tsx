import type { Condition } from "@/lib/weather-codes";

const SUN_YELLOW = "#FACC15";
const MOON_SILVER = "#CBD5E1";

// A single fluffy cloud, scaled up so it carries the same visual weight as
// the sun/moon glyphs instead of reading as a thin sliver underneath them.
const CLOUD = (
  <g fill="currentColor" stroke="none">
    <circle cx="7.8" cy="15.6" r="4" />
    <circle cx="13" cy="12.9" r="5.4" />
    <circle cx="18.1" cy="15.8" r="3.5" />
    <rect x="5.2" y="15.7" width="15.6" height="4.6" rx="2.3" />
  </g>
);

// A second, lower-opacity puff peeking out behind the main cloud — used for
// "cloudy" so a fully overcast sky reads denser than a single passing cloud.
const CLOUD_BACK = (
  <g fill="currentColor" stroke="none" opacity={0.45}>
    <circle cx="15.5" cy="8.4" r="3.4" />
    <rect x="12.6" y="8.5" width="7.6" height="3.4" rx="1.7" />
  </g>
);

const SUN_RAYS = (
  <path
    d="M12 1.6v2.6M12 19.8v2.6M3.8 3.8l1.85 1.85M18.35 18.35l1.85 1.85M1.6 12h2.6M19.8 12h2.6M3.8 20.2l1.85-1.85M18.35 5.65l1.85-1.85"
    stroke={SUN_YELLOW}
    strokeWidth="1.7"
    strokeLinecap="round"
  />
);

const SUN_FULL = (
  <>
    {SUN_RAYS}
    <circle cx="12" cy="12" r="4.6" fill={SUN_YELLOW} stroke="none" />
  </>
);

// Single-path crescent: one outer arc plus one inner arc sharing both
// endpoints, so the two arcs bound a single crescent region instead of
// describing two overlapping circles.
const MOON_FULL = (
  <path
    d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
    fill={MOON_SILVER}
    stroke="none"
  />
);

const MOON_STARS = (
  <g fill={MOON_SILVER} stroke="none">
    <path d="M5.2 5.6a3 3 0 0 0 2.1 2.1 3 3 0 0 0-2.1 2.1 3 3 0 0 0-2.1-2.1 3 3 0 0 0 2.1-2.1Z" />
  </g>
);

// Sun peeking from behind the cloud: only the upper rays are drawn (the
// lower half is occluded by the cloud anyway), and the disc sits high and
// slightly left so the cloud reads as passing in front of it, not beside it.
const SUN_PEEK_RAYS = (
  <path
    d="M8 3v-2M10.83 4.17l1.55-1.55M5.17 4.17 3.62 2.62M12 7h2.2M4 7H1.8"
    stroke={SUN_YELLOW}
    strokeWidth="1.6"
    strokeLinecap="round"
  />
);

const SUN_PEEK = (
  <>
    {SUN_PEEK_RAYS}
    <circle cx="8" cy="7" r="4" fill={SUN_YELLOW} stroke="none" />
  </>
);

// Same crescent shape as MOON_FULL, scaled and shifted to sit in the same
// top-left corner SUN_PEEK occupies.
const MOON_PEEK = (
  <g transform="translate(1.7,1.3) scale(0.46)">
    <path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
      fill={MOON_SILVER}
      stroke="none"
    />
  </g>
);

const RAIN_DROPS = (
  <path
    d="M9 20.5 8 23M13 20.5l-1 2.5M17 20.5l-1 2.5"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
  />
);

const BOLT = (
  <path
    d="M13.2 14.5 9.5 19.5h3l-1.5 4 4.5-5.5h-3l1.2-3.5Z"
    fill="currentColor"
    stroke="none"
  />
);

function pathsFor(condition: Condition, isNight: boolean): React.ReactNode {
  switch (condition) {
    case "clear":
      return isNight ? (
        <>
          {MOON_STARS}
          {MOON_FULL}
        </>
      ) : (
        SUN_FULL
      );
    case "partly-cloudy":
      return (
        <>
          {isNight ? MOON_PEEK : SUN_PEEK}
          {CLOUD}
        </>
      );
    case "cloudy":
      return (
        <>
          {CLOUD_BACK}
          {CLOUD}
        </>
      );
    case "rain":
      return (
        <>
          {CLOUD_BACK}
          {CLOUD}
          {RAIN_DROPS}
        </>
      );
    case "storm":
      return (
        <>
          {CLOUD_BACK}
          {CLOUD}
          {BOLT}
        </>
      );
  }
}

export function WeatherIcon({
  condition,
  isNight = false,
  size = 22,
  className,
}: {
  condition: Condition;
  isNight?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: purely decorative, condition is conveyed by adjacent text
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      {pathsFor(condition, isNight)}
    </svg>
  );
}
