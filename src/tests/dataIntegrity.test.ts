import { describe, it, expect } from 'vitest';
import { 
  SUPPORTED_LANGUAGES, 
  HOMONYM_DATABASE, 
  IDIOMS_DATABASE, 
  TRAVEL_PACKS, 
  EMERGENCY_PHRASES, 
  MINI_GAMES_DATA,
  SIMULATED_CALLERS
} from '../data/mockData';
import { UI_TRANSLATIONS } from '../data/translationsUI';

describe('Data Integrity & Linguistic Dictionaries', () => {
  describe('SUPPORTED_LANGUAGES', () => {
    it('contains all 13 required languages with full metadata', () => {
      expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(13);

      for (const lang of SUPPORTED_LANGUAGES) {
        expect(lang.code).toBeTruthy();
        expect(lang.name).toBeTruthy();
        expect(lang.nativeName).toBeTruthy();
        expect(lang.flag).toBeTruthy();
        expect(lang.speechCode).toBeTruthy();
      }
    });

    it('contains core college project languages: English, Hindi, and Marathi', () => {
      const codes = SUPPORTED_LANGUAGES.map(l => l.code);
      expect(codes).toContain('en');
      expect(codes).toContain('hi');
      expect(codes).toContain('mr');
    });
  });

  describe('HOMONYM_DATABASE', () => {
    it('provides multi-context translations for ambiguous words', () => {
      const keys = Object.keys(HOMONYM_DATABASE);
      expect(keys.length).toBeGreaterThan(0);

      for (const key of keys) {
        const item = HOMONYM_DATABASE[key];
        expect(item.word).toBe(key);
        expect(item.contexts.length).toBeGreaterThanOrEqual(2);
        for (const ctx of item.contexts) {
          expect(ctx.meaning).toBeTruthy();
          expect(ctx.translations.hi).toBeTruthy();
        }
      }
    });
  });

  describe('IDIOMS_DATABASE', () => {
    it('contains idiomatic expressions with distinct literal vs contextual semantics', () => {
      expect(IDIOMS_DATABASE.length).toBeGreaterThan(0);

      for (const item of IDIOMS_DATABASE) {
        expect(item.phrase).toBeTruthy();
        expect(item.actualMeaning).toBeTruthy();
        expect(item.literalMeaning).toBeTruthy();
        expect(item.contextualTranslations).toBeDefined();
        expect(item.literalTranslations).toBeDefined();
      }
    });
  });

  describe('TRAVEL_PACKS & EMERGENCY_PHRASES', () => {
    it('ensures travel phrasebooks have valid phrases and phonetic spellings', () => {
      const routes = Object.keys(TRAVEL_PACKS);
      expect(routes).toContain('hi-to-ja');
      expect(routes).toContain('hi-to-es');

      for (const route of routes) {
        const categories = TRAVEL_PACKS[route];
        expect(categories.length).toBeGreaterThanOrEqual(3);
        for (const cat of categories) {
          expect(cat.name).toBeTruthy();
          expect(cat.phrases.length).toBeGreaterThan(0);
          for (const phrase of cat.phrases) {
            expect(phrase.en).toBeTruthy();
            expect(phrase.target).toBeTruthy();
            expect(phrase.phonetic).toBeTruthy();
          }
        }
      }
    });

    it('validates emergency SOS phrases have translations for all essential languages', () => {
      expect(EMERGENCY_PHRASES.length).toBeGreaterThanOrEqual(4);

      for (const ep of EMERGENCY_PHRASES) {
        expect(ep.en).toBeTruthy();
        expect(ep.translations.hi).toBeTruthy();
        expect(ep.translations.mr).toBeTruthy();
        expect(ep.translations.es).toBeTruthy();
      }
    });
  });

  describe('MINI_GAMES_DATA', () => {
    it('ensures mini games quiz options and correct answers are valid', () => {
      expect(MINI_GAMES_DATA.wordMatchPairs.length).toBeGreaterThanOrEqual(4);

      for (const pair of MINI_GAMES_DATA.wordMatchPairs) {
        expect(pair.en).toBeTruthy();
        expect(pair.target).toBeTruthy();
      }

      for (const q of MINI_GAMES_DATA.listeningQuestions) {
        expect(q.prompt).toBeTruthy();
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
      }

      for (const q of MINI_GAMES_DATA.translationQuestions) {
        expect(q.prompt).toBeTruthy();
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
      }
    });
  });

  describe('SIMULATED_CALLERS', () => {
    it('configures live demo callers with avatars, roles, and native languages', () => {
      expect(SIMULATED_CALLERS.length).toBeGreaterThanOrEqual(3);

      for (const caller of SIMULATED_CALLERS) {
        expect(caller.id).toBeTruthy();
        expect(caller.name).toBeTruthy();
        expect(caller.role).toBeTruthy();
        expect(caller.avatar).toBeTruthy();
        expect(caller.sampleResponses.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('UI_TRANSLATIONS', () => {
    it('ensures Bhashiq branding and essential UI strings are present in all 6 UI languages', () => {
      const languages = ['en', 'hi', 'mr', 'es', 'fr', 'ja'] as const;

      for (const lang of languages) {
        const ui = UI_TRANSLATIONS[lang];
        expect(ui).toBeDefined();
        expect(ui.appName).toMatch(/Bhashiq|भाषिक/);
        expect(ui.liveCallTranslator).toBeTruthy();
        expect(ui.cameraAR).toBeTruthy();
        expect(ui.learningDashboard).toBeTruthy();
      }
    });
  });
});
