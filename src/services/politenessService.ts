import { SupportedLanguage, PolitenessLevel, ConversationTone } from '../types';

export type { PolitenessLevel, ConversationTone };

export interface PolitenessDetectionResult {
  level: PolitenessLevel;
  confidence: number;
  markers: string[];
}

export interface ToneAnalysisResult {
  tone: ConversationTone;
  isUrgent: boolean;
  confidence: number;
  sentimentScore: number; // -1.0 to 1.0
}

export class PolitenessService {
  /**
   * Detects whether the input expression is formal, informal, or neutral
   * Essential for Devanagari languages (Hindi 'आप' vs 'तू', Marathi 'तुम्ही' vs 'तू') and Japanese Keigo
   */
  public detectPolitenessLevel(text: string, lang: SupportedLanguage): PolitenessDetectionResult {
    const trimmed = text.trim();
    const markers: string[] = [];

    if (lang === 'hi') {
      const formalHi = ['आप', 'आपका', 'आपकी', 'आपके', 'सकते हैं', 'कीजिए', 'बताइए', 'आइए', 'बैठिए', 'कृपया'];
      const informalHi = ['तू', 'तेरा', 'तेरी', 'तेरे', 'तुझे', 'कर रहा है', 'बता', 'आ ', 'बैठ ', 'कर '];

      for (const m of formalHi) {
        if (trimmed.includes(m)) markers.push(m);
      }
      for (const m of informalHi) {
        if (new RegExp(`(?:^|\\s)${m.trim()}(?:$|\\s)`, 'u').test(trimmed) || trimmed.includes(m)) {
          if (!markers.includes(m.trim())) markers.push(m.trim());
        }
      }

      if (markers.some(m => ['आप', 'सकते हैं', 'कीजिए', 'बताइए'].includes(m))) {
        return { level: 'formal', confidence: 0.95, markers };
      }
      if (markers.some(m => ['तू', 'तेरा', 'तेरी', 'तुझे'].includes(m))) {
        return { level: 'informal', confidence: 0.95, markers };
      }
    }

    if (lang === 'mr') {
      const formalMr = ['तुम्ही', 'तुमचा', 'तुमची', 'तुमचे', 'तुम्हाला', 'आहात', 'करा', 'सांगा', 'बसा', 'कृपया'];
      const informalMr = ['तू', 'तुझा', 'तुझी', 'तुझे', 'तुला', 'आहेस', 'करतोस', 'सांग', 'चाललास'];

      for (const m of formalMr) {
        if (trimmed.includes(m)) markers.push(m);
      }
      for (const m of informalMr) {
        if (new RegExp(`(?:^|\\s)${m.trim()}(?:$|\\s)`, 'u').test(trimmed) || trimmed.includes(m)) {
          if (!markers.includes(m.trim())) markers.push(m.trim());
        }
      }

      if (markers.some(m => ['तुम्ही', 'आहात', 'सांगा', 'करा'].includes(m))) {
        return { level: 'formal', confidence: 0.95, markers };
      }
      if (markers.some(m => ['तू', 'तुझा', 'आहेस', 'करतोस'].includes(m))) {
        return { level: 'informal', confidence: 0.95, markers };
      }
    }

    if (lang === 'ja') {
      const formalJa = ['です', 'ます', 'ください', 'ございます', 'でしょうか', 'お話し'];
      for (const m of formalJa) {
        if (trimmed.includes(m)) markers.push(m);
      }
      if (markers.length > 0) {
        return { level: 'formal', confidence: 0.96, markers };
      }
    }

    return { level: 'neutral', confidence: 0.8, markers };
  }

