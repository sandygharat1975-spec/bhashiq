import { describe, it, expect } from 'vitest';
import { 
  spacedRepetitionService, 
  RepetitionItem, 
  ReviewGrade 
} from '../services/spacedRepetitionService';

describe('TDD: SuperMemo-2 (SM-2) Spaced Repetition Engine', () => {
  const createTestItem = (overrides?: Partial<RepetitionItem>): RepetitionItem => ({
    id: 'test-card-1',
    word: 'Bonjour',
    translation: 'Hello',
    language: 'fr',
    repetitions: 0,
    intervalDays: 0,
    easeFactor: 2.5,
    nextReviewDate: Date.now(),
    lastReviewedAt: Date.now() - 86400000,
    ...overrides
  });

  describe('calculateNextReview()', () => {
    it('schedules first successful review (Grade 4) at 1 day interval with repetitions = 1', () => {
      const item = createTestItem({ repetitions: 0, intervalDays: 0, easeFactor: 2.5 });
      const updated = spacedRepetitionService.calculateNextReview(item, 4);

      expect(updated.repetitions).toBe(1);
      expect(updated.intervalDays).toBe(1);
      // Ease factor formula for grade 4: 2.5 + (0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02)) = 2.5
      expect(updated.easeFactor).toBeCloseTo(2.5, 2);
      expect(updated.nextReviewDate).toBeGreaterThan(Date.now());
    });

    it('schedules second consecutive successful review (Grade 5) at 6 days interval', () => {
      const item = createTestItem({ repetitions: 1, intervalDays: 1, easeFactor: 2.5 });
      const updated = spacedRepetitionService.calculateNextReview(item, 5);

      expect(updated.repetitions).toBe(2);
      expect(updated.intervalDays).toBe(6);
      // Ease factor increases for grade 5: 2.5 + 0.1 = 2.6
      expect(updated.easeFactor).toBeCloseTo(2.6, 2);
    });

    it('applies ease factor multiplication for 3rd and subsequent successful reviews', () => {
      const item = createTestItem({ repetitions: 2, intervalDays: 6, easeFactor: 2.6 });
      const updated = spacedRepetitionService.calculateNextReview(item, 5);

      expect(updated.repetitions).toBe(3);
      // Next interval = Math.round(6 * 2.6) = 16 days (approx)
      expect(updated.intervalDays).toBeGreaterThanOrEqual(15);
      expect(updated.intervalDays).toBeLessThanOrEqual(17);
    });

    it('resets repetitions to 0 and interval to 1 on review lapse (Grade < 3)', () => {
      const item = createTestItem({ repetitions: 4, intervalDays: 25, easeFactor: 2.4 });
      const updated = spacedRepetitionService.calculateNextReview(item, 1); // User forgot word

      expect(updated.repetitions).toBe(0);
      expect(updated.intervalDays).toBe(1);
      // Ease factor should decrease, but never drop below 1.3
      expect(updated.easeFactor).toBeLessThan(2.4);
      expect(updated.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('enforces minimum Ease Factor floor of 1.3 even after multiple failed reviews', () => {
      let item = createTestItem({ repetitions: 0, intervalDays: 1, easeFactor: 1.35 });
      item = spacedRepetitionService.calculateNextReview(item, 0); // Grade 0
      item = spacedRepetitionService.calculateNextReview(item, 0); // Grade 0

      expect(item.easeFactor).toBe(1.3);
    });
  });

  describe('filterDueItems() & getRetentionStats()', () => {
    it('identifies due items where nextReviewDate <= currentTime', () => {
      const now = Date.now();
      const items: RepetitionItem[] = [
        createTestItem({ id: 'due-1', nextReviewDate: now - 3600000 }), // Due 1 hour ago
        createTestItem({ id: 'due-2', nextReviewDate: now }),           // Due now
        createTestItem({ id: 'future', nextReviewDate: now + 86400000 }) // Due tomorrow
      ];

      const due = spacedRepetitionService.filterDueItems(items, now);
      expect(due).toHaveLength(2);
      expect(due.map(d => d.id)).toEqual(['due-1', 'due-2']);
    });

    it('calculates comprehensive vocabulary learning analytics', () => {
      const now = Date.now();
      const items: RepetitionItem[] = [
        createTestItem({ id: '1', repetitions: 5, intervalDays: 30, nextReviewDate: now + 864000000 }),
        createTestItem({ id: '2', repetitions: 4, intervalDays: 20, nextReviewDate: now + 86400000 }),
        createTestItem({ id: '3', repetitions: 0, intervalDays: 1, nextReviewDate: now - 1000 })
      ];

      const stats = spacedRepetitionService.getRetentionStats(items, now);
      expect(stats.totalCards).toBe(3);
      expect(stats.dueCardsCount).toBe(1);
      expect(stats.masteredCardsCount).toBe(1); // Repetitions >= 5
      expect(stats.averageEaseFactor).toBeGreaterThan(2.0);
    });
  });
});
