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
- Built a hero weather graphic in `CurrentConditions.tsx` featuring `460x460px` crop-out circles with staggered floating animations, a prominent degree indicator (`116pt`), and ambient weather elements (rain, snow, lightning, fog), ensuring the text is always legible using the dark ink color.
- Added dynamic server/client integration by passing wind degrees (compass conversion for Sever, Jih, etc.) and estimating relative humidity from cloud cover and precipitation.
- Configured the hourly row as a horizontally scrolling 24-hour strip with zero-gap borders, integrated with wind speed indicators in m/s.
- Redesigned the daily forecast index (renamed to "Další dny") with horizontal range bar indicators, integrated wind speed columns in m/s, and removed extra padding so it aligns with the screen margin.
- Recreated the bottom floating navigation tab pill as a liquid glass control with custom CSS-based Forecast and Radar icons, positioned higher to avoid safe area overlaps.
- Implemented a CSS-animated radar sweep screen as the loading placeholder for the Radar page.
- Removed obsolete ambient gradient backgrounds and color syncing files (`lib/condition-gradients.ts` and `components/forecast/AmbientBackground.tsx`).
- Removed the mock status bar from current conditions, resolved PWA notch/status bar spacing by adding safe area top padding to the masthead, and made the hero container taller for better visual balance.
- Flattened the UI layout by aligning all forecast sections (Dnes text description, hourly scroll strip, daily lists, and outlook) to the same screen margin of the alert, reordered the written description before the hourly strip under one combined "Dnes" section, removed the separate "Hodinová" header, updated the alert banner to have no background, a severity-colored top border, a bottom border, and no side borders, and standardized typographic body styles.
