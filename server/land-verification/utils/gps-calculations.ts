/**
 * GPS and Surveying Calculation Utilities
 * Provides accurate geospatial calculations for land verification
 */

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface UTMCoordinate {
  easting: number;
  northing: number;
  zone: number;
  hemisphere: 'N' | 'S';
}

export interface BearingDistance {
  bearing: number; // degrees from north
  distance: number; // meters
}

/**
 * Earth's radius in meters (WGS84)
 */
const EARTH_RADIUS = 6378137;

/**
 * Calculates the distance between two GPS coordinates using the Haversine formula
 * Accurate for distances up to a few hundred kilometers
 */
export function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
}

/**
 * Calculates the bearing from one coordinate to another
 * Returns bearing in degrees (0-360) from north
 */
export function calculateBearing(from: Coordinate, to: Coordinate): number {
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Calculates a destination coordinate given a starting point, bearing, and distance
 */
export function calculateDestination(start: Coordinate, bearing: number, distance: number): Coordinate {
  const bearingRad = toRadians(bearing);
  const lat1 = toRadians(start.lat);
  const lng1 = toRadians(start.lng);
  
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distance / EARTH_RADIUS) +
    Math.cos(lat1) * Math.sin(distance / EARTH_RADIUS) * Math.cos(bearingRad)
  );
  
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearingRad) * Math.sin(distance / EARTH_RADIUS) * Math.cos(lat1),
    Math.cos(distance / EARTH_RADIUS) - Math.sin(lat1) * Math.sin(lat2)
  );

  return {
    lat: toDegrees(lat2),
    lng: toDegrees(lng2)
  };
}

/**
 * Calculates the area of a polygon defined by GPS coordinates
 * Uses the spherical excess method for accuracy over large areas
 */
export function calculatePolygonArea(coordinates: Coordinate[]): number {
  if (coordinates.length < 3) return 0;

  // Close the polygon if not already closed
  const coords = [...coordinates];
  if (coords[0].lat !== coords[coords.length - 1].lat || 
      coords[0].lng !== coords[coords.length - 1].lng) {
    coords.push(coords[0]);
  }

  let area = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    area += toRadians(p2.lng - p1.lng) * (2 + Math.sin(toRadians(p1.lat)) + Math.sin(toRadians(p2.lat)));
  }

  area = Math.abs(area * EARTH_RADIUS * EARTH_RADIUS / 2);
  return area;
}

/**
 * Determines if a point is inside a polygon using the ray casting algorithm
 */
export function isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Finds the closest point on a polygon boundary to a given point
 */
export function findClosestPointOnBoundary(point: Coordinate, polygon: Coordinate[]): {
  closestPoint: Coordinate;
  distance: number;
  segmentIndex: number;
} {
  let minDistance = Infinity;
  let closestPoint = polygon[0];
  let segmentIndex = 0;

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const segmentStart = polygon[i];
    const segmentEnd = polygon[j];
    
    const closestOnSegment = findClosestPointOnSegment(point, segmentStart, segmentEnd);
    const distance = calculateDistance(point, closestOnSegment);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = closestOnSegment;
      segmentIndex = i;
    }
  }

  return { closestPoint, distance: minDistance, segmentIndex };
}

/**
 * Finds the closest point on a line segment to a given point
 */
export function findClosestPointOnSegment(point: Coordinate, segmentStart: Coordinate, segmentEnd: Coordinate): Coordinate {
  const A = point.lng - segmentStart.lng;
  const B = point.lat - segmentStart.lat;
  const C = segmentEnd.lng - segmentStart.lng;
  const D = segmentEnd.lat - segmentStart.lat;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) return segmentStart; // Segment is a point
  
  let param = dot / lenSq;
  param = Math.max(0, Math.min(1, param)); // Clamp to segment

  return {
    lng: segmentStart.lng + param * C,
    lat: segmentStart.lat + param * D
  };
}

