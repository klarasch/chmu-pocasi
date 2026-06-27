# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Swiss Bauhaus Redesign**: Redesigned the entire user interface to match a warm paper (`#f4f3f0`) Swiss editorial grid and minimalist ink typography, restricting layouts to a centered `450px` width on desktop.
- **Bauhaus Weather Icons**: Replaced the SVG icons with custom CSS-based Bauhaus geometric shapes for 9 weather states (sun, moon, partly, partly-night, cloud, rain, storm, snow, fog), using CSS transform scaling.
- **Bauhaus Hero Weather Graphics**: Custom `460x460px` drifting circles with staggered echoes, animated clouds, rain, snow, lightning, and fog overlays matching the weather condition.
- **Hourly Helvetica Grid**: A clean 6-column static grid showing the next 6 hours of the forecast.
- **Estimated Humidity & Wind Compass**: Formatted Czech compass directions (S, JZ, etc.) from degrees and estimated relative humidity from cloud cover and precipitation.
- **Radar sweep placeholder animation**: Added a CSS-animated conic gradient radar sweep loader when fetching precipitation frames on the Radar page.
- **Light Radar Map Theme**: Configured MapLibre GL maps to use the OpenFreeMap `positron` style for a consistent light-paper color palette.
- Native overscroll and elastic scroll bounce enabled on iOS/macOS Safari (`overscroll-behavior-y: auto`).
- Staggered entry animation delays for forecast page cards (`.animation-delay-75`, `.animation-delay-150`, `.animation-delay-225`, `.animation-delay-300`).
- Dynamic background linear-gradient shifting animation (`.animate-ambient-gradient`).
- Separated each background contour line (isoline wave) into its own independent SVG container layer, animated dynamically with custom phase delays (`i * -1.6s`) and coprime durations (`14s + i * 2.5s`) using `.animate-wave-line` and `@utility animate-wave-line`. This creates an organic, liquid wave-bending effect across the viewport. Increased line stroke opacity by `2.8x` to make the waves clearly visible.
- Client-side weather state module (`lib/weather-state.ts`) to coordinate forecast data with other client components.
- Dynamic weather condition and day/night state sync in `ThemeColorSync.tsx` and cross-page session caching.
- Dynamic tab bar icon on "Předpověď" tab that matches the actual current weather condition and is night/day state.
- **App Icon**: Liquid iOS 18-style minimalistic branded icon featuring a glowing yellow sun in the center, subtle organic isoline waves, and a tiny star on a skeuomorphic blue gradient sky.
  - PWA icons: 192×192 and 512×512 (`public/icons/icon-192.png`, `public/icons/icon-512.png`)
  - Apple touch icon: 180×180 (`public/icons/apple-touch-icon.png`)
  - Favicon: 32×32 (`app/favicon.ico`)
  - Updated PWA assets and manifest configurations to support the new style.


### Changed
- Card appearance fade-up transition modified to start from `20px` translation offset and `0.98` scale, using a smoother, premium ease curve (`cubic-bezier(0.16, 1, 0.3, 1)`) and longer duration (`0.65s`).
- Background meteorological isolines (`ambient-iso` keyframes) updated to drift on both X and Y axes and scale subtly for a more natural, atmospheric feel.
- Cleaned up custom MapLibre attribution styling to remove `!important` markers and format styling rules under Biome guidelines.
- Wrapped all `sessionStorage` operations in `try-catch` blocks to protect against runtime `SecurityError` DOMExceptions on mobile browsers when in private browsing mode or with strict privacy rules.

### Fixed
- Fixed background isoline animations in Safari and Firefox by separating lines into multiple SVG layers and animating the SVG containers directly, bypassing browser rendering bugs related to path-level CSS transforms.
- Fixed Safari status bar and navigation toolbar opaque solid bars. Removed theme-color meta tags, manifest `theme_color`, and edge fixed shims to let Safari and iOS PWA standalone mode dynamically render fully transparent/translucent status and toolbar chrome, displaying the weather gradient seamlessly behind them. Removed `background-attachment: fixed` on `html` and `body` elements to resolve scroll-rendering glitches on iOS.
- Fixed timezone parsing bug in "7denní výhled" where text-forecast days were parsed in UTC, causing Saturday (sobota) to be erroneously filtered out and skipped because its UTC date was shifted to the previous day (Friday) and matched the end of the ALADIN numeric daily series. Force all date conversions and comparisons into the local `Europe/Prague` timezone.
- Fixed Node.js `DEP0005` deprecation warning (`Buffer()`) triggered by legacy third-party dependencies (like `seek-bzip` used in GRIB2 decoding) by intercepting `process.emitWarning` during server-side startup inside `instrumentation.ts`.

