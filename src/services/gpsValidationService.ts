import { GPSCoordinates, GPSValidationResult } from '../types';

/**
 * GPS Coordinate Validation Service
 * Enforces strict schema constraints:
 * - Latitude: [-90, 90]
 * - Longitude: [-180, 180]
 * - Altitude: finite number (if provided)
 * - Accuracy: non-negative finite number in meters (if provided)
 */
export class GPSValidationService {
  public static readonly MIN_LATITUDE = -90.0;
  public static readonly MAX_LATITUDE = 90.0;
  public static readonly MIN_LONGITUDE = -180.0;
  public static readonly MAX_LONGITUDE = 180.0;

  /**
   * Validates GPS coordinate payload against schema
   */
  public validate(input: unknown): GPSValidationResult {
    const errors: string[] = [];

    if (!input || (typeof input !== 'object' && !Array.isArray(input))) {
      return {
        isValid: false,
        errors: ['Coordinates must be an object or [longitude, latitude] array.'],
      };
    }

    let rawLat: unknown;
    let rawLon: unknown;
    let rawAlt: unknown = null;
    let rawAcc: unknown = null;
    let rawHeading: unknown = null;
    let rawSpeed: unknown = null;
    let rawTimestamp: unknown = null;

    if (Array.isArray(input)) {
      // GeoJSON format standard is [longitude, latitude, altitude?]
      if (input.length < 2) {
        return {
          isValid: false,
          errors: ['Array coordinates must contain at least [longitude, latitude].'],
        };
      }
      rawLon = input[0];
      rawLat = input[1];
      if (input.length >= 3) rawAlt = input[2];
    } else {
      const obj = input as Record<string, unknown>;
      rawLat = obj.latitude !== undefined ? obj.latitude : (obj.lat !== undefined ? obj.lat : undefined);
      rawLon = obj.longitude !== undefined ? obj.longitude : (obj.lng !== undefined ? obj.lng : obj.lon);
      rawAlt = obj.altitude !== undefined ? obj.altitude : null;
      rawAcc = obj.accuracy !== undefined ? obj.accuracy : null;
      rawHeading = obj.heading !== undefined ? obj.heading : null;
      rawSpeed = obj.speed !== undefined ? obj.speed : null;
      rawTimestamp = obj.timestamp !== undefined ? obj.timestamp : null;
    }

    // 1. Latitude Validation (-90 to 90)
    const latNum = this.parseNumeric(rawLat);
    if (latNum === null || !Number.isFinite(latNum)) {
      errors.push('Latitude must be a valid finite number.');
    } else if (latNum < GPSValidationService.MIN_LATITUDE || latNum > GPSValidationService.MAX_LATITUDE) {
      errors.push(`Latitude (${latNum}) out of bounds. Must be between -90 and 90 degrees.`);
    }

    // 2. Longitude Validation (-180 to 180)
    const lonNum = this.parseNumeric(rawLon);
    if (lonNum === null || !Number.isFinite(lonNum)) {
      errors.push('Longitude must be a valid finite number.');
    } else if (lonNum < GPSValidationService.MIN_LONGITUDE || lonNum > GPSValidationService.MAX_LONGITUDE) {
      errors.push(`Longitude (${lonNum}) out of bounds. Must be between -180 and 180 degrees.`);
    }

    // 3. Optional Altitude Validation
    let altNum: number | null = null;
    if (rawAlt !== null && rawAlt !== undefined) {
      const parsed = this.parseNumeric(rawAlt);
      if (parsed === null || !Number.isFinite(parsed)) {
        errors.push('Altitude must be a valid finite number if specified.');
      } else {
        altNum = parsed;
      }
    }

    // 4. Optional Accuracy Validation
    let accNum: number | null = null;
    if (rawAcc !== null && rawAcc !== undefined) {
      const parsed = this.parseNumeric(rawAcc);
      if (parsed === null || !Number.isFinite(parsed) || parsed < 0) {
        errors.push('Accuracy must be a non-negative finite number representing meters.');
      } else {
        accNum = parsed;
      }
    }

    // 5. Optional Heading Validation
    let headingNum: number | null = null;
    if (rawHeading !== null && rawHeading !== undefined) {
      const parsed = this.parseNumeric(rawHeading);
      if (parsed === null || !Number.isFinite(parsed) || parsed < 0 || parsed > 360) {
        errors.push('Heading must be between 0 and 360 degrees.');
      } else {
        headingNum = parsed;
      }
    }

    // 6. Optional Speed Validation
    let speedNum: number | null = null;
    if (rawSpeed !== null && rawSpeed !== undefined) {
      const parsed = this.parseNumeric(rawSpeed);
      if (parsed === null || !Number.isFinite(parsed) || parsed < 0) {
        errors.push('Speed must be a non-negative finite number.');
      } else {
        speedNum = parsed;
      }
    }

    if (errors.length > 0 || latNum === null || lonNum === null) {
      return {
        isValid: false,
        errors,
      };
    }

    return {
      isValid: true,
      errors: [],
      sanitized: {
        latitude: latNum,
        longitude: lonNum,
        altitude: altNum,
        accuracy: accNum,
        heading: headingNum,
        speed: speedNum,
        timestamp: typeof rawTimestamp === 'number' && Number.isFinite(rawTimestamp) ? rawTimestamp : Date.now(),
      },
    };
  }

  /**
   * Fast boolean check for latitude and longitude
   */
  public isValid(latitude: unknown, longitude: unknown): boolean {
    const lat = this.parseNumeric(latitude);
    const lon = this.parseNumeric(longitude);
    if (lat === null || lon === null) return false;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
    return (
      lat >= GPSValidationService.MIN_LATITUDE &&
      lat <= GPSValidationService.MAX_LATITUDE &&
      lon >= GPSValidationService.MIN_LONGITUDE &&
      lon <= GPSValidationService.MAX_LONGITUDE
    );
  }

  /**
   * Asserts validity or throws descriptive schema error
   */
  public assertValid(input: unknown): GPSCoordinates {
    const res = this.validate(input);
    if (!res.isValid || !res.sanitized) {
      throw new Error(`GPS Schema Validation Error: ${res.errors.join(', ')}`);
    }
    return res.sanitized;
  }

  /**
   * Format GPS coordinates into readable string e.g. "18.5204° N, 73.8567° E"
   */
  public formatReadable(coords: GPSCoordinates): string {
    const latDir = coords.latitude >= 0 ? 'N' : 'S';
    const lonDir = coords.longitude >= 0 ? 'E' : 'W';
    const absLat = Math.abs(coords.latitude).toFixed(4);
    const absLon = Math.abs(coords.longitude).toFixed(4);
    return `${absLat}° ${latDir}, ${absLon}° ${lonDir}`;
  }

  /**
   * Helper to parse string or number into finite float
   */
  private parseNumeric(value: unknown): number | null {
    if (typeof value === 'number') {
      return isNaN(value) ? null : value;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const num = Number(trimmed);
      return isNaN(num) ? null : num;
    }
    return null;
  }
}

export const gpsValidationService = new GPSValidationService();
