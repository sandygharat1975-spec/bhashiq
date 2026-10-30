import { SupportedLanguage, RepetitionItem, ReviewGrade } from '../types';

export type { RepetitionItem, ReviewGrade };

export interface RetentionStats {
  totalCards: number;
  dueCardsCount: number;
  masteredCardsCount: number;
  averageEaseFactor: number;
  retentionRatePercentage: number;
}

export class SpacedRepetitionService {
  private readonly MIN_EASE_FACTOR = 1.3;
  private readonly DEFAULT_EASE_FACTOR = 2.5;
  private readonly MS_PER_DAY = 86400000;

  /**
   * SuperMemo-2 (SM-2) Algorithmic Review Scheduler
   * @param item Current flashcard item
   * @param grade Recall quality (0: complete blackout, 3: pass with effort, 5: perfect instant recall)
   * @param now Current timestamp in ms (defaults to Date.now())
   */
  public calculateNextReview(
    item: RepetitionItem,
    grade: ReviewGrade,
    now: number = Date.now()
  ): RepetitionItem {
    // 1. Calculate new Ease Factor (EF')
    // Formula: EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    const currentEF = item.easeFactor || this.DEFAULT_EASE_FACTOR;
    const efDelta = 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02);
    const newEaseFactor = Math.max(this.MIN_EASE_FACTOR, Number((currentEF + efDelta).toFixed(4)));

    let newRepetitions: number;
    let newIntervalDays: number;

    // 2. Determine repetitions and intervals based on review quality
    if (grade >= 3) {
      // Successful recall
      if (item.repetitions === 0) {
        newIntervalDays = 1;
      } else if (item.repetitions === 1) {
        newIntervalDays = 6;
      } else {
        newIntervalDays = Math.max(1, Math.round(item.intervalDays * newEaseFactor));
      }
      newRepetitions = item.repetitions + 1;
    } else {
      // Recall lapse: reset repetitions to 0 and interval to 1 day
      newRepetitions = 0;
      newIntervalDays = 1;
    }

    const nextReviewDate = now + (newIntervalDays * this.MS_PER_DAY);

    return {
      ...item,
      repetitions: newRepetitions,
      intervalDays: newIntervalDays,
      easeFactor: newEaseFactor,
      nextReviewDate,
      lastReviewedAt: now
    };
  }

  /**
   * Filter cards that are due for review
   */
  public filterDueItems(items: RepetitionItem[], currentTime: number = Date.now()): RepetitionItem[] {
    return items.filter(item => item.nextReviewDate <= currentTime);
  }

  /**
   * Calculate vocabulary retention and learning statistics
   */
  public getRetentionStats(items: RepetitionItem[], currentTime: number = Date.now()): RetentionStats {
    if (items.length === 0) {
      return {
        totalCards: 0,
        dueCardsCount: 0,
        masteredCardsCount: 0,
        averageEaseFactor: this.DEFAULT_EASE_FACTOR,
        retentionRatePercentage: 100
      };
    }

    const dueCards = this.filterDueItems(items, currentTime);
    const masteredCards = items.filter(item => item.repetitions >= 5);
    const totalEF = items.reduce((acc, curr) => acc + curr.easeFactor, 0);
    const averageEaseFactor = Number((totalEF / items.length).toFixed(2));
    
    // Retention rate formula based on cards not lapsed
    const nonLapsedCards = items.filter(item => item.repetitions > 0);
    const retentionRatePercentage = Math.round((nonLapsedCards.length / items.length) * 100);

    return {
      totalCards: items.length,
      dueCardsCount: dueCards.length,
      masteredCardsCount: masteredCards.length,
      averageEaseFactor,
      retentionRatePercentage
    };
  }
}

export const spacedRepetitionService = new SpacedRepetitionService();
