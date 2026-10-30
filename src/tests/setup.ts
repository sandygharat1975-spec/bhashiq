import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock canvas-confetti to avoid canvas clearRect in happy-dom
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
  __esModule: true,
}));

// Polyfill AudioContext for tests
class MockAudioContext {
  currentTime = 0;
  state = 'running';
  destination = {};

  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn()
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    };
  }

  createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn()
      },
      connect: vi.fn()
    };
  }

  resume() {
    return Promise.resolve();
  }
}

if (typeof window !== 'undefined') {
  (window as any).AudioContext = MockAudioContext;
  (window as any).webkitAudioContext = MockAudioContext;

  // Mock SpeechSynthesis
  (window as any).speechSynthesis = {
    speaking: false,
    paused: false,
    pending: false,
    speak: vi.fn((utterance) => {
      if (utterance.onend) utterance.onend();
    }),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => [
      { name: 'Google Hindi', lang: 'hi-IN', default: true },
      { name: 'Google English', lang: 'en-US', default: false },
      { name: 'Google Marathi', lang: 'mr-IN', default: false },
      { name: 'Google Japanese', lang: 'ja-JP', default: false }
    ])
  };

  (window as any).SpeechSynthesisUtterance = class {
    text: string;
    lang: string = 'en-US';
    pitch: number = 1.0;
    rate: number = 1.0;
    voice: any = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(text: string) {
      this.text = text;
    }
  };

  // Mock SpeechRecognition
  (window as any).SpeechRecognition = class {
    continuous = false;
    interimResults = false;
    lang = 'en-US';
    onstart = null;
    onresult = null;
    onerror = null;
    onend = null;
    start = vi.fn();
    stop = vi.fn();
    abort = vi.fn();
  };
  (window as any).webkitSpeechRecognition = (window as any).SpeechRecognition;

  // Mock Audio for high-definition TTS fallback
  class MockAudio {
    src: string = '';
    crossOrigin: string = '';
    playbackRate: number = 1.0;
    paused: boolean = true;
    ended: boolean = false;
    currentTime: number = 0;
    onended: (() => void) | null = null;
    onerror: ((e: any) => void) | null = null;

    play = vi.fn(() => {
      this.paused = false;
      this.ended = false;
      if (this.onended) {
        setTimeout(() => {
          this.ended = true;
          this.paused = true;
          this.onended?.();
        }, 10);
      }
      return Promise.resolve();
    });

    pause = vi.fn(() => {
      this.paused = true;
    });

    constructor(src?: string) {
      if (src) this.src = src;
    }
  }

  (window as any).Audio = MockAudio;

  // Mock fetch for translation API to prevent CORS warnings and ensure zero network latency
  const originalFetch = window.fetch;
  window.fetch = vi.fn(async (url: any, init?: any) => {
    const urlStr = url?.toString() || '';
    if (urlStr.includes('/api/progress/sync')) {
      let body: any = {};
      try { body = JSON.parse(init?.body || '{}'); } catch (e) {}
      const profile = body.clientProfile || {
        userId: body.userId || 'User',
        xp: 4280,
        level: 5,
        streak: 14,
        streakFreezes: 2,
        unlockedBadges: ['first_words', 'words_100', 'speaking_star', 'streak_7'],
        savedWordsCount: 12,
        dailyGoalProgress: 75,
        lastUpdated: Date.now(),
      };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          profile,
          signature: 'authoritative-hmac-mock-signature',
          timestamp: Date.now(),
        }),
      } as any;
    }
    if (urlStr.includes('/api/progress/award-xp')) {
      let body: any = {};
      try { body = JSON.parse(init?.body || '{}'); } catch (e) {}
      const award = body.requestedAmount || 15;
      const newXp = 4280 + award;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          userId: body.userId || 'User',
          awardedXP: award,
          reason: body.reason || body.action,
          xp: newXp,
          level: Math.floor(newXp / 1000) + 1,
          dailyGoalProgress: Math.min(100, 75 + Math.round(award / 2)),
          unlockedBadges: ['first_words', 'words_100', 'speaking_star', 'streak_7'],
          newlyUnlockedBadges: [],
          lastUpdated: Date.now(),
          signature: 'authoritative-hmac-mock-signature',
        }),
      } as any;
    }
    if (urlStr.includes('/api/progress/verify')) {
      let body: any = {};
      try { body = JSON.parse(init?.body || '{}'); } catch (e) {}
      const isValid = Boolean(body.signature && !body.signature.includes('invalid') && !body.signature.includes('tampered'));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          valid: isValid,
          verifiedAt: Date.now(),
        }),
      } as any;
    }
    if (urlStr.includes('/api/emergency/broadcast')) {
      let body: any = {};
      try { body = JSON.parse(init?.body || '{}'); } catch (e) {}
      const loc = body.location;
      const lat = Number(loc?.latitude);
      const lon = Number(loc?.longitude);
      if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lon) || lon < -180 || lon > 180) {
        return {
          ok: false,
          status: 400,
          json: async () => ({
            success: false,
            error: 'Invalid GPS coordinates schema. Latitude must be between -90 and 90, Longitude between -180 and 180.'
          })
        } as any;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          broadcastId: `sos-${Date.now()}`,
          verifiedLocation: { latitude: lat, longitude: lon },
          timestamp: new Date().toISOString()
        })
      } as any;
    }
    if (urlStr.includes('/api/tts') || urlStr.includes('translate_tts')) {
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
        arrayBuffer: async () => new ArrayBuffer(1024),
      } as any;
    }
    if (urlStr.includes('/api/translate')) {
      let body: any = {};
      try {
        body = JSON.parse(init?.body || '{}');
      } catch (e) {}
      return {
        ok: true,
        status: 200,
        headers: new Headers({
          'x-zero-retention': 'true',
          'x-dpa-signed': 'true',
          'x-data-residency': 'On-Premise-Local',
        }),
        json: async () => ({
          translatedText: body.text ? `[ON-PREM] ${body.text}` : 'Translated',
          source: 'on-premise',
          compliance: {
            zeroRetention: true,
            dpaSigned: true,
            dataResidency: 'Local-On-Premise',
            externalTransmission: false,
          },
        }),
      } as any;
    }
    if (urlStr.includes('mymemory.translated.net')) {
      try {
        const parsed = new URL(urlStr);
        const q = parsed.searchParams.get('q') || '';
        return {
          ok: true,
          status: 200,
          json: async () => ({
            responseData: {
              translatedText: q
            }
          })
        } as any;
      } catch (e) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ responseData: { translatedText: 'Translated' } })
        } as any;
      }
    }
    return originalFetch ? originalFetch(url, init) : Promise.reject(new Error('Network error'));
  });
}
