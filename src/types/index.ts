export type SupportedLanguage = 
  | 'en' // English
  | 'hi' // Hindi
  | 'mr' // Marathi
  | 'es' // Spanish
  | 'fr' // French
  | 'ja' // Japanese
  | 'de' // German
  | 'zh' // Chinese
  | 'ta' // Tamil
  | 'te' // Telugu
  | 'gu' // Gujarati
  | 'ru' // Russian
  | 'ar'; // Arabic

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  speechCode: string;
}

export type UILanguage = 'en' | 'hi' | 'mr' | 'es' | 'fr' | 'ja';

export type NavigationTab = 
  | 'live-call'
  | 'conversation'
  | 'multi-speaker'
  | 'camera-ar'
  | 'document'
  | 'speech'
  | 'text-context'
  | 'pronunciation'
  | 'learning-hub'
  | 'mini-games'
  | 'multiplayer'
  | 'language-buddy'
  | 'vocab-bank'
  | 'ai-tutor'
  | 'adaptive-learning'
  | 'travel'
  | 'emergency'
  | 'analytics'
  | 'viva-hub'
  | 'login';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  role: 'student' | 'translator' | 'traveler' | 'pro' | 'guest';
  xp: number;
  level: number;
  streak: number;
  nativeLanguage: SupportedLanguage;
  learningLanguage: SupportedLanguage;
  token?: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password?: string;
  nativeLanguage: SupportedLanguage;
  learningLanguage: SupportedLanguage;
  role?: 'student' | 'translator' | 'traveler' | 'pro';
}

export interface UserProfile {
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
  xp: number;
  streak: number;
  streakFreezes: number;
  level: number;
  learningLanguage: SupportedLanguage;
  nativeLanguage: SupportedLanguage;
  voiceGender: 'male' | 'female' | 'neutral';
  voiceSpeed: number; // 0.8 - 1.2
  voiceTone: 'natural' | 'professional' | 'cheerful';
  badges: string[];
  savedWordsCount: number;
  dailyGoalProgress: number; // percentage 0-100
  signature?: string;
  isAuthoritative?: boolean;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  xpReward: number;
}

export interface SavedWord {
  id: string;
  originalText: string;
  translatedText: string;
  fromLang: SupportedLanguage;
  toLang: SupportedLanguage;
  context?: string;
  phonetic?: string;
  timestamp: number;
  masteryLevel: number; // 0 to 5
}

export interface CallMessage {
  id: string;
  sender: 'self' | 'peer';
  senderName: string;
  originalText: string;
  translatedText: string;
  fromLang: SupportedLanguage;
  toLang: SupportedLanguage;
  timestamp: string;
  audioPlayed?: boolean;
  redacted?: boolean;
  detectedEntities?: string[];
}

export interface SimulatedCaller {
  id: string;
  name: string;
  avatar: string;
  language: SupportedLanguage;
  languageName: string;
  role: string;
  greetingText: string;
  sampleResponses: { promptTrigger: RegExp | string; responseOriginal: string }[];
}

export interface OCRBoundingBox {
  text: string;
  translatedText: string;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  confidence: number;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  audioText?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TravelCategory {
  id: string;
  name: string;
  icon: string;
  phrases: {
    en: string;
    target: string;
    phonetic: string;
  }[];
}

export type PolitenessLevel = 'formal' | 'informal' | 'neutral';
export type ConversationTone = 'urgent' | 'polite' | 'inquisitive' | 'friendly' | 'neutral';
export type ReviewGrade = 0 | 1 | 2 | 3 | 4 | 5;

export interface RepetitionItem {
  id: string;
  word: string;
  translation: string;
  language: SupportedLanguage;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewDate: number;
  lastReviewedAt?: number;
}

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
}

export interface GPSValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: GPSCoordinates;
}

export interface EmergencyBroadcastPayload {
  id: string;
  timestamp: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  phraseId: string;
  originalText: string;
  translatedText: string;
  targetLang: SupportedLanguage;
  location: GPSCoordinates;
  city?: string;
  country?: string;
  emergencyHelpline: string;
  signature?: string;
}

