/**
 * Client-Side Sensitive Entity Tokenization & NER Redaction Service
 * 
 * Intercepts speech transcripts, document texts, and messages PRIOR to external
 * transmission (over WebSockets, WebRTC signaling, or translation endpoints).
 * 
 * Supports:
 * - Reversible tokenization (<CARD_1>, <PHONE_1>, <AADHAAR_1>, etc.) for privacy-preserving translation
 * - One-way masking (XXXX-XXXX-1234) for untrusted transport
 * - High-precision regex & linguistic entity recognition
 */

export type SensitiveEntityType = 
  | 'CARD'
  | 'AADHAAR'
  | 'PAN'
  | 'PHONE'
  | 'EMAIL'
  | 'SSN'
  | 'SECRET'
  | 'HEALTH_ID';

export interface SensitiveEntity {
  type: SensitiveEntityType;
  raw: string;
  masked: string;
  placeholder: string;
  startIndex: number;
  endIndex: number;
}

export interface RedactionResult {
  originalText: string;
  redactedText: string;
  entityMap: Record<string, SensitiveEntity>;
  detectedEntities: SensitiveEntity[];
  hasSensitiveData: boolean;
}

export interface RedactionOptions {
  mode?: 'tokenize' | 'mask'; // 'tokenize' uses <TYPE_N>, 'mask' uses partially masked string
  preserveLast4Digits?: boolean; // Defaults to true
}

/**
 * Validates credit card number with Luhn algorithm
 */
