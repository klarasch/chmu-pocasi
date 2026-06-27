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

### Swiss Bauhaus Graphics and Icons
- Weather conditions are represented using oversized Bauhaus geometric marks cropping out of the frame.
- The hero shape floats and drifts ambiently, casting three staggered ghost echoes behind it.
- Key weather icons (sun, moon, clouds, rain, storm, snow, fog) are custom HTML/CSS elements built from pure geometric primitives.
- Micro-animations animate raindrops, snow dots, fog bars, and lightning bolts in real-time.

### Liquid Glass Navigation Pill
- Toggling between Forecast and Radar uses a floating liquid glass control pill with transparent backing, a high-saturate blur backdrop filter, and custom CSS Forecast/Radar icons.

### Radar Loading Animation
- Loading radar data triggers an animated, conic-gradient radar sweep placeholder aligned with the paper theme.

## PWA Standalone Mode

- The application is a fully installable Progressive Web App (PWA).
- When installed to your Home Screen on iOS or Android, the app runs in full-screen standalone mode.
- The app layout uses a centered `450px` width on desktop and fills the screen on mobile.


