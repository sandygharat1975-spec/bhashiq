/**
 * Emergency SOS Trigger Rate Limiter
 * Enforces cooldowns and sliding-window rate limits to prevent:
 * - Accidental distress triggers (pocket dials, tremors, child interactions)
 * - Rapid repeated audio/siren spam
 * - Accidental emergency transmission overload
 */

export interface RateLimitCheckResult {
  allowed: boolean;
  remainingCooldownMs: number;
  remainingCooldownSec: number;
  triggersInWindow: number;
  reason?: string;
}

export class EmergencyRateLimiter {
  private cooldownMs: number;
  private maxTriggersPerWindow: number;
  private windowMs: number;
  private triggerTimestamps: number[] = [];
  private lastTriggerTime: number = 0;

  constructor(options?: {
    cooldownMs?: number;
    maxTriggersPerWindow?: number;
    windowMs?: number;
  }) {
    this.cooldownMs = options?.cooldownMs ?? 5000; // 5-second minimum cooldown between broadcasts
    this.maxTriggersPerWindow = options?.maxTriggersPerWindow ?? 3; // Max 3 triggers per 30s window
    this.windowMs = options?.windowMs ?? 30000;
  }

  /**
   * Check if an emergency trigger is currently allowed
   */
  public checkRateLimit(): RateLimitCheckResult {
    const now = Date.now();

    // 1. Direct cooldown between successive triggers
    const elapsedSinceLast = now - this.lastTriggerTime;
    if (this.lastTriggerTime > 0 && elapsedSinceLast < this.cooldownMs) {
      const remainingMs = this.cooldownMs - elapsedSinceLast;
      return {
        allowed: false,
        remainingCooldownMs: remainingMs,
        remainingCooldownSec: Math.ceil(remainingMs / 1000),
        triggersInWindow: this.cleanAndCountWindow(now),
        reason: `Trigger cooldown active. Please wait ${Math.ceil(remainingMs / 1000)}s before triggering another distress alert.`,
      };
    }

    // 2. Sliding window trigger count
    const count = this.cleanAndCountWindow(now);
    if (count >= this.maxTriggersPerWindow) {
      const oldestInWindow = this.triggerTimestamps[0] || now;
      const remainingMs = Math.max(0, this.windowMs - (now - oldestInWindow));
      return {
        allowed: false,
        remainingCooldownMs: remainingMs,
        remainingCooldownSec: Math.ceil(remainingMs / 1000),
        triggersInWindow: count,
        reason: `Trigger threshold reached (${this.maxTriggersPerWindow} per ${Math.round(this.windowMs / 1000)}s). Cooldown in progress.`,
      };
    }

    return {
      allowed: true,
      remainingCooldownMs: 0,
      remainingCooldownSec: 0,
      triggersInWindow: count,
    };
  }

  /**
   * Attempt to record an emergency trigger.
   * Returns true if allowed and recorded, false if rate limited.
   */
  public recordTrigger(): boolean {
    const check = this.checkRateLimit();
    if (!check.allowed) {
      return false;
    }

    const now = Date.now();
    this.lastTriggerTime = now;
    this.triggerTimestamps.push(now);
    this.cleanAndCountWindow(now);
    return true;
  }

  /**
   * Reset the rate limiter state (useful for tests or administrator reset)
   */
  public reset(): void {
    this.triggerTimestamps = [];
    this.lastTriggerTime = 0;
  }

  /**
   * Adjust configuration dynamically
   */
  public configure(options: {
    cooldownMs?: number;
    maxTriggersPerWindow?: number;
    windowMs?: number;
  }): void {
    if (options.cooldownMs !== undefined) this.cooldownMs = options.cooldownMs;
    if (options.maxTriggersPerWindow !== undefined) this.maxTriggersPerWindow = options.maxTriggersPerWindow;
    if (options.windowMs !== undefined) this.windowMs = options.windowMs;
  }

  /**
   * Filter out expired timestamps and return active count
   */
  private cleanAndCountWindow(now: number): number {
    const cutoff = now - this.windowMs;
    this.triggerTimestamps = this.triggerTimestamps.filter((t) => t > cutoff);
    return this.triggerTimestamps.length;
  }
}

export const emergencyRateLimiter = new EmergencyRateLimiter();
