import { Coordinates, LookAngle } from '../types';

const EARTH_RADIUS = 6371; // km
const GEO_ALTITUDE = 35786; // km
const GEO_RADIUS = EARTH_RADIUS + GEO_ALTITUDE;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/**
 * Calculates the look angle from a ship to a GEO satellite.
 * @param shipPos Ship's Latitude and Longitude
 * @param satLng Satellite Longitude (GEOs are at Lat 0)
 * @param shipHeading Ship's Heading (0 = North, 90 = East)
 */
export const calculateLookAngle = (
  shipPos: Coordinates,
  satLng: number,
  shipHeading: number
): LookAngle => {
  const latRad = toRad(shipPos.lat);
  const lngDiffRad = toRad(satLng - shipPos.lng);

  // 1. Calculate Elevation
  // Formula based on spherical trigonometry
  // cos(beta) = cos(lat) * cos(lngDiff)
  const cosBeta = Math.cos(latRad) * Math.cos(lngDiffRad);
  const centralAngle = Math.acos(cosBeta);
  
  // Calculate distance from ship to satellite (d) using Law of Cosines
  // d = sqrt(R^2 + r^2 - 2Rr cos(beta))
  // where R = Earth Radius, r = GEO Radius
  const d = Math.sqrt(
    Math.pow(EARTH_RADIUS, 2) + 
    Math.pow(GEO_RADIUS, 2) - 
    2 * EARTH_RADIUS * GEO_RADIUS * cosBeta
  );

  // Elevation formula:
  // cos(El) = (GEO_RADIUS * sin(beta)) / d
  // However, simpler approximation for GEO:
  // El = atan( (cos(beta) - (Re/Rs)) / sin(beta) )
  const radiusRatio = EARTH_RADIUS / GEO_RADIUS;
  const sinBeta = Math.sin(centralAngle);
  
  let elevation = 0;
  if (sinBeta === 0) {
     elevation = 90; // Directly overhead
  } else {
     elevation = toDeg(Math.atan((cosBeta - radiusRatio) / sinBeta));
  }
  
  // 2. Calculate Azimuth (True North)
  // Az = atan2( tan(lngDiff), sin(lat) ) + 180
  // Note: Standard formula usually gives azimuth from South, so we adjust for North.
  const y = Math.sin(lngDiffRad);
  const x = Math.cos(latRad) * Math.tan(latRad); // Simplified projection
  // More robust formula for azimuth to GEO:
  // tan(Az) = tan(diffLng) / sin(lat)
  
  let azimuth = toDeg(Math.atan2(Math.tan(lngDiffRad), Math.sin(latRad)));
  
  // Adjust azimuth based on hemisphere
  azimuth += 180;
  
  // Normalize to 0-360
  azimuth = (azimuth + 360) % 360;

  // 3. Relative Azimuth (Relative to Ship's Bow)
  // If Heading is 0 (North) and Sat is 180 (South), Relative is 180.
  // If Heading is 90 (East) and Sat is 180 (South), Relative is 90 (Starboard).
  let relativeAzimuth = (azimuth - shipHeading + 360) % 360;

  return {
    azimuth,
    elevation,
    range: d,
    relativeAzimuth
  };
};