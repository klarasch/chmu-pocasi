# Agent Context

## Architecture
This is a Progressive Web App (PWA) built with Next.js 15, React 19, and Tailwind CSS v4.
It retrieves Czech weather forecast data directly from the official ČHMÚ open data API via server-side processing:
- **ALADIN NWP numeric hourly/daily forecast**: Parsed from GRIB2 files using `eccodes` (requires `grib_ls` on the host).
- **7-day outlook**: Qualitative forecast for days 4–7 sourced from ČHMÚ GeoJSON text.
- **Radar & Nowcast**: MapLibre GL displaying past and forecast frames overlaid on the map.

## Core Conventions
- **Server components**: Primary data fetching happens on the server side using async components.
- **Client components**: Interactive sections (like Navigation, Radar map controllers, and Pull to Refresh) are marked with `"use client"`.
- **Styling**: Vanilla CSS inside `app/globals.css` with Tailwind CSS v4 directives.
- **Zero CORS**: All external calls to ČHMÚ API are proxied via `/api/*` endpoints.

## Active Task Context
- Fixed Safari status bar and navigation toolbar solid bar issue by applying a linear-gradient background on `html`/`body` using `--weather-top` and `--weather-bg` values.
- Enabled native Safari rubber-band/overscroll bounce by setting `overscroll-behavior-y: auto` on `html`/`body` (with overscroll zones seamlessly colored by the background gradient).
- Created a branded app icon featuring the signature isoline wave pattern and sun+cloud motif on the app's blue gradient sky. Generated icons at all required sizes (192, 512, 180, 32) and wired them into the PWA manifest and Next.js metadata.
- Implemented client-side weather state manager (`lib/weather-state.ts`) to coordinate forecast weather conditions with the tab bar navigation in client space.
- Configured dynamic background animations (gradient shifting, improved isoline wave drift) and staggered fade-up card appearance animations on the forecast page.
- Suppressed Node.js `DEP0005` deprecation warnings (`Buffer()`) triggered by third-party packages (like `seek-bzip` used in GRIB2 decompression) by intercepting `process.emitWarning` in `instrumentation.ts`.

## App Icon
- Design: Liquid iOS 18-style — small glowing sun, subtle organic isoline waves, and a tiny star on a skeuomorphic blue gradient sky.
- Assets: `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/apple-touch-icon.png`, `app/favicon.ico`.
- Replaced all icon assets using the user-uploaded customized source image `media__1782243498163.png`.
- Referenced from `manifest.webmanifest` and `app/layout.tsx` metadata.


