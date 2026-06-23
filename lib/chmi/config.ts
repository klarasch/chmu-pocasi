export const CHMI_BASE = "https://opendata.chmi.cz/meteorology/weather";

/**
 * Corner lat/lon of the radar composite PNGs, read once from the `/where` group
 * of a maxz/hdf5 ODIM_H5 file (no .pgw worldfile is published). The PNG is the
 * `gmaps` product, already projected to web-mercator, so these corners are a
 * proper lat/lon rectangle (top/bottom edges are iso-latitude in this projection).
 */
export const RADAR_BBOX = {
  west: 11.266869,
  east: 19.623974,
  south: 48.047275,
  north: 51.458369,
};

export const DEFAULT_LOCATION = { lat: 50.0755, lon: 14.4378 }; // Praha
