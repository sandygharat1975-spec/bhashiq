import { describe, it, expect } from 'vitest';
import { 
  autoDetectLanguage, 
  checkHomonym, 
  checkIdiom, 
  translateText, 
  performBackTranslation 
} from '../services/translationService';

describe('TranslationService Unit Tests', () => {
  describe('autoDetectLanguage()', () => {
    it('detects Japanese script with high confidence', () => {
      const res1 = autoDetectLanguage('こんにちは');
      expect(res1.lang).toBe('ja');
      expect(res1.confidence).toBeGreaterThanOrEqual(0.9);

      const res2 = autoDetectLanguage('東京駅');
      expect(res2.lang).toBe('ja');
    });

    it('detects Arabic script', () => {
      const res = autoDetectLanguage('مرحبا بك');
      expect(res.lang).toBe('ar');
      expect(res.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('detects Russian / Cyrillic script', () => {
      const res = autoDetectLanguage('Здравствуйте');
      expect(res.lang).toBe('ru');
      expect(res.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('detects Devanagari Hindi and Marathi correctly', () => {
      const hindiRes = autoDetectLanguage('नमस्ते आप कैसे हैं');
      expect(hindiRes.lang).toBe('hi');

      const marathiRes = autoDetectLanguage('तुम्ही कसे आहात? मी पुण्यातून आहे.');
      expect(marathiRes.lang).toBe('mr');
    });

    it('detects Spanish clues like inverted question marks and special characters', () => {
      const res = autoDetectLanguage('¿Cómo estás hoy?');
      expect(res.lang).toBe('es');
      expect(res.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('detects French with accented characters', () => {
      const res = autoDetectLanguage('Bonjour monsieur, où est l\'hôtel?');
      expect(res.lang).toBe('fr');
      expect(res.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('detects German greetings and clues', () => {
      const res = autoDetectLanguage('Guten Morgen, danke schön!');
      expect(res.lang).toBe('de');
    });

    it('handles empty and whitespace-only text gracefully', () => {
      const res = autoDetectLanguage('   ');
      expect(res.lang).toBe('en');
    });
  });

  describe('checkHomonym()', () => {
    it('identifies ambiguous homonyms like "bank" with distinct meanings', () => {
      const result = checkHomonym('I need to visit the bank', 'hi');
      expect(result).not.toBeNull();
      expect(result?.word).toBe('bank');
      expect(result?.contexts.length).toBeGreaterThanOrEqual(2);

      const financial = result?.contexts.find(c => c.meaning.toLowerCase().includes('financial'));
      expect(financial).toBeDefined();

      const river = result?.contexts.find(c => c.meaning.toLowerCase().includes('river'));
      expect(river).toBeDefined();
    });

    it('identifies "bat" with animal and sports contexts', () => {
      const result = checkHomonym('A bat was flying', 'hi');
      expect(result).not.toBeNull();
      expect(result?.word).toBe('bat');
    });

    it('returns null for non-homonym words', () => {
      const result = checkHomonym('Supercomputer artificial intelligence', 'hi');
      expect(result).toBeNull();
    });
  });

  describe('checkIdiom()', () => {
    it('detects "What\'s up?" and provides contextual rather than literal meaning', () => {
      const result = checkIdiom("What's up?", 'hi');
      expect(result).not.toBeNull();
      expect(result?.isIdiom).toBe(true);
      expect(result?.idiomPhrase).toBe("What's up?");
      expect(result?.contextualTranslation).toBeDefined();
      expect(result?.literalTranslation).toBeDefined();
      // Literal translation is different from contextual meaning
      expect(result?.contextualTranslation).not.toBe(result?.literalTranslation);
    });

    it('detects "piece of cake"', () => {
      const result = checkIdiom("This exam is a piece of cake", 'es');
      expect(result).not.toBeNull();
      expect(result?.idiomPhrase).toBe('Piece of cake');
    });

    it('returns null for standard literal statements', () => {
      const result = checkIdiom('I bought two books yesterday', 'hi');
      expect(result).toBeNull();
    });
  });

  describe('translateText()', () => {
    it('returns identical text if source and target languages match', async () => {
      const res = await translateText('Hello World', 'en', 'en');
      expect(res.translatedText).toBe('Hello World');
      expect(res.source).toBe('dictionary');
    });

    it('translates common offline phrases instantly with high fidelity', async () => {
      const helloRes = await translateText('hello', 'en', 'hi');
      expect(helloRes.translatedText).toBe('नमस्ते');

      const thankYouRes = await translateText('thank you', 'en', 'es');
      expect(thankYouRes.translatedText).toBe('Gracias');

      const marathiRes = await translateText('नमस्कार', 'mr', 'en');
      expect(marathiRes.translatedText).toContain('Hello');
    });

    it('prioritizes contextual translation for idioms', async () => {
      const res = await translateText("What's up?", 'en', 'hi');
      expect(res.source).toBe('idiom');
      expect(res.translatedText).toBeDefined();
    });

    it('applies chosen context override for homonyms', async () => {
      const res = await translateText('I went to the bank', 'en', 'hi', 'River Bank');
      expect(res.translatedText).toBe('नदी का किनारा');
    });
  });

  describe('performBackTranslation()', () => {
    it('calculates round-trip semantic fidelity score between 0 and 100', async () => {
      const result = await performBackTranslation('Hello, how are you?', 'en', 'hi');
      expect(result).toBeDefined();
      expect(result.fidelityScore).toBeGreaterThanOrEqual(0);
      expect(result.fidelityScore).toBeLessThanOrEqual(100);
      expect(result.forwardTranslation).toBeDefined();
      expect(result.backTranslation).toBeDefined();
      expect(['Perfect', 'High', 'Moderate', 'Different']).toContain(result.matchEvaluation);
    });
  });
});
