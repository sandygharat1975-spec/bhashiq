import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AppProvider } from '../../context/AppContext';
import { EmergencyMode } from '../../components/travel/EmergencyMode';
import { EMERGENCY_PHRASES } from '../../data/mockData';
import { soundEffects } from '../../services/audioService';
import { speechService } from '../../services/speechService';
import { gpsValidationService } from '../../services/gpsValidationService';
import { emergencyRateLimiter } from '../../services/emergencyRateLimiter';
// @ts-ignore
import { validateGPSCoordinates } from '../../../server/server.js';

describe('Integration Test: Emergency SOS Broadcast Workflow, GPS Schema & Rate-Limited Confirmation', () => {
  let sirenSpy: any;
  let speakSpy: any;

  beforeEach(() => {
    emergencyRateLimiter.reset();
    sirenSpy = vi.spyOn(soundEffects, 'playEmergencySiren');
    speakSpy = vi.spyOn(speechService, 'speak');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Frontend UI: Rate-Limited Confirmation Dialog & GPS Schema Validation', () => {
    it('requires confirmation before triggering siren/TTS, validates GPS bounds, and displays telemetry', async () => {
      render(
        <AppProvider>
          <EmergencyMode />
        </AppProvider>
      );

      // Verify emergency phrases are listed
      const phraseBtn = screen.getByText(new RegExp(EMERGENCY_PHRASES[0].en, 'i'));
      expect(phraseBtn).toBeDefined();

      // Click phrase button: should NOT immediately play siren or speak (accidental trigger guard)
      await act(async () => {
        fireEvent.click(phraseBtn);
      });

      expect(sirenSpy).not.toHaveBeenCalled();
      expect(speakSpy).not.toHaveBeenCalled();

      // Confirmation dialog should now be open
      expect(screen.getByRole('dialog')).toBeDefined();
      expect(screen.getByText(/Confirm Emergency Broadcast/i)).toBeDefined();

      // Test 1: Enter invalid latitude (> 90)
      const latInput = screen.getByTestId('latitude-input');
      const lonInput = screen.getByTestId('longitude-input');
      const confirmBtn = screen.getByTestId('confirm-broadcast-btn');

      await act(async () => {
        fireEvent.change(latInput, { target: { value: '95.5' } });
      });

      // Should show invalid GPS error indicator and disable confirm button
      expect(screen.getByTestId('gps-error-indicator')).toBeDefined();
      expect(screen.getByText(/Latitude \(95.5\) out of bounds/i)).toBeDefined();
      expect((confirmBtn as HTMLButtonElement).disabled).toBe(true);

      // Test 2: Enter invalid longitude (> 180)
      await act(async () => {
        fireEvent.change(latInput, { target: { value: '18.5204' } });
        fireEvent.change(lonInput, { target: { value: '195.0' } });
      });

      expect(screen.getByText(/Longitude \(195\) out of bounds/i)).toBeDefined();
      expect((confirmBtn as HTMLButtonElement).disabled).toBe(true);

      // Test 3: Enter valid GPS coordinates (Latitude: -90 to 90, Longitude: -180 to 180)
      await act(async () => {
        fireEvent.change(latInput, { target: { value: '18.5204' } });
        fireEvent.change(lonInput, { target: { value: '73.8567' } });
      });

      expect(screen.getByTestId('gps-valid-indicator')).toBeDefined();
      expect(screen.getByText(/18.5204° N, 73.8567° E/i)).toBeDefined();
      expect((confirmBtn as HTMLButtonElement).disabled).toBe(false);

      // Test 4: Confirm broadcast
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      // Now siren and speech must be triggered intentionally
      expect(sirenSpy).toHaveBeenCalledTimes(1);
      expect(speakSpy).toHaveBeenCalledTimes(1);

      // Active SOS banner must display validated GPS telemetry
      const activeLocationBanner = screen.getByTestId('active-sos-location');
      expect(activeLocationBanner.textContent).toContain('18.5204° N, 73.8567° E');

      // Test 5: Immediate subsequent trigger attempt should be blocked by rate limiter
      const secondPhraseBtn = screen.getByText(new RegExp(EMERGENCY_PHRASES[1].en, 'i'));
      await act(async () => {
        fireEvent.click(secondPhraseBtn);
      });

      // Should display rate limit notice banner and NOT reopen confirmation dialog
      expect(screen.getByTestId('emergency-rate-limit-notice')).toBeDefined();
      expect(screen.getByText(/Accidental Trigger Guard Active/i)).toBeDefined();
    });

    it('allows cancelling out of confirmation dialog without side effects', async () => {
      render(
        <AppProvider>
          <EmergencyMode />
        </AppProvider>
      );

      const phraseBtn = screen.getByText(new RegExp(EMERGENCY_PHRASES[0].en, 'i'));
      await act(async () => {
        fireEvent.click(phraseBtn);
      });

      expect(screen.getByRole('dialog')).toBeDefined();

      // Click Cancel
      const cancelBtn = screen.getByRole('button', { name: /Cancel \/ Dismiss/i });
      await act(async () => {
        fireEvent.click(cancelBtn);
      });

      // Dialog dismissed, no siren or speech
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(sirenSpy).not.toHaveBeenCalled();
      expect(speakSpy).not.toHaveBeenCalled();
    });
  });

  describe('2. Backend Server GPS Schema Validation & Telemetry Handling', () => {
    it('validates GPS coordinates schema on server: accepts [-90, 90] lat and [-180, 180] lon', () => {
      const valid = validateGPSCoordinates({ latitude: 18.5204, longitude: 73.8567 });
      expect(valid.isValid).toBe(true);
      expect(valid.coordinates.latitude).toBe(18.5204);
      expect(valid.coordinates.longitude).toBe(73.8567);

      const invalidLatHigh = validateGPSCoordinates({ latitude: 91.0, longitude: 50.0 });
      expect(invalidLatHigh.isValid).toBe(false);
      expect(invalidLatHigh.error).toContain('Latitude');

      const invalidLatLow = validateGPSCoordinates({ latitude: -95.0, longitude: 50.0 });
      expect(invalidLatLow.isValid).toBe(false);

      const invalidLonHigh = validateGPSCoordinates({ latitude: 0.0, longitude: 181.0 });
      expect(invalidLonHigh.isValid).toBe(false);
      expect(invalidLonHigh.error).toContain('Longitude');

      const invalidLonLow = validateGPSCoordinates({ latitude: 0.0, longitude: -185.0 });
      expect(invalidLonLow.isValid).toBe(false);

      const nonNumeric = validateGPSCoordinates({ latitude: 'abc', longitude: 50.0 });
      expect(nonNumeric.isValid).toBe(false);
    });
  });
});
