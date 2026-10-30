import { describe, it, expect, vi, beforeEach } from 'vitest';
import { translateLiveCallText, translateText } from '../../services/translationService';

describe('Translation Privacy & DPA Compliance Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('strictly blocks public third-party translation APIs for live call speech', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch');

    const result = await translateLiveCallText(
      'Patient requires immediate medical consultation in ICU room 4B',
      'en',
      'hi'
    );

    // Assert fetch was called only to on-premise / zero-retention endpoint, NEVER to mymemory.translated.net
    expect(fetchSpy).toHaveBeenCalled();
    for (const call of fetchSpy.mock.calls) {
      const url = call[0]?.toString() || '';
      expect(url).not.toContain('mymemory.translated.net');
      expect(url).toContain('/api/translate');
    }

    // Verify compliance flags
    expect(result.privacyCompliance).toBeDefined();
    expect(result.privacyCompliance?.zeroRetention).toBe(true);
    expect(result.privacyCompliance?.dpaCompliant).toBe(true);
    expect(result.privacyCompliance?.publicAPIAvoided).toBe(true);
    expect(result.privacyCompliance?.dataResidency).toBe('Local-On-Premise');
  });

  it('attaches enterprise zero-retention and signed DPA headers on on-premise requests', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch');

    await translateLiveCallText(
      'Confidential board meeting discussing Q3 financial statements',
      'en',
      'es'
    );

    expect(fetchSpy).toHaveBeenCalled();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url.toString()).toContain('/api/translate');

    const headers = init?.headers as Record<string, string>;
    expect(headers['X-Zero-Retention']).toBe('true');
    expect(headers['X-DPA-Signed']).toBe('true');
    expect(headers['X-Translation-Scope']).toBe('live-call');
  });

  it('guarantees local zero-retention heuristic fallback when on-premise network is disconnected', async () => {
    // Simulate on-premise endpoint outage
    const originalFetch = window.fetch;
    window.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    const result = await translateLiveCallText(
      'where is the railway station',
      'en',
      'hi'
    );

    // Dictionary hit is 100% on-device
    expect(result.translatedText).toBe('रेलवे स्टेशन कहाँ है?');
    expect(result.privacyCompliance?.zeroRetention).toBe(true);
    expect(result.privacyCompliance?.publicAPIAvoided).toBe(true);
    expect(result.privacyCompliance?.dataResidency).toBe('Local-On-Premise');

    window.fetch = originalFetch;
  });

  it('supports custom on-premise linguistic endpoints with privacy enforcement', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({
        'x-zero-retention': 'true',
        'x-dpa-signed': 'true',
      }),
      json: async () => ({
        translatedText: 'Bereitstellung eines privaten Sprachservers',
        source: 'on-premise',
      }),
    } as any);

    const result = await translateText(
      'Deploying private linguistic server inside DMZ enclave',
      'en',
      'de',
      {
        isLiveCall: true,
        privacyMode: 'enterprise-dpa',
        onPremiseEndpoint: 'https://linguistic-llm.enterprise.local/v1/translate',
      }
    );

    expect(fetchSpy).toHaveBeenCalled();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url.toString()).toBe('https://linguistic-llm.enterprise.local/v1/translate');
    const headers = init?.headers as Record<string, string>;
    expect(headers?.['X-DPA-Signed']).toBe('true');
    expect(headers?.['X-Zero-Retention']).toBe('true');
    expect(result.source).toBe('on-premise');
    expect(result.privacyCompliance?.zeroRetention).toBe(true);
  });

  it('handles offline idioms locally without contacting any network service during live calls', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch');

    // 'break a leg' is an idiom in IDIOMS_DATABASE
    const result = await translateLiveCallText('break a leg', 'en', 'hi');

    expect(result.source).toBe('idiom');
    expect(result.translatedText).toContain('शुभकामनाएं');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.privacyCompliance?.zeroRetention).toBe(true);
    expect(result.privacyCompliance?.publicAPIAvoided).toBe(true);
  });
});
