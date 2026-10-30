import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sanitizationService,
  escapeHtml,
  stripHtmlTags,
  stripDangerousProtocols,
} from '../services/sanitizationService';
import { socketService } from '../services/socketService';
import { CallMessage } from '../types';

describe('Strict HTML Entity Encoding & DOMPurify Sanitization Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HTML Entity Encoding & Protocol Stripping', () => {
    it('strictly encodes HTML control delimiters to prevent markup injection', () => {
      const raw = `<script>alert("XSS & Injection")</script>`;
      const encoded = escapeHtml(raw);

      expect(encoded).not.toContain('<');
      expect(encoded).not.toContain('>');
      expect(encoded).toContain('&lt;script&gt;');
      expect(encoded).toContain('&quot;XSS &amp; Injection&quot;');
      expect(encoded).toContain('&lt;/script&gt;');
    });

    it('strips HTML and XML tags from untrusted inputs', () => {
      const dirty = `Hello <b>world</b> <img src=x onerror=alert(1)> and <a href="evil.com">link</a>`;
      const clean = stripHtmlTags(dirty);

      expect(clean).toBe('Hello world  and link');
      expect(clean).not.toContain('<');
      expect(clean).not.toContain('onerror');
    });

    it('neutralizes dangerous pseudo-protocols like javascript: and vbscript:', () => {
      const payload1 = 'Check this out: javascript:alert(document.cookie)';
      const payload2 = 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==';

      expect(stripDangerousProtocols(payload1)).toContain('[BLOCKED_PROTOCOL]');
      expect(stripDangerousProtocols(payload1)).not.toContain('javascript:alert');
      expect(stripDangerousProtocols(payload2)).toContain('[BLOCKED_PROTOCOL]');
    });
  });

  describe('DOMPurify Plain Text Sanitization', () => {
    it('defangs executable script tags, event handlers, and malicious DOM injection vectors', () => {
      const xssVectors = [
        '<script>alert("XSS")</script>',
        '<img src="invalid" onerror="alert(\'XSS\')"/>',
        '<svg onload="alert(\'SVG_XSS\')">',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<body onload=alert(1)>',
        '<input onfocus=alert(1) autofocus>',
      ];

      for (const vector of xssVectors) {
        const sanitized = sanitizationService.sanitizePlainText(vector);
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onload');
        expect(sanitized).not.toContain('onfocus');
        expect(sanitized).not.toContain('<iframe');
      }
    });

    it('preserves legitimate multilingual Unicode characters, accents, and natural punctuation', () => {
      const legitInputs = [
        'नमस्ते, आप कैसे हैं? आज मौसम बहुत अच्छा है।',
        'नमस्कार, रेल्वे स्टेशन कुठे आहे?',
        '¿Dónde está la estación de tren? ¡Muchas gracias!',
        '駅はどこですか？ ありがとうございます。',
        'C\'est la vie, où est l\'hôpital ?',
      ];

      for (const input of legitInputs) {
        const sanitized = sanitizationService.sanitizePlainText(input);
        expect(sanitized).toBe(input);
      }
    });
  });

  describe('CallMessage & Peer User Sanitization', () => {
    it('sanitizes all fields of a CallMessage before UI state ingestion', () => {
      const maliciousMsg: CallMessage = {
        id: 'msg-<script>123</script>',
        sender: 'peer',
        senderName: '<img src=x onerror=alert(1)> Hacker',
        originalText: '<svg/onload=alert("pwned")> Hello peer',
        translatedText: '<iframe src=javascript:alert(1)> Translated',
        fromLang: 'en',
        toLang: 'hi',
        timestamp: '12:00',
      };

      const safeMsg = sanitizationService.sanitizeCallMessage(maliciousMsg);

      expect(safeMsg.id).not.toContain('<script>');
      expect(safeMsg.senderName).toBe('Hacker');
      expect(safeMsg.originalText).toBe('Hello peer');
      expect(safeMsg.translatedText).toBe('Translated');
    });

    it('sanitizes peer usernames in participant lists', () => {
      const peer = {
        id: 'user-<script>',
        userName: '<b onmouseover=alert(1)>Attacker</b>',
        language: 'en',
      };

      const safeUser = sanitizationService.sanitizePeerUser(peer);

      expect(safeUser.userName).toBe('Attacker');
      expect(safeUser.userName).not.toContain('<b');
      expect(safeUser.userName).not.toContain('onmouseover');
      expect(safeUser.id).not.toContain('<script>');
    });
  });

  describe('Socket Reception Pre-UI Interceptor', () => {
    it('automatically cleanses incoming peer transcripts in socketService.onReceiveTranscript', () => {
      const socketMock: any = {
        on: vi.fn(),
      };
      (socketService as any).socket = socketMock;

      let registeredHandler: ((msg: CallMessage) => void) | null = null;
      socketMock.on.mockImplementation((event: string, handler: any) => {
        if (event === 'receive-call-transcript') {
          registeredHandler = handler;
        }
      });

      const uiCallback = vi.fn();
      socketService.onReceiveTranscript(uiCallback);

      expect(registeredHandler).not.toBeNull();

      // Simulate untrusted peer emitting malicious XSS payload
      const untrustedIncoming: CallMessage = {
        id: 'msg-456',
        sender: 'peer',
        senderName: '<script>alert("hacked")</script> Eve',
        originalText: '<img src=x onerror="alert(document.cookie)"/> Let us meet',
        translatedText: 'चलो मिलते हैं <svg onload=alert(1)>',
        fromLang: 'en',
        toLang: 'hi',
        timestamp: '12:05',
      };

      // Trigger socket event
      registeredHandler!(untrustedIncoming);

      // Verify UI callback received sanitized data
      expect(uiCallback).toHaveBeenCalled();
      const sanitizedDelivered = uiCallback.mock.calls[0][0] as CallMessage;

      expect(sanitizedDelivered.senderName).toBe('Eve');
      expect(sanitizedDelivered.originalText).toBe('Let us meet');
      expect(sanitizedDelivered.translatedText).toBe('चलो मिलते हैं');
      expect(sanitizedDelivered.senderName).not.toContain('<script>');
      expect(sanitizedDelivered.originalText).not.toContain('onerror');
      expect(sanitizedDelivered.translatedText).not.toContain('onload');
    });
  });
});
