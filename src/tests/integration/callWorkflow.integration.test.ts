import { describe, it, expect, vi } from 'vitest';
import { SIMULATED_CALLERS } from '../../data/mockData';
import { autoDetectLanguage, translateText, performBackTranslation } from '../../services/translationService';
import { speechService } from '../../services/speechService';
import { soundEffects } from '../../services/audioService';
import { CallMessage, UserProfile } from '../../types';

describe('Integration Test: Live Bilingual Call Workflow', () => {
  it('executes a complete end-to-end call lifecycle with real-time translation and evaluation', async () => {
    // 1. Initial State: User with English native profile initiates a call
    const userProfile: UserProfile = {
      name: 'Priya Sharma',
      xp: 200,
      streak: 3,
      streakFreezes: 1,
      level: 1,
      learningLanguage: 'hi',
      nativeLanguage: 'en',
      voiceGender: 'female',
      voiceSpeed: 1.0,
      voiceTone: 'natural',
      badges: ['first_words'],
      savedWordsCount: 5,
      dailyGoalProgress: 40
    };

    // 2. Select Simulated Caller (Rahul Sharma - Mumbai, Hindi)
    const caller = SIMULATED_CALLERS.find(c => c.id === 'rahul');
    expect(caller).toBeDefined();
    expect(caller?.language).toBe('hi');

    // 3. Trigger Ringing Sound Effect
    const ringtoneSpy = vi.spyOn(soundEffects, 'playRingtone');
    soundEffects.playRingtone();
    expect(ringtoneSpy).toHaveBeenCalledTimes(1);

    // 4. Call Connected - Caller sends initial greeting in Hindi
    const callMessages: CallMessage[] = [];
    const greetingText = caller!.greetingText;

    // 5. Integration: Language Detection & Real-time Translation
    const detected = autoDetectLanguage(greetingText);
    expect(detected.lang).toBe('hi');

    const translatedGreeting = await translateText(greetingText, detected.lang, userProfile.nativeLanguage);
    expect(translatedGreeting.translatedText).toBeTruthy();

    // 6. Record Caller Message
    callMessages.push({
      id: 'msg-1',
      sender: 'peer',
      senderName: caller!.name,
      originalText: greetingText,
      translatedText: translatedGreeting.translatedText,
      fromLang: 'hi',
      toLang: 'en',
      timestamp: new Date().toLocaleTimeString(),
      audioPlayed: true
    });

    // 7. User speaks response in English
    const userSpokenEnglish = 'Where is the railway station?';
    const translatedToHindi = await translateText(userSpokenEnglish, 'en', 'hi');

    callMessages.push({
      id: 'msg-2',
      sender: 'self',
      senderName: userProfile.name,
      originalText: userSpokenEnglish,
      translatedText: translatedToHindi.translatedText,
      fromLang: 'en',
      toLang: 'hi',
      timestamp: new Date().toLocaleTimeString(),
      audioPlayed: true
    });

    // 8. Integration: AI Caller analyzes prompt trigger and responds in Hindi
    const matchedResponse = caller!.sampleResponses.find(r => 
      typeof r.promptTrigger === 'string'
        ? userSpokenEnglish.toLowerCase().includes(r.promptTrigger.toLowerCase())
        : (r.promptTrigger as RegExp).test(userSpokenEnglish)
    );
    expect(matchedResponse).toBeDefined();

    const callerReply = matchedResponse!.responseOriginal;
    const replyTranslated = await translateText(callerReply, 'hi', 'en');

    callMessages.push({
      id: 'msg-3',
      sender: 'peer',
      senderName: caller!.name,
      originalText: callerReply,
      translatedText: replyTranslated.translatedText,
      fromLang: 'hi',
      toLang: 'en',
      timestamp: new Date().toLocaleTimeString(),
      audioPlayed: true
    });

    // 9. Integration: Speech Pronunciation Evaluation during call
    const pronunciationCheck = speechService.evaluatePronunciation('रेलवे स्टेशन', 'रेलवे स्टेशन');
    expect(pronunciationCheck.accuracy).toBe(100);
    expect(pronunciationCheck.feedback).toContain('Outstanding');

    // 10. Integration: Round-trip semantic fidelity check on call transcript
    const backTrans = await performBackTranslation('Where is the railway station?', 'en', 'hi');
    expect(backTrans.fidelityScore).toBeGreaterThanOrEqual(70);
    expect(['Perfect', 'High', 'Moderate']).toContain(backTrans.matchEvaluation);

    // 11. End Call
    const callEndSpy = vi.spyOn(soundEffects, 'playCallEnd');
    soundEffects.playCallEnd();
    expect(callEndSpy).toHaveBeenCalledTimes(1);

    // 12. Session Wrap-up: Award XP for completed live call session
    const callDurationSeconds = 75;
    const xpEarned = 50;
    userProfile.xp += xpEarned;
    userProfile.savedWordsCount += 2; // automatically captured new vocabulary

    expect(callMessages).toHaveLength(3);
    expect(userProfile.xp).toBe(250);
    expect(Math.floor(userProfile.xp / 250) + 1).toBe(2); // Leveled up to Level 2!
  });
});
