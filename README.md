# ČHMÚ Počasí

POC weather PWA built on ČHMÚ open data (https://opendata.chmi.cz/): numeric hourly/daily
forecast (ALADIN model), a 7-day outlook, and radar with nowcast. See
[i-want-to-build-soft-rain.md](./i-want-to-build-soft-rain.md) for the original plan.

## Requirements

- **Node.js 20.9+** (`.nvmrc` pins this; Next.js 15 / React 19 need it — `nvm use`).
- **eccodes** installed on the host (`brew install eccodes` on macOS, `apt install
  libeccodes-tools` on Debian/Ubuntu). The forecast API shells out to `grib_ls` to decode
  ALADIN's GRIB2 files — a pure-JS parser (`grib2-simple`) was tried first but doesn't support
  CHMI's grid encoding. **This means the app needs a Node server/container, not an edge
  runtime.**

## Getting started

```bash
nvm use
npm install
npm run dev
```

Open http://localhost:3000.

## Architecture

- `app/(forecast)/page.tsx` — default route: current conditions, hourly strip, 7-day list,
  alert banner, ČHMÚ narrative text.
- `app/radar/page.tsx` — full-bleed MapLibre radar with past + nowcast frames, timeline
  scrubber, legend, geolocation pin.
- `app/api/forecast` — ALADIN numeric point forecast (`lib/chmi/aladin.ts`).
- `app/api/radar/frames` + `app/api/radar/tile` — radar frame listing + CORS-proxying tile
  server (`lib/chmi/radar.ts`, `lib/chmi/radar-tile.ts`).
- `app/api/text-forecast` — ČHMÚ prose forecast + CAP alerts (`lib/chmi/text.ts`,
  `lib/chmi/alerts.ts`).

All requests to `opendata.chmi.cz` happen server-side — confirmed it has no CORS headers, so a
browser can never call it directly.

## Known simplifications (POC scope)

- **Point extraction is nearest-neighbour**, not bilinear, at ALADIN's 1km grid resolution
  (eccodes `grib_ls -l lat,lon,1`). Good enough at this resolution; bilinear would need mode 4
  + manual interpolation.
- **Alerts (CAP)** are scoped to the ~25 most recently modified files in `alerts/cap/` (a
  rotating filename pool, not date-sorted) and filtered to `Moderate`+ severity with a
  non-expired `<expires>`. CHMI mixes meteorological warnings with other bulletin types (e.g.
  drought status) in the same directory; this is a best-effort filter, not a full CAP processor.
- **7-day outlook** is numeric (ALADIN) for ~3 days and qualitative (ČHMÚ prose, `pCR4tx`/
  `pCR5tx`/`pCR8tx`) beyond that — ALADIN CZ_1km's real horizon is ~72h, surfaced honestly in
  the UI rather than padded with fake numbers.
- **PWA icons** (`public/icons/icon-192.png`, `icon-512.png`) are referenced in the manifest
  but not generated — drop in real branding assets.
- Caching is in-memory per server process (run/result TTLs in `lib/chmi/*`), not shared across
  instances — fine for a single-server POC, would need Redis/KV behind a load balancer.
