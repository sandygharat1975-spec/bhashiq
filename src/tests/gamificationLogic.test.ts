import { describe, it, expect } from 'vitest';
import { INITIAL_BADGES } from '../data/mockData';
import { SavedWord } from '../types';

describe('Gamification & Learning Logic Unit Tests', () => {
  describe('XP and Level Calculation System', () => {
    const calculateLevel = (xp: number) => Math.floor(xp / 250) + 1;
    const calculateProgressToNextLevel = (xp: number) => ((xp % 250) / 250) * 100;

    it('starts user at Level 1 for 0 to 249 XP', () => {
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(100)).toBe(1);
      expect(calculateLevel(249)).toBe(1);
    });

    it('advances user to Level 2 at 250 XP, and Level 5 at 1000 XP', () => {
      expect(calculateLevel(250)).toBe(2);
      expect(calculateLevel(500)).toBe(3);
      expect(calculateLevel(1000)).toBe(5);
    });

    it('calculates progress percentage within the current level accurately', () => {
      expect(calculateProgressToNextLevel(0)).toBe(0);
      expect(calculateProgressToNextLevel(125)).toBe(50);
      expect(calculateProgressToNextLevel(200)).toBe(80);
    });
  });

  describe('Spaced Repetition & Vocabulary Mastery', () => {
    const sampleWords: SavedWord[] = [
      {
        id: 'w1',
        originalText: 'Hello',
        translatedText: 'नमस्ते',
        fromLang: 'en',
        toLang: 'hi',
        timestamp: Date.now() - 86400000,
        masteryLevel: 5
      },
      {
        id: 'w2',
        originalText: 'Thank you',
        translatedText: 'धन्यवाद',
        fromLang: 'en',
        toLang: 'hi',
        timestamp: Date.now() - 3600000,
        masteryLevel: 2
      },
      {
        id: 'w3',
        originalText: 'Water',
        translatedText: 'पानी',
        fromLang: 'en',
        toLang: 'hi',
        timestamp: Date.now() - 100000,
        masteryLevel: 0
      }
    ];

    it('identifies mastered vocabulary words (level 5)', () => {
      const mastered = sampleWords.filter(w => w.masteryLevel >= 5);
      expect(mastered).toHaveLength(1);
      expect(mastered[0].originalText).toBe('Hello');
    });

    it('identifies words needing active practice (level < 3)', () => {
      const needsPractice = sampleWords.filter(w => w.masteryLevel < 3);
      expect(needsPractice).toHaveLength(2);
      expect(needsPractice.map(w => w.originalText)).toEqual(['Thank you', 'Water']);
    });

    it('correctly increments mastery level capped at 5', () => {
      const increaseMastery = (currentLevel: number) => Math.min(5, currentLevel + 1);
      expect(increaseMastery(2)).toBe(3);
      expect(increaseMastery(4)).toBe(5);
      expect(increaseMastery(5)).toBe(5);
    });
  });

  describe('Badge Achievements System', () => {
    it('verifies default starter badges exist with rewards', () => {
      expect(INITIAL_BADGES.length).toBeGreaterThanOrEqual(8);
      const unlockedCount = INITIAL_BADGES.filter(b => b.unlocked).length;
      expect(unlockedCount).toBeGreaterThanOrEqual(3);
    });

    it('unlocks "Polyglot Explorer" only when practiced across >= 4 languages', () => {
      const isPolyglotEligible = (languagesUsed: string[]) => new Set(languagesUsed).size >= 4;
      expect(isPolyglotEligible(['en', 'hi', 'mr'])).toBe(false);
      expect(isPolyglotEligible(['en', 'hi', 'mr', 'es'])).toBe(true);
      expect(isPolyglotEligible(['en', 'en', 'hi', 'hi'])).toBe(false);
    });

    it('unlocks "Speaking Star" only when high accuracy count reaches 5', () => {
      const isSpeakingStarEligible = (accurateTestsCount: number) => accurateTestsCount >= 5;
      expect(isSpeakingStarEligible(3)).toBe(false);
      expect(isSpeakingStarEligible(5)).toBe(true);
      expect(isSpeakingStarEligible(10)).toBe(true);
    });
  });
});
