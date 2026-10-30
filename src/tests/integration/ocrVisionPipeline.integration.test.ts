import { describe, it, expect } from 'vitest';
import { DEMO_VISION_ITEMS } from '../../data/mockData';
import { ocrService } from '../../services/ocrService';
import { translateText, autoDetectLanguage } from '../../services/translationService';

describe('Integration Test: Multi-Modal Computer Vision & AR Translation Pipeline', () => {
  it('processes visual signage, detects source language, and generates translated AR bounding overlays', async () => {
    // 1. Load Demo Vision item (Mumbai Central Railway Signboard in Marathi & English)
    const demoSign = DEMO_VISION_ITEMS[0];
    expect(demoSign).toBeDefined();
    expect(demoSign.title).toContain('Mumbai Central');

    // 2. Extract OCR lines through the OCR service pipeline
    const ocrResult = await ocrService.processImage(demoSign.imageUrl, 'hi');
    expect(ocrResult.boxes.length).toBeGreaterThanOrEqual(2);

    // 3. Validate each box has coordinates, confidence, and translation
    for (const box of ocrResult.boxes) {
      expect(box.text).toBeTruthy();
      expect(box.translatedText).toBeTruthy();
      expect(box.bbox.x0).toBeGreaterThanOrEqual(0);
      expect(box.bbox.x1).toBeGreaterThan(box.bbox.x0);
      expect(box.bbox.y1).toBeGreaterThan(box.bbox.y0);
      expect(box.confidence).toBeGreaterThanOrEqual(80);
    }

    // 4. Test multi-language AR overlay generation from original sign text
    const lines = demoSign.originalText.split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(2);

    // Verify first line (मुंबई सेंट्रल) is identified as Devanagari (Marathi)
    const detected = autoDetectLanguage(lines[0]);
    expect(['mr', 'hi']).toContain(detected.lang);

    // Translate to Japanese for foreign tourist
    const translatedJa = await translateText(lines[0], 'mr', 'ja');
    expect(translatedJa.translatedText).toBeTruthy();

    // Translate to Spanish
    const translatedEs = await translateText(lines[1], 'en', 'es');
    expect(translatedEs.translatedText).toBeTruthy();
  }, 15000);
});
