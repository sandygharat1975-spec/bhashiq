import { describe, it, expect } from 'vitest';
import { politenessService } from '../services/politenessService';

describe('TDD: Cultural Politeness, Formality & Sentiment Service', () => {
  describe('detectPolitenessLevel()', () => {
    it('detects formal respectful Devanagari in Hindi using "आप" and respectful verb suffixes', () => {
      const result = politenessService.detectPolitenessLevel('आप कैसे हैं? क्या आप मुझे बता सकते हैं?', 'hi');
      expect(result.level).toBe('formal');
      expect(result.markers).toContain('आप');
    });

    it('detects informal Devanagari in Hindi using "तू" and casual imperatives', () => {
      const result = politenessService.detectPolitenessLevel('तू क्या कर रहा है? इधर आ', 'hi');
      expect(result.level).toBe('informal');
      expect(result.markers).toContain('तू');
    });

    it('detects formal respectful Marathi using "तुम्ही" and "आहात"', () => {
      const result = politenessService.detectPolitenessLevel('तुम्ही कसे आहात? कृपया मदत करा.', 'mr');
      expect(result.level).toBe('formal');
      expect(result.markers).toContain('तुम्ही');
    });

    it('detects informal Marathi using "तू" and "आहेस"', () => {
      const result = politenessService.detectPolitenessLevel('तू कुठे चाललास? मला सांग.', 'mr');
      expect(result.level).toBe('informal');
      expect(result.markers).toContain('तू');
    });

    it('detects Japanese polite Keigo/Teineigo markers like "です", "ます", "ください"', () => {
      const result = politenessService.detectPolitenessLevel('東京駅はどこですか？教えてください。', 'ja');
      expect(result.level).toBe('formal');
    });
  });

  describe('adaptFormality()', () => {
    it('upgrades informal Hindi sentence to respectful formal register', () => {
      const input = 'तू इधर बैठ और बात सुन';
      const adapted = politenessService.adaptFormality(input, 'hi', 'formal');
      
      expect(adapted).toContain('आप');
      expect(adapted).not.toContain('तू');
      expect(adapted).toContain('बैठिए');
    });

    it('upgrades informal Marathi sentence to respectful formal register', () => {
      const input = 'तू काय करतोस? मला सांग';
      const adapted = politenessService.adaptFormality(input, 'mr', 'formal');
      
      expect(adapted).toContain('तुम्ही');
      expect(adapted).not.toContain('तू');
      expect(adapted).toContain('सांगा');
    });

    it('adapts English casual query to professional polite register', () => {
      const input = 'Hey, tell me where the station is';
      const adapted = politenessService.adaptFormality(input, 'en', 'formal');
      
      expect(adapted).toMatch(/Could you please tell me|Please let me know/i);
    });
  });

  describe('analyzeSentimentAndTone()', () => {
    it('identifies urgent distress / SOS tone in multilingual calls', () => {
      const res = politenessService.analyzeSentimentAndTone('Emergency! I need a doctor immediately please!');
      expect(res.tone).toBe('urgent');
      expect(res.isUrgent).toBe(true);

      const resHi = politenessService.analyzeSentimentAndTone('कृपया तुरंत मदद भेजिए, बहुत आपात स्थिति है!');
      expect(resHi.tone).toBe('urgent');
    });

    it('identifies polite grateful sentiment', () => {
      const res = politenessService.analyzeSentimentAndTone('Thank you so much, I really appreciate your kind help.');
      expect(res.tone).toBe('polite');
      expect(res.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('identifies inquisitive / inquiry tone for directions and questions', () => {
      const res = politenessService.analyzeSentimentAndTone('Could you explain what time the next train arrives?');
      expect(res.tone).toBe('inquisitive');
    });
  });
});
