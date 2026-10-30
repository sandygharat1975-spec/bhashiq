import { describe, it, expect } from 'vitest';
import { soundEffects } from '../services/audioService';

describe('SoundEffectsService Unit Tests', () => {
  it('safely handles audio triggers when running in headless / server environment', () => {
    // Should gracefully complete with no unhandled exceptions
    expect(() => soundEffects.playRingtone()).not.toThrow();
    expect(() => soundEffects.playChime()).not.toThrow();
    expect(() => soundEffects.playSuccess()).not.toThrow();
    expect(() => soundEffects.playMessagePop()).not.toThrow();
    expect(() => soundEffects.playCallEnd()).not.toThrow();
    expect(() => soundEffects.playEmergencySiren()).not.toThrow();
  });
});
