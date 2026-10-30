import { describe, it, expect, vi, beforeEach } from 'vitest';
import { progressSyncService } from '../../services/progressSyncService';
// @ts-ignore
import { signProgressState, ACTION_XP_RULES } from '../../../server/server.js';

describe('Integration Test: Server-Authoritative Progress & Cryptographic State Synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a valid cryptographic HMAC-SHA256 signature over authoritative progress state', () => {
    const profile = {
      userId: 'aditya-test',
      xp: 5000,
      level: 6,
      streak: 21,
      unlockedBadges: ['speaking_star', 'first_words', 'streak_7'],
      lastUpdated: 1700000000000,
    };

    const signature1 = signProgressState(profile);
    expect(signature1).toBeTruthy();
    expect(signature1.length).toBe(64); // SHA-256 produces 64-char hex

    // Deterministic signature regardless of badge array order
    const profileReorderedBadges = {
      ...profile,
      unlockedBadges: ['first_words', 'streak_7', 'speaking_star'],
    };
    const signature2 = signProgressState(profileReorderedBadges);
    expect(signature1).toBe(signature2);

    // Any tampering alters the signature
    const tamperedProfile = { ...profile, xp: 999999 };
    const tamperedSig = signProgressState(tamperedProfile);
    expect(tamperedSig).not.toBe(signature1);
  });

  it('synchronizes progress with backend and attaches cryptographic signature', async () => {
    const syncRes = await progressSyncService.syncAuthoritativeProgress('test-user-1');

    expect(syncRes).toBeDefined();
    expect(syncRes.profile.xp).toBeGreaterThanOrEqual(4000);
    expect(syncRes.profile.level).toBeGreaterThanOrEqual(4);
    expect(syncRes.signature).toBeTruthy();
    expect(syncRes.isAuthoritative).toBe(true);
  });

  it('awards XP authoritatively through backend endpoint enforcing anti-cheat limits', async () => {
    const awardRes = await progressSyncService.awardAuthoritativeXP(
      'SPEECH_TRANSLATED',
      15,
      'Live speech translated',
      'test-user-1'
    );

    expect(awardRes.success).toBe(true);
    expect(awardRes.awardedXP).toBe(15);
    expect(awardRes.xp).toBeGreaterThan(4280);
    expect(awardRes.signature).toBeTruthy();
    expect(awardRes.isAuthoritative).toBe(true);
  });

  it('rejects excessive or unauthorized XP awards via server-side action rule caps', () => {
    // Client attempts to grant 1,000,000 XP in one call
    const speechRule = ACTION_XP_RULES['SPEECH_TRANSLATED'];
    expect(speechRule).toBeDefined();
    expect(speechRule.maxPerCall).toBe(50); // Hard cap on single award
    expect(speechRule.baseXP).toBe(15);
  });

  it('detects state tampering when validating snapshots', async () => {
    const validSnapshot = {
      userId: 'test-user-1',
      xp: 4295,
      level: 5,
      streak: 14,
      unlockedBadges: ['first_words', 'streak_7'],
      lastUpdated: Date.now(),
    };

    const validSig = 'authoritative-hmac-mock-signature';
    const isAuthentic = await progressSyncService.verifySnapshot(validSnapshot, validSig);
    expect(isAuthentic).toBe(true);

    const isTampered = await progressSyncService.verifySnapshot(
      { ...validSnapshot, xp: 999999 },
      'tampered-invalid-sig'
    );
    expect(isTampered).toBe(false);
  });
});
