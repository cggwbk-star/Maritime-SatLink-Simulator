export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LookAngle {
  azimuth: number; // True North Azimuth (0-360)
  elevation: number; // Degrees above horizon (-90 to 90)
  range: number; // Distance in km
  relativeAzimuth: number; // Relative to Ship Bow (0-360)
}

export enum SignalStatus {
  OPTIMAL = 'OPTIMAL',
  MARGINAL = 'MARGINAL', // Low elevation
  BLOCKED = 'BLOCKED',   // Obstructed by ship structure
  NO_LOS = 'NO_LOS'      // Below horizon
}

export interface BlockageZone {
  id: string;
  startRelAz: number; // Relative azimuth start
  endRelAz: number;   // Relative azimuth end
  maxElevation: number; // Height of obstacle in degrees
  name: string;
}

// Predefined blockage zones for a typical vessel (e.g., Mast, Funnel)
export const DEFAULT_BLOCKAGE_ZONES: BlockageZone[] = [
  { id: '1', startRelAz: 170, endRelAz: 190, maxElevation: 80, name: 'Main Funnel' }, // Behind
  { id: '2', startRelAz: 85, endRelAz: 95, maxElevation: 20, name: 'Crane Stbd' }, // Side
  { id: '3', startRelAz: 265, endRelAz: 275, maxElevation: 20, name: 'Crane Port' }, // Side
];