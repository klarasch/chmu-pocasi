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
- Added wind speed indicators to the static hourly grid (hourly wind speed) and the 5-day daily forecast index (maximum daily wind speed calculated from GRIB2).
- Elevated the bottom tab bar floating position to prevent collision with iOS/Android home indicator bars.
- Card appearance fade-up transition modified to start from `20px` translation offset and `0.98` scale, using a smoother, premium ease curve (`cubic-bezier(0.16, 1, 0.3, 1)`) and longer duration (`0.65s`).
- Background meteorological isolines (`ambient-iso` keyframes) updated to drift on both X and Y axes and scale subtly for a more natural, atmospheric feel.
- Cleaned up custom MapLibre attribution styling to remove `!important` markers and format styling rules under Biome guidelines.
- Wrapped all `sessionStorage` operations in `try-catch` blocks to protect against runtime `SecurityError` DOMExceptions on mobile browsers when in private browsing mode or with strict privacy rules.

### Fixed
- Fixed legibility of current conditions temperature and weather labels on night, rain, and storm graphics by forcing the primary ink color `#16161a` against the light cream paper background.
- Fixed layout alignment and typography: matched "Vítr" block styling (font size and vertical alignment) to "Srážky" and "Vlhkost", and standardized body text styling for the daily outlook items and "Dnes" text description.
- Resolved hourly forecast scroll issue: converted the static 6-column grid to a horizontally scrolling 24-hour strip.
- Removed extra paddings on all forecast components (hourly, daily list, text card, and outlook list) to align perfectly with the screen margin of the alert.
- Updated alert banner styling: removed the background, added a severity-colored top border, removed side borders, kept the bottom border, and aligned padding to the screen margin.
- Displayed wind speed in `m/s` (meters per second) rather than `km/h` in current conditions, hourly strip, and daily list.
- Renamed daily index header "5DENNÍ PŘEDPOVĚĎ" to "DALŠÍ DNY".
- Combined the written text description and hourly strip into a single "Dnes" section by reordering them and removing the separate "Hodinová" title header.
- Removed mock status bar overlay with duplicate time/percentage that clashed with native phone status bars.
- Fixed cramped layout in standalone PWA mode by increasing Hero container height and padding the top masthead to clear the notch using CSS safe area inset variables.
- Removed extra card container boxes from hourly and text forecasts to let them flow flat on the warm paper background.
- Removed rounded corners from the alert banner, and eliminated unnecessary "slovní" label badges on outlook forecasts.
- Translated all English UI labels (`Forecast`, `PRECIP`, `WIND`, `HUMIDITY`, `HOURLY`, `5-DAY INDEX`, `TODAY`) to Czech.
- Fixed background isoline animations in Safari and Firefox by separating lines into multiple SVG layers and animating the SVG containers directly, bypassing browser rendering bugs related to path-level CSS transforms.
- Fixed Safari status bar and navigation toolbar opaque solid bars. Removed theme-color meta tags, manifest `theme_color`, and edge fixed shims to let Safari and iOS PWA standalone mode dynamically render fully transparent/translucent status and toolbar chrome, displaying the weather gradient seamlessly behind them. Removed `background-attachment: fixed` on `html` and `body` elements to resolve scroll-rendering glitches on iOS.
- Fixed timezone parsing bug in "7denní výhled" where text-forecast days were parsed in UTC, causing Saturday (sobota) to be erroneously filtered out and skipped because its UTC date was shifted to the previous day (Friday) and matched the end of the ALADIN numeric daily series. Force all date conversions and comparisons into the local `Europe/Prague` timezone.
- Fixed Node.js `DEP0005` deprecation warning (`Buffer()`) triggered by legacy third-party dependencies (like `seek-bzip` used in GRIB2 decoding) by intercepting `process.emitWarning` during server-side startup inside `instrumentation.ts`.

