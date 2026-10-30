import { describe, it, expect } from 'vitest';
import { SpeechService } from '../services/speechService';

describe('SpeechService Unit Tests', () => {
  const speechService = new SpeechService();

  describe('evaluatePronunciation()', () => {
    it('awards 100% accuracy for an exact word-for-word match', () => {
      const target = 'Buenos días señor';
      const spoken = 'Buenos días señor';

      const result = speechService.evaluatePronunciation(target, spoken);
      expect(result.accuracy).toBe(100);
      expect(result.missedWords).toHaveLength(0);
      expect(result.matchedWords).toEqual(['buenos', 'días', 'señor']);
      expect(result.feedback).toContain('Outstanding');
    });

    it('correctly tracks missed words when the speaker omits part of the phrase', () => {
      const target = 'Comment allez vous aujourd hui';
      const spoken = 'Comment allez vous';

      const result = speechService.evaluatePronunciation(target, spoken);
      expect(result.accuracy).toBeLessThan(100);
      expect(result.accuracy).toBeGreaterThan(50);
      expect(result.missedWords).toContain('aujourd');
      expect(result.missedWords).toContain('hui');
    });

    it('detects extra spoken words that were not in the target phrase', () => {
      const target = 'Hello world';
      const spoken = 'Hello beautiful wonderful world';

      const result = speechService.evaluatePronunciation(target, spoken);
      expect(result.matchedWords).toContain('hello');
      expect(result.matchedWords).toContain('world');
      expect(result.extraWords).toContain('beautiful');
      expect(result.extraWords).toContain('wonderful');
    });

    it('returns low accuracy and constructive tip for mismatched phrases', () => {
      const target = 'Arigatō gozaimasu';
      const spoken = 'Something completely unrelated and wrong';

      const result = speechService.evaluatePronunciation(target, spoken);
      expect(result.accuracy).toBeLessThan(40);
      expect(result.missedWords.length).toBeGreaterThan(0);
      expect(result.feedback).toContain('Practice syllable pacing');
    });

    it('handles punctuation and capitalization differences seamlessly', () => {
      const target = '¿Cómo estás?';
      const spoken = 'como estas';

      const result = speechService.evaluatePronunciation(target, spoken);
      expect(result.accuracy).toBeGreaterThanOrEqual(80);
    });

    it('handles empty input gracefully', () => {
      const result = speechService.evaluatePronunciation('', '');
      expect(result.accuracy).toBe(100);
      expect(result.matchedWords).toEqual([]);
      expect(result.missedWords).toEqual([]);
    });
  });

  describe('isSpeechRecognitionSupported()', () => {
    it('returns a boolean status in any environment', () => {
      const supported = speechService.isSpeechRecognitionSupported();
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('speak() & Audio Fallback Pipeline', () => {
    it('speaks text using Web Speech when matching voice exists', async () => {
      let ended = false;
      await speechService.speak('Hello world', 'en', {
        onEnd: () => {
          ended = true;
        },
      });

      expect(ended).toBe(true);
    });

    it('falls back to audio stream when native OS voice is missing for language', async () => {
      let ended = false;
      // 'gu' (Gujarati) is not in mocked getVoices(), so it tests the audio stream pipeline
      await speechService.speak('નમસ્તે', 'gu', {
        onEnd: () => {
          ended = true;
        },
      });

      expect(ended).toBe(true);
    });

    it('stopSpeaking() cancels speech and audio cleanly', () => {
      speechService.stopSpeaking();
      expect(speechService.isSpeaking()).toBe(false);
    });

    it('detects available voice support via hasVoiceForLanguage()', () => {
      // Mocked voices include Hindi and English
      expect(speechService.hasVoiceForLanguage('en')).toBe(true);
      expect(speechService.hasVoiceForLanguage('hi')).toBe(true);
    });
  });
});