  /**
   * Adapts formality of a sentence between informal and respectful registers
   */
  public adaptFormality(text: string, lang: SupportedLanguage, targetFormality: 'formal' | 'informal'): string {
    let result = text;

    if (lang === 'hi' && targetFormality === 'formal') {
      // Replace informal pronouns and imperatives with respectful equivalents
      result = result
        .replace(/(?:^|\s)तू(?:\s|$)/gu, ' आप ')
        .replace(/(?:^|\s)तेरा(?:\s|$)/gu, ' आपका ')
        .replace(/(?:^|\s)तेरी(?:\s|$)/gu, ' आपकी ')
        .replace(/(?:^|\s)तेरे(?:\s|$)/gu, ' आपके ')
        .replace(/(?:^|\s)बैठ(?:\s|$)/gu, ' बैठिए ')
        .replace(/(?:^|\s)बता(?:\s|$)/gu, ' बताइए ')
        .replace(/(?:^|\s)सुन(?:\s|$)/gu, ' सुनिए ')
        .replace(/(?:^|\s)कर(?:\s|$)/gu, ' कीजिए ');
      return result.replace(/\s+/g, ' ').trim();
    }

    if (lang === 'mr' && targetFormality === 'formal') {
      result = result
        .replace(/(?:^|\s)तू(?:\s|$)/gu, ' तुम्ही ')
        .replace(/(?:^|\s)तुझा(?:\s|$)/gu, ' तुमचा ')
        .replace(/(?:^|\s)तुझी(?:\s|$)/gu, ' तुमची ')
        .replace(/(?:^|\s)तुझे(?:\s|$)/gu, ' तुमचे ')
        .replace(/(?:^|\s)सांग(?:\s|$)/gu, ' सांगा ')
        .replace(/(?:^|\s)करतोस(?:\s|$)/gu, ' करता ')
        .replace(/(?:^|\s)आहेस(?:\s|$)/gu, ' आहात ')
        .replace(/(?:^|\s)कर(?:\s|$)/gu, ' करा ');
      return result.replace(/\s+/g, ' ').trim();
    }

    if (lang === 'en' && targetFormality === 'formal') {
      if (/^Hey,?\s*tell me\b/i.test(result)) {
        result = result.replace(/^Hey,?\s*tell me\b/i, 'Could you please tell me');
      } else if (/^Can you\b/i.test(result)) {
        result = result.replace(/^Can you\b/i, 'Could you please');
      } else if (!/please/i.test(result)) {
        result = `Please let me know: ${result}`;
      }
      return result.trim();
    }

    return result;
  }

  /**
   * Analyzes live call conversation sentiment and emotional tone
   */
  public analyzeSentimentAndTone(text: string): ToneAnalysisResult {
    const lower = text.toLowerCase();

    // 1. Check for Polite / Grateful tone (e.g. "Thank you so much, appreciate your help")
    const politeRegex = /thank you|thanks|appreciate|grateful|kindly|धन्यवाद|आभार|gracias|merci|arigatou|danke/i;
    if (politeRegex.test(lower) && !/emergency|immediately|urgent|आपात|तातडीने/i.test(lower)) {
      return {
        tone: 'polite',
        isUrgent: false,
        confidence: 0.92,
        sentimentScore: 0.8
      };
    }

    // 2. Check for Emergency / Urgent tone
    const urgentRegex = /\b(emergency|doctor|hospital|immediately|urgent|ambulance|police|help\s*me|need\s*help|urgent\s*help)\b|तुरंत|आपात|धोका|तातडीने|रुग्णवाहिका|डॉक्टर|ambulancia|ayuda|secours|urgente/i;
    if (urgentRegex.test(text)) {
      return {
        tone: 'urgent',
        isUrgent: true,
        confidence: 0.95,
        sentimentScore: -0.6
      };
    }

    // 3. Check for Inquisitive tone
    const questionRegex = /\?|where|when|why|how|what|could you|can you|कहाँ|कुठे|काय|कसे|dónde|où/i;
    if (questionRegex.test(text)) {
      return {
        tone: 'inquisitive',
        isUrgent: false,
        confidence: 0.88,
        sentimentScore: 0.1
      };
    }

    return {
      tone: 'neutral',
      isUrgent: false,
      confidence: 0.8,
      sentimentScore: 0.0
    };
  }
}

export const politenessService = new PolitenessService();
