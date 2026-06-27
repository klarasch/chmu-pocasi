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
- Redesigned the entire application frontend to match the Swiss editorial, Bauhaus-inspired "Flat poster" design language (warm paper `#f4f3f0` background, ink `#16161a` text, and Swiss typography).
- Switched the MapLibre GL radar map to OpenFreeMap's light `positron` style, keeping the entire application visual palette unified.
- Recreated `WeatherIcon` to draw CSS-based Bauhaus geometric shapes (sun, moon, partly, partly-night, cloud, rain, storm, snow, fog) and scaled them dynamically using CSS transforms.
- Built a hero weather graphic in `CurrentConditions.tsx` featuring `460x460px` crop-out circles with staggered floating animations, a prominent degree indicator (`116pt`), and ambient weather elements (rain, snow, lightning, fog).
- Added dynamic server/client integration by passing wind degrees (compass conversion for Sever, Jih, etc.) and estimating relative humidity from cloud cover and precipitation.
- Replaced the horizontal scrolling hourly row with a static 6-column Helvetica grid.
- Redesigned the 5-day daily forecast index with horizontal range bar indicators and customized alignment offsets.
- Recreated the bottom floating navigation tab pill as a liquid glass control with custom CSS-based Forecast and Radar icons.
- Implemented a CSS-animated radar sweep screen as the loading placeholder for the Radar page.
- Removed obsolete ambient gradient backgrounds and color syncing files (`lib/condition-gradients.ts` and `components/forecast/AmbientBackground.tsx`).



