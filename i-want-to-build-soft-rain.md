# ČHMÚ Weather App — POC Plan ("soft-rain")

## Context

We want an alternative weather app for Czechia built on the official **ČHMÚ open data**
(https://opendata.chmi.cz/). The differentiators vs. Apple Weather:

1. **First-party national source** — data straight from the Czech Hydrometeorological Institute.
2. **Radar is one tap from app-open**, not buried mid-scroll in the IA like Apple Weather.

The POC is a **responsive, installable PWA** (Next.js) covering: **daily + hourly forecast**,
a **7-day outlook**, and the **radar**. The north star is a native Apple app later, so we keep
data fetching behind a clean API the native client can reuse.

### What the open data actually offers (verified)

Root: `air_quality/`, `hydrology/`, `meteorology/`. We use `meteorology/weather/`:

| Need | Source | Format / cadence | Notes |
|------|--------|------------------|-------|
| Numeric hourly/daily forecast | `nwp_aladin/CZ_1km/{00,06,12,18}/` | GRIB2, per-parameter, `.grb.bz2`, 4 runs/day | `ALADCZ1K4opendata_<YYYYMMDDHH>_<PARAM>.grb.bz2` (e.g. `_CLSTEMPERATURE`, `_SURFPREC_TOTAL`, `_CLSWIND_SPEED`). **Short-range (~72h).** |
| 7-day "weekly" tail (days ~4–7) | `forecast/now/` medium-range text (`predpovedi.meteo.strednedoba.*`) | JSON GeoJSON, human-written | Fills the gap past ALADIN's horizon. |
| "ČHMÚ says" narrative + day summary | `forecast/now/web_pCR0tx_*.json` (national) + regional | JSON GeoJSON text blocks | textWeather / textWind / temp ranges in prose. |
| Warnings banner | `meteorology/weather/alerts/` | CAP-style | Optional in POC, cheap to add. |
| Radar (past) | `radar/composite/maxz/png/` | PNG, every 5 min, ~288/day, ~2.5-day retention | `pacz2gmaps3.z_max3d.<YYYYMMDD>.<HHMM>.0.png`, **pre-projected to web-mercator** (the `gmaps` product) → aligns to OSM/MapLibre tiles. |
| Radar (nowcast/future) | `radar/composite/fct_maxz/png/` | PNG forecast frames | Powers "rain reaching you in N min". |
| Radar geo metadata | `radar/composite/maxz/hdf5/*.hdf` `/where` attrs | HDF5 | Read corner lat/lon **once**, hardcode bbox in config (no `.pgw` worldfile exists). |

### Two hard constraints discovered

- **No CORS** on opendata.chmi.cz (confirmed — no `Access-Control-Allow-Origin`). A browser
  cannot fetch it directly → **a backend proxy is mandatory**, not optional.
- **GRIB2 + bz2** decoding is server-side work. ALADIN is per-parameter gridded GRIB; extracting
  a point time-series requires decompress → parse → bilinear-interpolate at lat/lon.

Chosen approach (from user): **faithful ALADIN numeric**, **Next.js PWA in `/chmu-pocasi`**,
**radar as a top-level destination**.

---

## Architecture

```
chmu-pocasi/                      (new Next.js 15 app, React 19, Tailwind 4 — mirror kalkulacka stack)
  app/
    (forecast)/page.tsx           Tab 1: forecast (default route, "/")
    radar/page.tsx                Tab 2: radar (one tap away)
    api/
      forecast/route.ts           ?lat&lon -> {current, hourly[], daily[]} numeric (ALADIN + medium-range tail)
      radar/frames/route.ts       -> ordered list of past+nowcast frame URLs + timestamps
      radar/tile/[...].ts         proxy+cache individual radar PNGs (solves CORS, adds caching)
      text-forecast/route.ts      national/regional ČHMÚ prose + alerts
  lib/
    chmi/aladin.ts                run discovery, fetch .grb.bz2, bunzip, GRIB2 parse, point interpolation
    chmi/radar.ts                 frame enumeration (5-min grid), nowcast pairing, bbox config
    chmi/text.ts                  GeoJSON text-forecast parsing
    weather-codes.ts              map ALADIN params -> condition icon/label
  components/
    forecast/CurrentConditions.tsx
    forecast/HourlyStrip.tsx      horizontal scroll, temp curve
    forecast/DailyList.tsx        7-day rows (hi/lo, icon, precip%)
    radar/RadarMap.tsx            MapLibre GL + animated PNG image-source overlay
    radar/RadarTimeline.tsx       scrubber + play/pause, spans past -> nowcast
    radar/RadarLegend.tsx         dBZ/precip intensity legend
    NavTabs.tsx                   bottom tab bar (Forecast | Radar)
  next.config / manifest.webmanifest / service worker (PWA)
```

### Backend: ALADIN point forecast (`lib/chmi/aladin.ts`) — the hard part

1. **Run discovery**: pick latest available run folder (`00/06/12/18`); fall back to previous run
   if files for the newest are incomplete.
2. **Fetch** the per-parameter `.grb.bz2` files we need: temperature (`CLSTEMPERATURE`),
   total precip (`SURFPREC_TOTAL`), wind speed/dir/gust, total cloud cover. (Confirm exact param
   names against the live `00/` listing + `Popis_obsahu.xlsx` during build.)
3. **Decompress** bz2 in Node (`seek-bzip` / `unbzip2-stream`).
4. **Parse GRIB2 + interpolate at (lat,lon)**. Recommended: shell out to **`eccodes`**
   (`grib_get_data` / `grib_ls`) or **`wgrib2`** via `child_process` — robust, battle-tested —
   with a pure-JS parser (`grib2class`) as fallback if we can't add a system binary on the host.
   Document the system dependency in the README and choose the hosting target accordingly
   (a Node server / container, not pure edge functions).
5. **Assemble** `{current, hourly[ ~72h ], daily[]}`; derive daily hi/lo + precip from the hourly
   series; map params → condition code in `weather-codes.ts`.
6. **Weekly tail**: append days ~4–7 from the medium-range **text** product (qualitative card,
   visually distinct from the numeric days). State the horizon honestly in the UI.
7. **Cache** aggressively — ALADIN refreshes 4×/day, so cache a run for hours (in-memory + on-disk
   or KV); never re-process per request.

### Backend: radar (`lib/chmi/radar.ts` + `api/radar/*`)

- Enumerate frames on the 5-min UTC grid for the last ~2h of `maxz/png/` + the `fct_maxz/png/`
  nowcast frames; return URLs (proxied via `api/radar/tile`) + timestamps + an "is forecast" flag.
- `api/radar/tile` proxies PNGs (fixes CORS) and sets cache headers.
- **bbox**: read corner lat/lon once from a `maxz/hdf5` file's `/where` group, hardcode in
  `radar.ts` config. The `gmaps` PNG is already web-mercator so it drops onto MapLibre directly.

### Frontend

- **Forecast tab (default `/`)**: Apple-Weather layout — big current temp/condition, horizontal
  **hourly strip** with temperature curve + precip, **7-day list**. Optional ČHMÚ alert banner on top.
- **Radar tab (`/radar`)**: full-bleed **MapLibre GL** map, animated radar overlay via image-source
  whose URL swaps per frame, **timeline scrubber with play/pause** spanning past → nowcast, an
  always-visible **intensity legend**, and **the user's location pinned** (Geolocation API) centered
  on them. This is the headline feature — reachable in one tap from app open via the bottom `NavTabs`.
- **PWA**: `manifest.webmanifest` + service worker so it installs to the home screen and bookmarks
  cleanly; this is the bridge toward the native app.
- Default location: device geolocation, fallback Praha; allow a simple city search later (out of POC).

### Stack alignment

Mirror the kalkulacka monorepo conventions where sensible (Next.js 15, React 19, Tailwind 4, Biome,
Vitest, TypeScript strict). `/chmu-pocasi` is currently an **empty, non-git folder** — scaffold a
standalone app there (not inside the kalkulacka repo).

---

## Build order

1. Scaffold Next.js PWA in `/chmu-pocasi` (Tailwind, Biome, TS strict, manifest + SW, bottom tabs).
2. **Radar first** (highest value, lowest risk): `api/radar/frames` + `api/radar/tile`, hardcode bbox
   from one HDF5 read, build `RadarMap` + `RadarTimeline` + `RadarLegend` + location pin + nowcast.
3. **Text forecast + alerts** (`api/text-forecast`) — quick win, gives real content while ALADIN lands.
4. **ALADIN numeric** (`api/forecast`): run discovery → bz2 → GRIB2 point extraction → hourly/daily,
   wire `CurrentConditions` / `HourlyStrip` / `DailyList`; append medium-range weekly tail.
5. Caching, error/empty states, polish.

---

## Verification

- **Open data assumptions**: before coding each integration, `curl` the live directory listings
  (`nwp_aladin/CZ_1km/<latest-run>/`, `radar/composite/maxz/png/`, `fct_maxz/png/`) to confirm current
  filenames/params (listings drift; retention is short).
- **GRIB extraction**: unit-test `aladin.ts` against one downloaded `.grb.bz2` — assert a Praha-point
  temperature series is monotone-plausible and matches `grib_ls` spot values.
- **Radar georef**: visually confirm the PNG overlay aligns with coastlines/borders on MapLibre at a
  known feature (e.g. Praha, Czech border); verify timeline ordering past→now→nowcast.
- **End-to-end**: `npm run dev` in `/chmu-pocasi`; load on a phone-sized viewport; confirm forecast
  renders numeric hourly+daily and radar animates and pins location. Run the kalkulacka-style post-task
  checks (`typecheck`, `lint`, `test`) within the new app.
- **CORS**: confirm the browser never calls opendata.chmi.cz directly (all traffic via `/api/*`).

## Known risks / open items

- **GRIB2 tooling**: needs a system binary (`eccodes`/`wgrib2`) or a reliable JS parser — pick early; it
  gates hosting choice (Node container vs. edge).
- **Weekly horizon**: ALADIN CZ_1km is ~72h; days 4–7 are qualitative (text), not numeric. Surfaced honestly in UI.
- **Param-name confirmation**: exact ALADIN parameter file suffixes must be verified against the live
  listing + `Popis_obsahu.xlsx`.
- **Radar retention** (~2.5 days) and **5-min latency** mean robust "latest available frame" handling.
