import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmergencyRateLimiter } from '../services/emergencyRateLimiter';

describe('EmergencyRateLimiter Unit Tests', () => {
  let rateLimiter: EmergencyRateLimiter;

  beforeEach(() => {
    rateLimiter = new EmergencyRateLimiter({
      cooldownMs: 3000, // 3s cooldown between triggers
      maxTriggersPerWindow: 2, // Max 2 per window
      windowMs: 10000, // 10s window
    });
  });

  it('allows the initial emergency trigger', () => {
    const status = rateLimiter.checkRateLimit();
    expect(status.allowed).toBe(true);
    expect(status.remainingCooldownSec).toBe(0);

    const recorded = rateLimiter.recordTrigger();
    expect(recorded).toBe(true);
  });

  it('blocks immediate second trigger within cooldown interval', () => {
    rateLimiter.recordTrigger();

    const status = rateLimiter.checkRateLimit();
    expect(status.allowed).toBe(false);
    expect(status.remainingCooldownSec).toBeGreaterThan(0);
    expect(status.reason).toContain('cooldown');

    const recordedAgain = rateLimiter.recordTrigger();
    expect(recordedAgain).toBe(false);
  });

  it('allows second trigger after cooldown expires', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    rateLimiter.recordTrigger();
    expect(rateLimiter.checkRateLimit().allowed).toBe(false);

    // Fast-forward 3.5 seconds
    vi.spyOn(Date, 'now').mockReturnValue(now + 3500);

    const statusAfterCooldown = rateLimiter.checkRateLimit();
    expect(statusAfterCooldown.allowed).toBe(true);
    expect(rateLimiter.recordTrigger()).toBe(true);
  });

  it('enforces maximum trigger threshold within sliding window', () => {
    let fakeTime = 100000;
    vi.spyOn(Date, 'now').mockImplementation(() => fakeTime);

    // 1st trigger at 100s
    expect(rateLimiter.recordTrigger()).toBe(true);

    // Advance 3.5s (cooldown passed) -> 2nd trigger at 103.5s
    fakeTime += 3500;
    expect(rateLimiter.recordTrigger()).toBe(true);

    // Advance 3.5s -> 107s. Cooldown passed, but 2 triggers already recorded in 10s window (max is 2)
    fakeTime += 3500;
    const check = rateLimiter.checkRateLimit();
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('threshold reached');
    expect(rateLimiter.recordTrigger()).toBe(false);

    // Advance past the 10s window (fakeTime = 100000 + 10100 = 110.1s)
    fakeTime = 100000 + 11000;
    expect(rateLimiter.checkRateLimit().allowed).toBe(true);
  });

  it('resets state cleanly', () => {
    rateLimiter.recordTrigger();
    expect(rateLimiter.checkRateLimit().allowed).toBe(false);

    rateLimiter.reset();
    expect(rateLimiter.checkRateLimit().allowed).toBe(true);
  });
});