/**
 * Converts GPS coordinates to UTM coordinates
 * Useful for more accurate distance calculations in local areas
 */
export function gpsToUTM(coord: Coordinate): UTMCoordinate {
  const zone = Math.floor((coord.lng + 180) / 6) + 1;
  const hemisphere = coord.lat >= 0 ? 'N' : 'S';
  
  // Simplified UTM conversion (for more accuracy, use a proper projection library)
  const lat = toRadians(coord.lat);
  const lng = toRadians(coord.lng);
  const centralMeridian = toRadians((zone - 1) * 6 - 180 + 3);
  
  const eSq = 0.00669438; // WGS84 eccentricity squared
  const e2Sq = eSq / (1 - eSq);
  const n = EARTH_RADIUS / Math.sqrt(1 - eSq * Math.sin(lat) * Math.sin(lat));
  const t = Math.tan(lat) * Math.tan(lat);
  const c = e2Sq * Math.cos(lat) * Math.cos(lat);
  const a = Math.cos(lat) * (lng - centralMeridian);
  
  const m = EARTH_RADIUS * (
    (1 - eSq / 4 - 3 * eSq * eSq / 64 - 5 * eSq * eSq * eSq / 256) * lat -
    (3 * eSq / 8 + 3 * eSq * eSq / 32 + 45 * eSq * eSq * eSq / 1024) * Math.sin(2 * lat) +
    (15 * eSq * eSq / 256 + 45 * eSq * eSq * eSq / 1024) * Math.sin(4 * lat) -
    (35 * eSq * eSq * eSq / 3072) * Math.sin(6 * lat)
  );
  
  const easting = 0.9996 * n * (
    a + (1 - t + c) * a * a * a / 6 +
    (5 - 18 * t + t * t + 72 * c - 58 * e2Sq) * a * a * a * a * a / 120
  ) + 500000;
  
  let northing = 0.9996 * (
    m + n * Math.tan(lat) * (
      a * a / 2 + (5 - t + 9 * c + 4 * c * c) * a * a * a * a / 24 +
      (61 - 58 * t + t * t + 600 * c - 330 * e2Sq) * a * a * a * a * a * a / 720
    )
  );
  
  if (hemisphere === 'S') {
    northing += 10000000;
  }
  
  return { easting, northing, zone, hemisphere };
}

/**
 * Calculates the accuracy dilution of precision (DOP) for GPS measurements
 * Lower values indicate better accuracy
 */
export function calculateDOP(satellites: Array<{ elevation: number; azimuth: number }>): {
  hdop: number; // Horizontal DOP
  vdop: number; // Vertical DOP
  pdop: number; // Position DOP
} {
  if (satellites.length < 4) {
    return { hdop: 99.99, vdop: 99.99, pdop: 99.99 };
  }

  // Simplified DOP calculation
  // In practice, this would use the full satellite geometry matrix
  const avgElevation = satellites.reduce((sum, sat) => sum + sat.elevation, 0) / satellites.length;
  const elevationSpread = Math.max(...satellites.map(s => s.elevation)) - Math.min(...satellites.map(s => s.elevation));
  
  const hdop = Math.max(1, 10 - avgElevation / 10 - elevationSpread / 20);
  const vdop = hdop * 1.5; // Vertical is typically worse than horizontal
  const pdop = Math.sqrt(hdop * hdop + vdop * vdop);
  
  return { hdop, vdop, pdop };
}

/**
 * Validates GPS coordinate accuracy based on various factors
 */
