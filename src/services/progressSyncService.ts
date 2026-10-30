import { UserProfile } from '../types';

export interface AuthoritativeSyncResponse {
  profile: UserProfile;
  signature: string;
  isAuthoritative: boolean;
  timestamp: number;
}

export interface AuthoritativeXPAwardResponse {
  success: boolean;
  userId: string;
  awardedXP: number;
  reason: string;
  xp: number;
  level: number;
  dailyGoalProgress: number;
  unlockedBadges: string[];
  newlyUnlockedBadges: string[];
  lastUpdated: number;
  signature: string;
  isAuthoritative: boolean;
}

const LOCAL_STORAGE_SIGNATURE_KEY = 'bhashiq_authoritative_signature';

class ProgressSyncService {
  private getEndpoint(path: string): string {
    if (typeof window !== 'undefined') {
      const port = window.location.port;
      if (port === '5173') {
        return `${window.location.protocol}//${window.location.hostname}:5001${path}`;
      }
    }
    return `http://localhost:5001${path}`;
  }

  /**
   * Synchronizes progress with the authoritative server and obtains an HMAC cryptographic signature.
   */
  public async syncAuthoritativeProgress(
    userId: string,
    clientProfile?: UserProfile
  ): Promise<AuthoritativeSyncResponse> {
    try {
      const endpoint = this.getEndpoint('/api/progress/sync');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, clientProfile }),
      });

      if (response.ok) {
        const data = await response.json();
        const profile: UserProfile = {
          name: data.profile.userId || clientProfile?.name || 'User',
          xp: data.profile.xp,
          streak: data.profile.streak,
          streakFreezes: data.profile.streakFreezes,
          level: data.profile.level,
          learningLanguage: clientProfile?.learningLanguage || 'es',
          nativeLanguage: clientProfile?.nativeLanguage || 'hi',
          voiceGender: clientProfile?.voiceGender || 'male',
          voiceSpeed: clientProfile?.voiceSpeed || 1.0,
          voiceTone: clientProfile?.voiceTone || 'natural',
          badges: data.profile.unlockedBadges || clientProfile?.badges || [],
          savedWordsCount: data.profile.savedWordsCount || clientProfile?.savedWordsCount || 0,
          dailyGoalProgress: data.profile.dailyGoalProgress,
          signature: data.signature,
          isAuthoritative: true,
        };

        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_SIGNATURE_KEY, data.signature);
        }

        return {
          profile,
          signature: data.signature,
          isAuthoritative: true,
          timestamp: data.timestamp || Date.now(),
        };
      }
    } catch (err) {
      console.warn('[ProgressSyncService] Authoritative backend unreachable, operating in offline fallback mode:', err);
    }

    // Fallback: retain client profile with unverified flag
    const fallbackProfile: UserProfile = clientProfile || {
      name: userId || 'User',
      xp: 4280,
      streak: 14,
      streakFreezes: 2,
      level: 5,
      learningLanguage: 'es',
      nativeLanguage: 'hi',
      voiceGender: 'male',
      voiceSpeed: 1.0,
      voiceTone: 'natural',
      badges: ['first_words', 'words_100', 'speaking_star', 'streak_7'],
      savedWordsCount: 12,
      dailyGoalProgress: 75,
      isAuthoritative: false,
    };

    return {
      profile: fallbackProfile,
      signature: '',
      isAuthoritative: false,
      timestamp: Date.now(),
    };
  }

  /**
   * Requests server-authoritative XP computation and signed state progression.
   */
  public async awardAuthoritativeXP(
    action: string,
    requestedAmount: number,
    reason?: string,
    userId: string = 'Aditya (Student)'
  ): Promise<AuthoritativeXPAwardResponse> {
    try {
      const endpoint = this.getEndpoint('/api/progress/award-xp');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action,
          reason,
          requestedAmount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (typeof localStorage !== 'undefined' && data.signature) {
          localStorage.setItem(LOCAL_STORAGE_SIGNATURE_KEY, data.signature);
        }

        return {
          ...data,
          isAuthoritative: true,
        };
      }
    } catch (err) {
      console.warn('[ProgressSyncService] XP award backend sync failed, applying optimistic local state:', err);
    }

    // Offline / fallback calculation
    return {
      success: true,
      userId,
      awardedXP: requestedAmount,
      reason: reason || action,
      xp: 4280 + requestedAmount,
      level: Math.floor((4280 + requestedAmount) / 1000) + 1,
      dailyGoalProgress: Math.min(100, 75 + Math.round(requestedAmount / 2)),
      unlockedBadges: ['first_words', 'words_100', 'speaking_star', 'streak_7'],
      newlyUnlockedBadges: [],
      lastUpdated: Date.now(),
      signature: '',
      isAuthoritative: false,
    };
  }

  /**
   * Verifies the cryptographic HMAC authenticity of a progress state snapshot.
   */
  public async verifySnapshot(profile: any, signature: string): Promise<boolean> {
    if (!profile || !signature) return false;

    try {
      const endpoint = this.getEndpoint('/api/progress/verify');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, signature }),
      });

      if (response.ok) {
        const data = await response.json();
        return Boolean(data.valid);
      }
    } catch (err) {
      console.warn('[ProgressSyncService] Verification endpoint error:', err);
    }
    return false;
  }
}

export const progressSyncService = new ProgressSyncService();