export function isValidLuhn(str: string): boolean {
  const digits = str.replace(/\D/g, '');
  if (digits.length < 11 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Entity Rule Definitions with Priority Order
 */
interface EntityPattern {
  type: SensitiveEntityType;
  regex: RegExp;
  validator?: (match: string) => boolean;
  masker: (match: string) => string;
}

const ENTITY_PATTERNS: EntityPattern[] = [
  // 1. JWT & Bearer Secrets / Passwords
  {
    type: 'SECRET',
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    masker: () => '[REDACTED_JWT_TOKEN]',
  },
  {
    type: 'SECRET',
    regex: /\bBearer\s+[A-Za-z0-9\-._~+/]{12,}=*\b/gi,
    masker: () => 'Bearer [REDACTED_TOKEN]',
  },
  {
    type: 'SECRET',
    regex: /\b(?:password|passwd|api[_-]?key|secret|auth[_-]?token)\s*[:=]\s*["']?([^\s"']{6,})["']?/gi,
    masker: (match) => {
      const parts = match.split(/[:=]/);
      return `${parts[0]}: [REDACTED_SECRET]`;
    },
  },

  // 2. Email Address
  {
    type: 'EMAIL',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    masker: (email: string) => {
      const [name, domain] = email.split('@');
      if (!domain) return '[REDACTED_EMAIL]';
      const visible = name.length > 2 ? `${name.charAt(0)}***${name.charAt(name.length - 1)}` : '***';
      return `${visible}@${domain}`;
    },
  },

  // 3. Indian PAN Card (5 letters + 4 numbers + 1 letter, e.g. ABCDE1234F)
  {
    type: 'PAN',
    regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
    masker: (pan: string) => `${pan.slice(0, 2)}XXXXX${pan.slice(-3)}`,
  },

  // 4. Indian Aadhaar Number (12 digits, first digit 2-9, e.g., 3829 4910 5821)
  {
    type: 'AADHAAR',
    regex: /\b[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}\b/g,
    masker: (aadhaar: string) => {
      const digits = aadhaar.replace(/\D/g, '');
      return `XXXX-XXXX-${digits.slice(-4)}`;
    },
  },

  // 5. Credit / Debit Card (13-19 digits, Luhn validated or explicitly formatted)
  {
    type: 'CARD',
    regex: /\b(?:\d{4}[ -]?){3}\d{1,7}\b|\b\d{13,19}\b/g,
    validator: (card: string) => {
      const digits = card.replace(/\D/g, '');
      // Format 4-4-4-4 or valid Luhn
      return (digits.length === 16 && /[ -]/.test(card)) || isValidLuhn(digits);
    },
    masker: (card: string) => {
      const digits = card.replace(/\D/g, '');
      return `XXXX-XXXX-XXXX-${digits.slice(-4)}`;
    },
  },

  // 6. National Health ID / ABHA (14 digits: 12-3456-7890-1234)
  {
    type: 'HEALTH_ID',
    regex: /\b\d{2}-\d{4}-\d{4}-\d{4}\b/g,
    masker: (hid: string) => {
      const digits = hid.replace(/\D/g, '');
      return `XX-XXXX-XXXX-${digits.slice(-4)}`;
    },
  },

  // 7. US Social Security Number (SSN: 3-2-4 digits)
  {
    type: 'SSN',
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    masker: (ssn: string) => `XXX-XX-${ssn.slice(-4)}`,
  },

  // 8. Phone Numbers (Indian mobile & International)
  {
    type: 'PHONE',
    // Indian 10-digit mobile with optional +91 / 0 prefix, or international formats
    regex: /(?:\+91[ -]?|91[ -]?|0)?[6-9]\d{4}[ -]?\d{5}\b|(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b|\+[1-9]\d{1,3}[ -]?\d{3,4}[ -]?\d{4,6}\b/g,
    masker: (phone: string) => {
      const digits = phone.replace(/\D/g, '');
      if (digits.length <= 4) return '[REDACTED_PHONE]';
      return `+${digits.slice(0, Math.min(2, digits.length - 4))}*****${digits.slice(-4)}`;
    },
  },
];

class PrivacyTokenizationService {
  /**
   * Scans text for sensitive entities and applies client-side tokenization or masking.
   */
  public redactSensitiveEntities(text: string, options: RedactionOptions = {}): RedactionResult {
    const mode = options.mode || 'tokenize';
    if (!text || typeof text !== 'string') {
      return {
        originalText: text,
        redactedText: text,
        entityMap: {},
        detectedEntities: [],
        hasSensitiveData: false,
      };
    }

    const matches: Array<{
      pattern: EntityPattern;
      raw: string;
      startIndex: number;
      endIndex: number;
    }> = [];

    // 1. Gather all regex matches
    for (const pattern of ENTITY_PATTERNS) {
      pattern.regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.regex.exec(text)) !== null) {
        const raw = match[0];
        if (pattern.validator && !pattern.validator(raw)) {
          continue;
        }
        matches.push({
          pattern,
          raw,
          startIndex: match.index,
          endIndex: match.index + raw.length,
        });
      }
    }

    // 2. Sort by starting index, then by length descending (longest match wins)
    matches.sort((a, b) => {
      if (a.startIndex !== b.startIndex) {
        return a.startIndex - b.startIndex;
      }
      return b.raw.length - a.raw.length;
    });

    // 3. Resolve overlaps (first match wins, remove overlapping matches)
    const nonOverlapping: typeof matches = [];
    let lastEnd = -1;
    for (const candidate of matches) {
      if (candidate.startIndex >= lastEnd) {
        nonOverlapping.push(candidate);
        lastEnd = candidate.endIndex;
      }
    }

    if (nonOverlapping.length === 0) {
      return {
        originalText: text,
        redactedText: text,
        entityMap: {},
        detectedEntities: [],
        hasSensitiveData: false,
      };
    }

    // 4. Build tokenized or masked text and entity map
    const entityCounters: Record<SensitiveEntityType, number> = {
      CARD: 0,
      AADHAAR: 0,
      PAN: 0,
      PHONE: 0,
      EMAIL: 0,
      SSN: 0,
      SECRET: 0,
      HEALTH_ID: 0,
    };

    const entityMap: Record<string, SensitiveEntity> = {};
    const detectedEntities: SensitiveEntity[] = [];

    let redactedText = '';
    let cursor = 0;

    for (const item of nonOverlapping) {
      // Append text preceding the entity
      redactedText += text.substring(cursor, item.startIndex);

      entityCounters[item.pattern.type] += 1;
      const count = entityCounters[item.pattern.type];
      const placeholder = `<${item.pattern.type}_${count}>`;
      const masked = item.pattern.masker(item.raw);

      const entity: SensitiveEntity = {
        type: item.pattern.type,
        raw: item.raw,
        masked,
        placeholder,
        startIndex: item.startIndex,
        endIndex: item.endIndex,
      };

      entityMap[placeholder] = entity;
      detectedEntities.push(entity);

      // Append placeholder or masked text depending on mode
      redactedText += mode === 'tokenize' ? placeholder : masked;
      cursor = item.endIndex;
    }

    // Append remaining tail text
    redactedText += text.substring(cursor);

    return {
      originalText: text,
      redactedText,
      entityMap,
      detectedEntities,
      hasSensitiveData: detectedEntities.length > 0,
    };
  }

  /**
   * Reconstitutes tokenized text by replacing placeholders (<CARD_1>, etc.)
   * with either their original raw value (e.g. for post-translation local display)
   * or their masked representation (e.g. for external socket logging/transmission).
   */
  public restoreSensitiveEntities(
    tokenizedText: string,
    entityMap: Record<string, SensitiveEntity>,
    mode: 'original' | 'masked' = 'original'
  ): string {
    if (!tokenizedText || !entityMap || Object.keys(entityMap).length === 0) {
      return tokenizedText;
    }

    let restored = tokenizedText;
    for (const [placeholder, entity] of Object.entries(entityMap)) {
      const replacement = mode === 'original' ? entity.raw : entity.masked;
      restored = restored.split(placeholder).join(replacement);
    }
    return restored;
  }

  /**
   * Quick utility to check if string contains sensitive PII or credentials
   */
  public containsSensitiveData(text: string): boolean {
    const result = this.redactSensitiveEntities(text, { mode: 'mask' });
    return result.hasSensitiveData;
  }
}

export const privacyTokenizationService = new PrivacyTokenizationService();
