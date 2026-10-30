import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  privacyTokenizationService,
  isValidLuhn
} from '../services/privacyTokenizationService';
import { socketService } from '../services/socketService';
import { translateText } from '../services/translationService';
import { CallMessage } from '../types';

describe('Client-Side NER & Regex Sensitive Entity Tokenization Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Luhn Card Validation Algorithm', () => {
    it('validates legitimate credit card numbers and rejects invalid numbers', () => {
      // Known valid test cards (Visa test card 4532... Luhn valid)
      expect(isValidLuhn('4532 0150 1234 5678')).toBe(false); // bad checksum
      expect(isValidLuhn('79927398713')).toBe(true); // standard Luhn test vector
      expect(isValidLuhn('4111 1111 1111 1111')).toBe(true); // standard 16-digit Visa
      expect(isValidLuhn('1234 5678')).toBe(false); // too short
    });
  });

  describe('Entity Tokenization & Redaction', () => {
    it('detects and redacts Credit/Debit card numbers prior to transmission', () => {
      const input = 'Please process payment using card 4111-1111-1111-1111 immediately';
      const result = privacyTokenizationService.redactSensitiveEntities(input, { mode: 'tokenize' });

      expect(result.hasSensitiveData).toBe(true);
      expect(result.detectedEntities.length).toBe(1);
      expect(result.detectedEntities[0].type).toBe('CARD');
      expect(result.redactedText).toBe('Please process payment using card <CARD_1> immediately');
      expect(result.entityMap['<CARD_1>'].raw).toBe('4111-1111-1111-1111');
      expect(result.entityMap['<CARD_1>'].masked).toContain('XXXX');
    });

    it('detects and redacts Indian Aadhaar 12-digit numbers', () => {
      const input = 'My citizen identity Aadhaar is 5432 9876 1234 for verification';
      const result = privacyTokenizationService.redactSensitiveEntities(input, { mode: 'tokenize' });

      expect(result.hasSensitiveData).toBe(true);
      expect(result.detectedEntities[0].type).toBe('AADHAAR');
      expect(result.redactedText).toBe('My citizen identity Aadhaar is <AADHAAR_1> for verification');
      expect(result.entityMap['<AADHAAR_1>'].masked).toBe('XXXX-XXXX-1234');
    });

    it('detects and redacts Indian PAN numbers (ABCDE1234F)', () => {
      const input = 'Tax submission PAN card number: BKRPK7890L';
      const result = privacyTokenizationService.redactSensitiveEntities(input, { mode: 'tokenize' });

      expect(result.hasSensitiveData).toBe(true);
      expect(result.detectedEntities[0].type).toBe('PAN');
      expect(result.redactedText).toBe('Tax submission PAN card number: <PAN_1>');
      expect(result.entityMap['<PAN_1>'].masked).toBe('BKXXXXX90L');
    });

    it('detects and redacts Indian and International mobile numbers', () => {
      const input = 'Call me back on +91 98765 43210 or emergency line 9123456789';
      const result = privacyTokenizationService.redactSensitiveEntities(input, { mode: 'tokenize' });

      expect(result.hasSensitiveData).toBe(true);
      expect(result.detectedEntities.length).toBe(2);
      expect(result.detectedEntities[0].type).toBe('PHONE');
      expect(result.detectedEntities[1].type).toBe('PHONE');
      expect(result.redactedText).toBe('Call me back on <PHONE_1> or emergency line <PHONE_2>');
    });

    it('detects and redacts Email addresses', () => {
      const input = 'Send conference notes to doctor.sharma@hospital.org.in please';
      const result = privacyTokenizationService.redactSensitiveEntities(input, { mode: 'tokenize' });

      expect(result.hasSensitiveData).toBe(true);
      expect(result.detectedEntities[0].type).toBe('EMAIL');
      expect(result.redactedText).toBe('Send conference notes to <EMAIL_1> please');
      expect(result.entityMap['<EMAIL_1>'].masked).toBe('d***a@hospital.org.in');
    });

    it('detects and redacts API keys, Bearer tokens, and passwords', () => {
      const input = 'Backend config has api_key: "sk-live-9834710398471203" and password: SecretMasterPass123';
      const result = privacyTokenizationService.redactSensitiveEntities(input, { mode: 'tokenize' });

      expect(result.hasSensitiveData).toBe(true);
      expect(result.detectedEntities.length).toBeGreaterThanOrEqual(1);
      expect(result.detectedEntities[0].type).toBe('SECRET');
      expect(result.redactedText).toContain('<SECRET_');
    });

    it('supports direct masking mode for irreversible redactions', () => {
      const input = 'User phone: 9876543210 and email test@bhashiq.org';
      const result = privacyTokenizationService.redactSensitiveEntities(input, { mode: 'mask' });

      expect(result.hasSensitiveData).toBe(true);
      expect(result.redactedText).not.toContain('9876543210');
      expect(result.redactedText).not.toContain('test@bhashiq.org');
      expect(result.redactedText).toContain('*****');
      expect(result.redactedText).toContain('@bhashiq.org');
    });

    it('handles multiple diverse entities in a single complex spoken sentence', () => {
      const input = 'Hello, my name is Rahul, email rahul@example.com, call 9876543210, Aadhaar 3829 4910 5821';
      const result = privacyTokenizationService.redactSensitiveEntities(input, { mode: 'tokenize' });

      expect(result.hasSensitiveData).toBe(true);
      expect(result.detectedEntities.length).toBe(3);
      expect(result.redactedText).toBe(
        'Hello, my name is Rahul, email <EMAIL_1>, call <PHONE_1>, Aadhaar <AADHAAR_1>'
      );
    });
  });

  describe('Reversible Token Restoration', () => {
    it('restores tokenized entities back to original values after translation', () => {
      const original = 'Please call +91 98765 43210 today';
      const tokenized = privacyTokenizationService.redactSensitiveEntities(original, { mode: 'tokenize' });

      // Simulated translated text where placeholder was preserved by the linguistic engine
      const simulatedTranslation = 'कृपया आज <PHONE_1> पर कॉल करें';
      const restored = privacyTokenizationService.restoreSensitiveEntities(
        simulatedTranslation,
        tokenized.entityMap,
        'original'
      );

      expect(restored).toBe('कृपया आज +91 98765 43210 पर कॉल करें');
    });

    it('restores tokenized entities to masked format when privacy policy requires it', () => {
      const original = 'Transfer to card 4111-1111-1111-1111';
      const tokenized = privacyTokenizationService.redactSensitiveEntities(original, { mode: 'tokenize' });

      const translated = 'ट्रांसफर करें <CARD_1>';
      const restored = privacyTokenizationService.restoreSensitiveEntities(
        translated,
        tokenized.entityMap,
        'masked'
      );

      expect(restored).toContain('XXXX');
      expect(restored).not.toContain('4111-1111-1111-1111');
    });
  });

  describe('Transmission Interceptors Integration', () => {
    it('redacts sensitive entities before transmitting call transcript over Socket.io', () => {
      // Mock socket client
      const emitSpy = vi.fn();
      (socketService as any).socket = {
        connected: true,
        emit: emitSpy,
      };

      const sensitiveMsg: CallMessage = {
        id: 'msg-test',
        sender: 'self',
        senderName: 'Test User',
        originalText: 'My secret pin password: 998877 and phone 9876543210',
        translatedText: 'मेरा पिन password: 998877 और फोन 9876543210',
        fromLang: 'en',
        toLang: 'hi',
        timestamp: '12:00',
      };

      socketService.sendTranscript('room-sec-101', sensitiveMsg);

      expect(emitSpy).toHaveBeenCalledWith(
        'send-call-transcript',
        expect.objectContaining({
          roomId: 'room-sec-101',
          message: expect.objectContaining({
            originalText: expect.not.stringContaining('9876543210'),
            translatedText: expect.not.stringContaining('9876543210'),
            redacted: true,
            detectedEntities: expect.arrayContaining(['PHONE']),
          }),
        })
      );
    });

    it('tokenizes text prior to external translation network calls so the API never sees raw PII', async () => {
      const fetchSpy = vi.spyOn(window, 'fetch');

      const result = await translateText(
        'Doctor consult appointment scheduled for Aadhaar 3829 4910 5821',
        'en',
        'es',
        { isLiveCall: true, privacyMode: 'self-hosted' }
      );

      // Verify fetch was called with tokenized placeholder, NOT the raw Aadhaar number!
      expect(fetchSpy).toHaveBeenCalled();
      const [, init] = fetchSpy.mock.calls[0];
      const sentPayload = JSON.parse(init?.body as string);

      expect(sentPayload.text).not.toContain('3829 4910 5821');
      expect(sentPayload.text).toContain('<AADHAAR_1>');

      // Verify the final returned translation preserved or restored the context safely
      expect(result.redactedEntities).toContain('AADHAAR');
      expect(result.privacyCompliance?.publicAPIAvoided).toBe(true);
    });
  });
});
