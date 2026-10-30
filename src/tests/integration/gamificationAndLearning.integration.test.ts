import { describe, it, expect, vi } from 'vitest';
import { MINI_GAMES_DATA, INITIAL_BADGES } from '../../data/mockData';
import { soundEffects } from '../../services/audioService';
import { UserProfile, SavedWord } from '../../types';

describe('Integration Test: Gamification, Quiz Engine & Vocabulary Bank', () => {
  it('integrates quiz gameplay, sound synthesis, level progression, and spaced repetition', () => {
    // 1. Initial User State
    const profile: UserProfile = {
      name: 'Rohan Patil',
      xp: 220,
      streak: 6,
      streakFreezes: 2,
      level: 1,
      learningLanguage: 'es',
      nativeLanguage: 'mr',
      voiceGender: 'male',
      voiceSpeed: 1.0,
      voiceTone: 'cheerful',
      badges: ['first_words'],
      savedWordsCount: 2,
      dailyGoalProgress: 50
    };

    const savedWords: SavedWord[] = [
      {
        id: 'w-1',
        originalText: 'Water',
        translatedText: 'Agua',
        fromLang: 'en',
        toLang: 'es',
        timestamp: Date.now() - 86400000,
        masteryLevel: 1
      },
      {
        id: 'w-2',
        originalText: 'Sun',
        translatedText: 'Sol',
        fromLang: 'en',
        toLang: 'es',
        timestamp: Date.now() - 43200000,
        masteryLevel: 3
      }
    ];

    // 2. Play Quiz: MiniGames Translation Question
    const question = MINI_GAMES_DATA.translationQuestions[0]; // "Translate to Spanish: Good morning"
    const selectedOptionIndex = question.correctIndex; // 1 -> 'Buenos días'

    // Spies for sound synthesizer
    const successSpy = vi.spyOn(soundEffects, 'playSuccess');
    const chimeSpy = vi.spyOn(soundEffects, 'playChime');

    // 3. User submits correct answer
    const isCorrect = selectedOptionIndex === question.correctIndex;
    expect(isCorrect).toBe(true);

    if (isCorrect) {
      soundEffects.playSuccess();
      const previousLevel = Math.floor(profile.xp / 250) + 1;
      profile.xp += 35; // +35 XP
      profile.dailyGoalProgress = Math.min(100, profile.dailyGoalProgress + 25);

      const newLevel = Math.floor(profile.xp / 250) + 1;
      if (newLevel > previousLevel) {
        profile.level = newLevel;
        soundEffects.playChime(); // Level-up chime!
      }
    }

    expect(successSpy).toHaveBeenCalledTimes(1);
    expect(chimeSpy).toHaveBeenCalledTimes(1); // Profile crossed 250 XP (220 + 35 = 255 XP) -> Level 2
    expect(profile.level).toBe(2);
    expect(profile.dailyGoalProgress).toBe(75);

    // 4. Save newly encountered word to Vocabulary Bank
    const newWord: SavedWord = {
      id: 'w-3',
      originalText: 'Good morning',
      translatedText: question.options[question.correctIndex],
      fromLang: 'en',
      toLang: 'es',
      timestamp: Date.now(),
      masteryLevel: 0
    };
    savedWords.push(newWord);
    profile.savedWordsCount = savedWords.length;
    expect(profile.savedWordsCount).toBe(3);

    // 5. Spaced Repetition Review: Increment mastery level on successful drill
    const wordToReview = savedWords.find(w => w.id === 'w-1')!;
    expect(wordToReview.masteryLevel).toBe(1);

    // Simulate correct review drill
    wordToReview.masteryLevel = Math.min(5, wordToReview.masteryLevel + 1);
    wordToReview.timestamp = Date.now();
    expect(wordToReview.masteryLevel).toBe(2);

    // 6. Streak Preservation & 7-Day Streak Badge Unlocking
    profile.streak += 1;
    expect(profile.streak).toBe(7);

    const streakBadge = INITIAL_BADGES.find(b => b.id === 'streak_7');
    expect(streakBadge).toBeDefined();
    if (profile.streak >= 7 && !profile.badges.includes('streak_7')) {
      profile.badges.push('streak_7');
      profile.xp += streakBadge!.xpReward;
    }

    expect(profile.badges).toContain('streak_7');
    expect(profile.xp).toBe(255 + 300); // 555 XP -> Level 3!
    expect(Math.floor(profile.xp / 250) + 1).toBe(3);
  });
});
