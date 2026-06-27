# Internal Changelog

- Redesigned the user interface to match the Swiss editorial "Flat poster" prototype using CSS-based Bauhaus icons, static hourly grids, and a liquid glass pill.
- Updated Radar layout with OpenFreeMap Positron light style, paper timelines, and a CSS-animated radar sweep loading placeholder.
- Enabled native iOS/macOS Safari overscroll scroll bounce via `overscroll-behavior-y: auto`.
- Made background gradient animate dynamically with `animate-ambient-gradient` and custom keyframes.
- Enhanced card fade-up animations with larger translateY, scale, and a premium ease-out bezier curve.
- Added staggered animation delays to forecast cards for a progressive loading experience.
- Implemented client-side weather state manager to sync forecast weather condition to tab bar icon.
- Updated NavTabs to subscribe to weather state, caching in sessionStorage and fetching fallback.
- Fixed React hook calling order warning in RadarTimeline.tsx.
- Cleaned up biome formatting warnings in CSS (removed !important tags).
- Refined app icon to liquid design: small sun, subtle organic isolines, iOS 18-style skeuomorphic blue gradient. Regenerated all PWA/favicon assets.
- Replaced the favicon (`app/favicon.ico`) and other app icons (`public/icons/`) with the user's customized liquid design asset.
- Wrapped sessionStorage calls in try-catch to prevent crash on private browsing iOS Safari.
- Rendered each SVG isoline path in its own absolute SVG container, animated via `@utility animate-wave-line` with positive opacity (scaled 2.8x) and independent phase delay offsets for a dynamic liquid wave flow.
- Fixed 7-day outlook day skipping bug by forcing UTC-to-local date comparison in the `Europe/Prague` timezone.
- Removed theme-color meta tags, manifest theme_color, fixed shims, and body background-attachment: fixed to restore translucent Safari address and status bars.
- Suppressed legacy package `DEP0005` warning (`Buffer()`) in `instrumentation.ts` by intercepting `process.emitWarning`.
