import { describe, it, expect } from 'vitest';
import { gpsValidationService, GPSValidationService } from '../services/gpsValidationService';

describe('GPSValidationService Unit Tests (Latitude -90 to 90, Longitude -180 to 180)', () => {
  describe('1. Valid GPS Coordinates', () => {
    it('accepts standard valid coordinates (Pune, India)', () => {
      const result = gpsValidationService.validate({
        latitude: 18.5204,
        longitude: 73.8567,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized?.latitude).toBe(18.5204);
      expect(result.sanitized?.longitude).toBe(73.8567);
    });

    it('accepts boundary latitude and longitude values (+90, -90, +180, -180)', () => {
      const northPole = gpsValidationService.validate({ latitude: 90.0, longitude: 0.0 });
      expect(northPole.isValid).toBe(true);

      const southPole = gpsValidationService.validate({ latitude: -90.0, longitude: 0.0 });
      expect(southPole.isValid).toBe(true);

      const dateLineEast = gpsValidationService.validate({ latitude: 0.0, longitude: 180.0 });
      expect(dateLineEast.isValid).toBe(true);

      const dateLineWest = gpsValidationService.validate({ latitude: 0.0, longitude: -180.0 });
      expect(dateLineWest.isValid).toBe(true);

      const primeMeridianEquator = gpsValidationService.validate({ latitude: 0, longitude: 0 });
      expect(primeMeridianEquator.isValid).toBe(true);
    });

    it('accepts valid string numbers and parses them to float', () => {
      const result = gpsValidationService.validate({
        latitude: ' 19.0760 ',
        longitude: ' 72.8777 ',
      });

      expect(result.isValid).toBe(true);
      expect(result.sanitized?.latitude).toBe(19.076);
      expect(result.sanitized?.longitude).toBe(72.8777);
    });

    it('accepts GeoJSON array format [longitude, latitude]', () => {
      const result = gpsValidationService.validate([77.2090, 28.6139]); // Delhi: lon 77.2090, lat 28.6139

      expect(result.isValid).toBe(true);
      expect(result.sanitized?.latitude).toBe(28.6139);
      expect(result.sanitized?.longitude).toBe(77.2090);
    });

    it('accepts optional altitude and accuracy metadata', () => {
      const result = gpsValidationService.validate({
        latitude: 40.7128,
        longitude: -74.0060,
        altitude: 10.5,
        accuracy: 3.2,
        heading: 180,
        speed: 1.5,
      });

      expect(result.isValid).toBe(true);
      expect(result.sanitized?.altitude).toBe(10.5);
      expect(result.sanitized?.accuracy).toBe(3.2);
      expect(result.sanitized?.heading).toBe(180);
      expect(result.sanitized?.speed).toBe(1.5);
    });
  });

  describe('2. Invalid Latitude Out-of-Bounds Checks (-90 to 90)', () => {
    it('rejects latitude greater than +90 degrees', () => {
      const result = gpsValidationService.validate({
        latitude: 90.0001,
        longitude: 0.0,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Latitude'))).toBe(true);
    });

    it('rejects latitude less than -90 degrees', () => {
      const result = gpsValidationService.validate({
        latitude: -90.0001,
        longitude: 0.0,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Latitude'))).toBe(true);
    });

    it('rejects extreme invalid latitude (e.g. 999 or -999)', () => {
      expect(gpsValidationService.isValid(999, 50)).toBe(false);
      expect(gpsValidationService.isValid(-999, 50)).toBe(false);
    });
  });

  describe('3. Invalid Longitude Out-of-Bounds Checks (-180 to 180)', () => {
    it('rejects longitude greater than +180 degrees', () => {
      const result = gpsValidationService.validate({
        latitude: 0.0,
        longitude: 180.0001,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Longitude'))).toBe(true);
    });

    it('rejects longitude less than -180 degrees', () => {
      const result = gpsValidationService.validate({
        latitude: 0.0,
        longitude: -180.0001,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Longitude'))).toBe(true);
    });

    it('rejects extreme invalid longitude (e.g. 360 or -360)', () => {
      expect(gpsValidationService.isValid(0, 360)).toBe(false);
      expect(gpsValidationService.isValid(0, -360)).toBe(false);
    });
  });

  describe('4. Type & NaN / Non-Numeric Checks', () => {
    it('rejects NaN, Infinity, and null coordinates', () => {
      expect(gpsValidationService.validate({ latitude: NaN, longitude: 50 }).isValid).toBe(false);
      expect(gpsValidationService.validate({ latitude: 50, longitude: Infinity }).isValid).toBe(false);
      expect(gpsValidationService.validate({ latitude: null, longitude: 50 }).isValid).toBe(false);
      expect(gpsValidationService.validate({ latitude: undefined, longitude: 50 }).isValid).toBe(false);
    });

    it('rejects non-numeric string inputs', () => {
      const result = gpsValidationService.validate({
        latitude: 'invalid-lat',
        longitude: 'invalid-lon',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it('rejects negative accuracy', () => {
      const result = gpsValidationService.validate({
        latitude: 18.5204,
        longitude: 73.8567,
        accuracy: -5,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Accuracy'))).toBe(true);
    });

    it('assertValid throws Error on invalid inputs and returns sanitized on valid', () => {
      expect(() => gpsValidationService.assertValid({ latitude: 100, longitude: 0 })).toThrowError(/GPS Schema Validation Error/);

      const valid = gpsValidationService.assertValid({ latitude: 18.5204, longitude: 73.8567 });
      expect(valid.latitude).toBe(18.5204);
      expect(valid.longitude).toBe(73.8567);
    });

    it('formats human-readable coordinates correctly', () => {
      const formatted = gpsValidationService.formatReadable({
        latitude: 18.5204,
        longitude: 73.8567,
      });

      expect(formatted).toBe('18.5204° N, 73.8567° E');

      const southWest = gpsValidationService.formatReadable({
        latitude: -33.8688,
        longitude: -151.2093,
      });

      expect(southWest).toBe('33.8688° S, 151.2093° W');
    });
  });
});
