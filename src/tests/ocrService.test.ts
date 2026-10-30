import { describe, it, expect } from 'vitest';
import { ocrService } from '../services/ocrService';

describe('OCRService Unit Tests', () => {
  it('processes image or simulation gracefully without crashing', async () => {
    const result = await ocrService.processImage('dummy-image-data-or-url', 'hi');
    expect(result).toBeDefined();
    expect(result.boxes.length).toBeGreaterThan(0);
    expect(result.boxes[0].text).toBeTruthy();
    expect(result.boxes[0].translatedText).toBeTruthy();
    expect(result.boxes[0].confidence).toBeGreaterThan(0);
  });

  it('translates extracted bounding boxes to Marathi', async () => {
    const result = await ocrService.processImage('dummy-image-data', 'mr');
    expect(result.boxes.length).toBeGreaterThan(0);
    expect(result.boxes[0].translatedText).toBeDefined();
  });
});
