import DOMPurify from 'dompurify';
import { CallMessage } from '../types';

let activePurifier: any = null;

/**
 * Initializes and returns the active DOMPurify instance across browser and test environments.
 */
function getPurifier(): any {
  if (activePurifier) return activePurifier;

  if (typeof window !== 'undefined') {
    if (typeof (DOMPurify as any).sanitize === 'function') {
      activePurifier = DOMPurify;
    } else if (typeof DOMPurify === 'function') {
      try {
        activePurifier = (DOMPurify as any)(window);
      } catch (e) {
        console.warn('[SanitizationService] Could not initialize DOMPurify with window:', e);
      }
    }
  }

  if (!activePurifier || typeof activePurifier.sanitize !== 'function') {
    activePurifier = {
      sanitize: (dirty: string) => escapeHtml(stripHtmlTags(dirty)),
    };
  }

  return activePurifier;
}

/**
 * Strict HTML entity encoding for user and peer strings.
 * Converts dangerous delimiters into harmless entity representations.
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;');
}

/**
 * Strips all HTML/XML tag markers completely from the text.
 */
export function stripHtmlTags(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Strips dangerous pseudo-protocols like javascript:, data:text/html, vbscript:
 */
export function stripDangerousProtocols(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(
    /(?:javascript|vbscript)\s*:[^"'\s<>]*|data\s*:\s*(?:text\/html|application\/javascript)[^"'\s<>]*/gi,
    '[BLOCKED_PROTOCOL]'
  );
}

/**
 * Strips executable containers like <script>, <style>, <iframe>, <svg> including their interior script payload.
 */
export function stripScriptAndDangerousElements(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<iframe\b[^>]*>/gi, '')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<svg\b[^>]*>/gi, '');
}

export interface SanitizeOptions {
  stripTags?: boolean; // When true (default for transcripts), all HTML tags are removed
  encodeEntities?: boolean; // When true, converts remaining delimiters to HTML entities
}

class SanitizationService {
  /**
   * Sanitizes untrusted plain text (such as peer transcripts, speech recognition output, or user prompts).
   * Runs DOMPurify with strict zero-tag policy and strips executable scripts, event handlers, and protocols.
   */
  public sanitizePlainText(dirtyText: string, options: SanitizeOptions = {}): string {
    if (!dirtyText || typeof dirtyText !== 'string') {
      return '';
    }

    const { stripTags = true, encodeEntities = false } = options;
    const purifier = getPurifier();

    // 1. Defang dangerous protocol handlers
    let sanitized = stripDangerousProtocols(dirtyText);

    // 2. Strip executable container elements and their script contents
    sanitized = stripScriptAndDangerousElements(sanitized);

    // 3. DOMPurify sanitize with strict zero-element whitelist
    if (stripTags) {
      sanitized = purifier.sanitize(sanitized, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
      });
      // Safety net: in case malformed tags bypassed XML parsers
      sanitized = stripHtmlTags(sanitized);
    } else {
      sanitized = purifier.sanitize(sanitized, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'code'],
        ALLOWED_ATTR: ['class', 'title'],
        ALLOW_DATA_ATTR: false,
      });
    }

    // 4. Optional strict HTML entity encoding
    if (encodeEntities) {
      sanitized = escapeHtml(sanitized);
    }

    return sanitized.trim();
  }

  /**
   * Sanitizes all fields in a peer-generated CallMessage before UI rendering or persistence.
   */
  public sanitizeCallMessage(message: CallMessage): CallMessage {
    if (!message || typeof message !== 'object') {
      return message;
    }

    return {
      ...message,
      id: this.sanitizePlainText(message.id),
      senderName: this.sanitizePlainText(message.senderName || 'Anonymous'),
      originalText: this.sanitizePlainText(message.originalText || ''),
      translatedText: this.sanitizePlainText(message.translatedText || ''),
    };
  }

  /**
   * Sanitizes peer participant profiles before injection into user list.
   */
  public sanitizePeerUser<T extends { id: string; userName: string; language: string; role?: string }>(user: T): T {
    if (!user || typeof user !== 'object') {
      return user;
    }

    return {
      ...user,
      id: this.sanitizePlainText(user.id),
      userName: this.sanitizePlainText(user.userName || 'Peer User'),
      language: this.sanitizePlainText(user.language || 'en') as any,
    };
  }
}

export const sanitizationService = new SanitizationService();