export function validateGPSAccuracy(coord: Coordinate & { 
  accuracy?: number;
  timestamp?: Date;
  satellites?: number;
  hdop?: number;
}): {
  isValid: boolean;
  confidence: number;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let confidence = 100;

  // Check coordinate bounds (Kenya approximately)
  if (coord.lat < -5 || coord.lat > 5 || coord.lng < 33 || coord.lng > 42) {
    issues.push('Coordinates outside expected Kenya bounds');
    confidence -= 30;
  }

  // Check accuracy
  if (coord.accuracy && coord.accuracy > 10) {
    issues.push(`GPS accuracy of ${coord.accuracy.toFixed(1)}m exceeds recommended threshold`);
    confidence -= Math.min(40, coord.accuracy * 2);
    recommendations.push('Use differential GPS or RTK for improved accuracy');
  }

  // Check timestamp
  if (coord.timestamp) {
    const age = Date.now() - coord.timestamp.getTime();
    if (age > 24 * 60 * 60 * 1000) {
      issues.push('GPS reading is more than 24 hours old');
      confidence -= 20;
      recommendations.push('Take fresh GPS measurements');
    }
  }

  // Check satellite count
  if (coord.satellites && coord.satellites < 6) {
    issues.push(`Only ${coord.satellites} satellites available (minimum 6 recommended)`);
    confidence -= 25;
    recommendations.push('Wait for better satellite visibility');
  }

  // Check HDOP
  if (coord.hdop && coord.hdop > 5) {
    issues.push(`High HDOP value of ${coord.hdop.toFixed(1)} indicates poor geometry`);
    confidence -= 30;
    recommendations.push('Reposition for better satellite geometry');
  }

  confidence = Math.max(0, confidence);
  const isValid = confidence >= 70 && issues.length === 0;

  return { isValid, confidence, issues, recommendations };
}

/**
 * Converts degrees to radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Converts radians to degrees
 */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Formats coordinates for display
 */
export function formatCoordinate(coord: Coordinate, precision: number = 6): string {
  const latDir = coord.lat >= 0 ? 'N' : 'S';
  const lngDir = coord.lng >= 0 ? 'E' : 'W';
  
  return `${Math.abs(coord.lat).toFixed(precision)}°${latDir}, ${Math.abs(coord.lng).toFixed(precision)}°${lngDir}`;
}

/**
 * Parses coordinate string in various formats
 */
export function parseCoordinate(coordString: string): Coordinate | null {
  // Remove extra whitespace and normalize
  const cleaned = coordString.trim().replace(/\s+/g, ' ');
  
  // Try decimal degrees format: "lat, lng" or "lat lng"
  const decimalMatch = cleaned.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (decimalMatch) {
    return {
      lat: parseFloat(decimalMatch[1]),
      lng: parseFloat(decimalMatch[2])
    };
  }
  
  // Try degrees/minutes/seconds format
  const dmsMatch = cleaned.match(/^(\d+)°(\d+)'([\d.]+)"([NS])[,\s]+(\d+)°(\d+)'([\d.]+)"([EW])$/i);
  if (dmsMatch) {
    const lat = parseInt(dmsMatch[1]) + parseInt(dmsMatch[2]) / 60 + parseFloat(dmsMatch[3]) / 3600;
    const lng = parseInt(dmsMatch[5]) + parseInt(dmsMatch[6]) / 60 + parseFloat(dmsMatch[7]) / 3600;
    
    return {
      lat: dmsMatch[4].toUpperCase() === 'S' ? -lat : lat,
      lng: dmsMatch[8].toUpperCase() === 'W' ? -lng : lng
    };
  }
  
  return null;
}

/**
 * Calculates the centroid of a polygon
 */
export function calculateCentroid(coordinates: Coordinate[]): Coordinate {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate centroid of empty coordinate array');
  }
  
  if (coordinates.length === 1) {
    return coordinates[0];
  }
  
  let area = 0;
  let centroidLat = 0;
  let centroidLng = 0;
  
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const factor = coordinates[i].lng * coordinates[j].lat - coordinates[j].lng * coordinates[i].lat;
    area += factor;
    centroidLat += (coordinates[i].lat + coordinates[j].lat) * factor;
    centroidLng += (coordinates[i].lng + coordinates[j].lng) * factor;
  }
  
  area /= 2;
  centroidLat /= (6 * area);
  centroidLng /= (6 * area);
  
  return { lat: centroidLat, lng: centroidLng };
}