"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

type Bbox = { west: number; east: number; south: number; north: number };

const IMAGE_SOURCE_ID = "radar-overlay";
const IMAGE_LAYER_ID = "radar-overlay-layer";
const LOCATION_SOURCE_ID = "user-location";

export function RadarMap({
  bbox,
  tileUrl,
  location,
}: {
  bbox: Bbox;
  tileUrl: string | null;
  location: { lat: number; lon: number } | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: map is created once; tileUrl is applied by the effect below via updateImage
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: [(bbox.west + bbox.east) / 2, (bbox.south + bbox.north) / 2],
      zoom: 6,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "top-left",
    );

    map.on("load", () => {
      map.addSource(IMAGE_SOURCE_ID, {
        type: "image",
        url: tileUrl ?? "",
        coordinates: [
          [bbox.west, bbox.north],
          [bbox.east, bbox.north],
          [bbox.east, bbox.south],
          [bbox.west, bbox.south],
        ],
      });
      map.addLayer({
        id: IMAGE_LAYER_ID,
        type: "raster",
        source: IMAGE_SOURCE_ID,
        paint: { "raster-opacity": 0.75 },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [bbox]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tileUrl) return;
    const source = map.getSource(IMAGE_SOURCE_ID) as
      | maplibregl.ImageSource
      | undefined;
    source?.updateImage({ url: tileUrl });
  }, [tileUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !location) return;

    const applyMarker = () => {
      const feature: GeoJSON.Feature = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [location.lon, location.lat] },
        properties: {},
      };

      if (map.getSource(LOCATION_SOURCE_ID)) {
        (map.getSource(LOCATION_SOURCE_ID) as maplibregl.GeoJSONSource).setData(
          feature,
        );
        return;
      }
      map.addSource(LOCATION_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [location.lon, location.lat],
          },
          properties: {},
        },
      });
      map.addLayer({
        id: "user-location-dot",
        type: "circle",
        source: LOCATION_SOURCE_ID,
        paint: {
          "circle-radius": 6,
          "circle-color": "#3fa9f5",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });
      map.flyTo({ center: [location.lon, location.lat], zoom: 8 });
    };

    if (map.isStyleLoaded()) applyMarker();
    else map.once("load", applyMarker);
  }, [location]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ position: "absolute", inset: 0 }}
    />
  );
}
