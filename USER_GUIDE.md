# User Guide - ČHMÚ Počasí

This guide explains how to use and navigate the ČHMÚ Počasí weather application.

## Layout and Navigation

The app is structured as a standalone progressive web application with a floating navigation bar at the bottom:
1. **Předpověď (Forecast)**: The default tab, showing current conditions, hourly predictions, ČHMÚ narrative outlook, and a 7-day forecast.
2. **Radar**: A full-bleed map displaying the latest meteorological radar frames (past recordings and nowcasts) centered on your location.

## Gestures & Controls

### Scroll Bounce
- The page includes native overscroll rubber-band bounce when scrolling to the top or bottom of the forecast page.
- Scrolling down past the bottom of the page or bouncing up from the top feels fluid and matches the native system behavior of iOS and macOS.

### Pull to Refresh
- To refresh the weather forecast, swipe down from the absolute top of the page.
- An animated weather cloud will appear showing that the forecast is updating. Once updated, the page transitions smoothly.
- The pull-to-refresh gesture does not fight with the scroll bounce.

### Radar Timeline (on Radar page)
- Use the scrubber bar at the bottom of the Radar screen to drag between past radar captures (Záznam) and nowcasts (Předpověď).
- Tap the play/pause button to animate the radar over time.
- Tap **Nyní** (Now) to quickly return to the current hour's frame.

## Dynamic Features

### Tab Bar Weather Sync
- The icon next to the "Předpověď" tab bar item dynamically updates to represent the current weather condition at your location (e.g. Sunny, Partly Cloudy, Cloudy, Rain, Storm).
- The icon also adapts to day or night (showing a moon instead of a sun during night hours).

### Motion and Transitions
- The background color gradient of the app is subtly animated, mimicking changes in light and atmosphere.
- Meteorological isolines (isobars) drift across the screen, reflecting wind currents.
- Cards on the forecast page load with a staggered, smooth, and modern fade-up animation.

## PWA Standalone Mode

- The application is a fully installable Progressive Web App (PWA).
- When installed to your Home Screen on iOS or Android, the app runs in full-screen standalone mode.
- The status bar and navigation toolbar are fully translucent, showing the weather background gradient extending all the way behind them.
- **Important (iOS cache)**: iOS heavily caches PWA manifest settings. If you still see solid color bars in standalone mode after this update, delete the PWA from your Home Screen and add it again to apply the new transparent status bar configuration.

