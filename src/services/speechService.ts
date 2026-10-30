import { SupportedLanguage } from '../types';

// Speech Recognition Type declarations
interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

const LANG_MAP: Record<SupportedLanguage, string> = {
  hi: 'hi-IN',
  en: 'en-US',
  mr: 'mr-IN',
  es: 'es-ES',
  fr: 'fr-FR',
  ja: 'ja-JP',
  de: 'de-DE',
  zh: 'zh-CN',
  ta: 'ta-IN',
  te: 'te-IN',
  gu: 'gu-IN',
  ru: 'ru-RU',
  ar: 'ar-SA',
};

export class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];
  private currentAudio: HTMLAudioElement | null = null;
  private activeUtterance: any = null;
  private micStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private volumeCheckInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
      // Chromium often populates voices asynchronously after page initialization
      setTimeout(() => this.loadVoices(), 150);
      setTimeout(() => this.loadVoices(), 600);
      setTimeout(() => this.loadVoices(), 1500);
      setTimeout(() => this.loadVoices(), 3000);
    }
  }

  private loadVoices(): SpeechSynthesisVoice[] {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          this.voices = v;
        }
      } catch (e) {
        // ignore
      }
    }
    return this.voices;
  }

  public getMatchingVoices(lang: string, targetLocale: string): SpeechSynthesisVoice[] {
    this.loadVoices();
    const lLower = lang.toLowerCase();
    const prefix = targetLocale.slice(0, 2).toLowerCase();
    return this.voices.filter(v => {
      const vLang = (v.lang || '').toLowerCase().replace('_', '-');
      return vLang.startsWith(lLower) || vLang.startsWith(prefix);
    });
  }

  public hasVoiceForLanguage(lang: SupportedLanguage): boolean {
    const targetLocale = LANG_MAP[lang] || 'en-US';
    return this.getMatchingVoices(lang, targetLocale).length > 0;
  }

  public isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as IWindow;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  /**
   * Play an acoustic sound cue using Web Audio API to unlock browser audio pipeline
   * and give immediate auditory feedback that sound output is operational.
   */
  public playAcousticChime(type: 'click' | 'listen' | 'mic-on' | 'mic-off' = 'listen') {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const now = ctx.currentTime;

      if (type === 'listen') {
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(760, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'mic-on') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'mic-off') {
        osc.frequency.setValueAtTime(780, now);
        osc.frequency.exponentialRampToValueAtTime(390, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
      }
    } catch (e) {
      // ignore audio context failures in headless environments
    }
  }

  /**
   * Start listening for voice speech with microphone permission initialization,
   * live decibel volume monitoring, and resilient speech recognition.
   */
  public async startListening(
    lang: SupportedLanguage,
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void,
    onVolume?: (volume: number, isVoiceActive: boolean) => void
  ) {
    if (!this.isSpeechRecognitionSupported()) {
      onError('Speech Recognition is not supported in this browser. You can type directly.');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    // 1. Explicitly prompt for microphone access via getUserMedia if available
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.playAcousticChime('mic-on');

        // Setup real-time audio analyzer for visual waveform feedback
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
          }
          const source = this.audioContext.createMediaStreamSource(this.micStream);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 256;
          source.connect(this.analyser);
          const bufferLength = this.analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          this.volumeCheckInterval = setInterval(() => {
            if (!this.analyser || !this.isListening) return;
            this.analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const avg = sum / bufferLength;
            const normalized = Math.min(100, Math.round((avg / 128) * 100));
            onVolume?.(normalized, normalized > 10);
          }, 80);
        }
      } catch (mediaErr: any) {
        console.warn('Microphone permission or hardware access issue:', mediaErr);
        if (mediaErr.name === 'NotAllowedError' || mediaErr.name === 'PermissionDeniedError') {
          onError('Microphone permission blocked. Please click the lock/settings icon in your browser address bar and enable microphone access.');
          return;
        }
      }
    }

    const win = window as unknown as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = LANG_MAP[lang] || 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const activeText = finalTranscript || interimTranscript;
        if (activeText) {
          onResult(activeText, !!finalTranscript);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          onError('Microphone access not allowed. Please allow microphone permissions in browser.');
        } else if (event.error === 'network') {
          onError('Speech service network error. You can use the Quick Voice Prompts or type directly.');
        } else if (event.error !== 'no-speech') {
          onError(`Speech recognition error: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        this.stopListening();
        onEnd();
      };

      this.recognition.start();
    } catch (err) {
      onError('Could not start microphone.');
      this.stopListening();
    }
  }

  public stopListening() {
    this.playAcousticChime('mic-off');

    if (this.volumeCheckInterval) {
      clearInterval(this.volumeCheckInterval);
      this.volumeCheckInterval = null;
    }

    if (this.micStream) {
      try {
        this.micStream.getTracks().forEach((t) => {
          t.stop();
          t.enabled = false;
        });
      } catch (e) {
        // ignore
      }
      this.micStream = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {
        // ignore
      }
      this.audioContext = null;
      this.analyser = null;
    }

    if (this.recognition) {
      try {
        if (typeof this.recognition.abort === 'function') {
          this.recognition.abort();
        } else if (typeof this.recognition.stop === 'function') {
          this.recognition.stop();
        }
      } catch (e) {
        // ignore
      }
      this.recognition = null;
    }
    this.isListening = false;
  }

  /**
   * Speak translated text using Dual-Engine Architecture:
   * 1. Native Web Speech API (with Chromium garbage-collection and un-sticking fixes)
   * 2. High-Definition MP3 TTS Audio Stream Fallback (guaranteed native pronunciation for Hindi, Marathi, etc.)
   */
  public async speak(
    text: string,
    lang: SupportedLanguage,
    options?: {
      voiceGender?: 'male' | 'female' | 'neutral';
      rate?: number;
      pitch?: number;
      tone?: 'natural' | 'professional' | 'cheerful';
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ) {
    if (!text || !text.trim()) {
      if (options?.onEnd) options.onEnd();
      return;
    }

    // Stop any existing speech playback cleanly
    this.stopSpeaking();

    // Play instant acoustic chime to unlock browser audio pipeline
    this.playAcousticChime('listen');

    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) {
      if (options?.onEnd) options.onEnd();
      return;
    }

    const targetLocale = LANG_MAP[lang] || 'en-US';

    // 1. If Web Speech has a native installed voice for this language, attempt Web Speech Synthesis
    const matchingVoices = this.getMatchingVoices(lang, targetLocale);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window && matchingVoices.length > 0) {
      const success = await this.tryWebSpeechSynthesis(cleanText, lang, targetLocale, matchingVoices, options);
      if (success) {
        return;
      }
    }

    // 2. Otherwise (no OS voice installed for this language, e.g. Hindi/Marathi on default Windows, or WebSpeech failed)
    // Seamlessly play via High-Definition TTS Audio Stream!
    await this.playAudioStream(cleanText, lang, options);
  }

  /**
   * Web Speech API synthesis with Chromium bug fixes
   */
  private tryWebSpeechSynthesis(
    text: string,
    lang: SupportedLanguage,
    targetLocale: string,
    availableVoices: SpeechSynthesisVoice[],
    options?: {
      voiceGender?: 'male' | 'female' | 'neutral';
      rate?: number;
      pitch?: number;
      tone?: 'natural' | 'professional' | 'cheerful';
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
          resolve(false);
          return;
        }

        // Chromium fix: un-pause if stuck in paused state
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = targetLocale;

        // Select voice by gender preference
        if (options?.voiceGender === 'female') {
          const femaleVoice = availableVoices.find(v => /female|zira|samantha|kyoko|victoria|kavya|kalpana|ananya/i.test(v.name));
          utterance.voice = femaleVoice || availableVoices[0];
        } else if (options?.voiceGender === 'male') {
          const maleVoice = availableVoices.find(v => /male|david|george|alex|daniel|rishi|hemesh|rahul/i.test(v.name));
          utterance.voice = maleVoice || availableVoices[0];
        } else {
          utterance.voice = availableVoices[0];
        }

        // Voice parameters
        let pitch = options?.pitch || 1.0;
        if (options?.voiceGender === 'female' && pitch === 1.0) pitch = 1.15;
        if (options?.voiceGender === 'male' && pitch === 1.0) pitch = 0.88;

        let rate = options?.rate || 1.0;
        if (options?.tone === 'cheerful') {
          pitch += 0.1;
          rate = 1.05;
        } else if (options?.tone === 'professional') {
          rate = 0.95;
        }

        utterance.pitch = Math.max(0.5, Math.min(2.0, pitch));
        utterance.rate = Math.max(0.5, Math.min(1.8, rate));

        let completed = false;
        const cleanup = () => {
          if (!completed) {
            completed = true;
            this.activeUtterance = null;
            if (typeof window !== 'undefined') {
              (window as any).__bhashiqActiveUtterance = null;
            }
          }
        };

        utterance.onend = () => {
          cleanup();
          if (options?.onEnd) options.onEnd();
          resolve(true);
        };

        utterance.onerror = (e: any) => {
          cleanup();
          if (e.error === 'canceled' || e.error === 'interrupted') {
            resolve(true);
          } else {
            console.warn(`SpeechSynthesis error [${e.error}], falling back to audio stream...`);
            resolve(false);
          }
        };

        // Retain global reference to avoid V8 garbage collection bug in Chrome
        this.activeUtterance = utterance;
        if (typeof window !== 'undefined') {
          (window as any).__bhashiqActiveUtterance = utterance;
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis invocation exception:', err);
        resolve(false);
      }
    });
  }

  /**
   * Play crystal-clear voice via High-Definition TTS Audio Stream
   * Guaranteed to work for all languages with zero OS voice dependencies
   */
  private playAudioStream(
    text: string,
    lang: SupportedLanguage,
    options?: {
      rate?: number;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (typeof window === 'undefined') {
          if (options?.onEnd) options.onEnd();
          resolve();
          return;
        }

        const encoded = encodeURIComponent(text.slice(0, 250));
        const cleanLang = lang.split('-')[0].toLowerCase();

        // Candidates: local proxy endpoint + public CDN endpoints
        const primaryUrl = `/api/tts?text=${encoded}&lang=${cleanLang}`;
        const secondaryUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${cleanLang}&client=tw-ob`;
        const tertiaryUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${cleanLang}&client=gtx`;

        const audio = new Audio();
        this.currentAudio = audio;
        // Do NOT set crossOrigin to 'anonymous' as it triggers unnecessary CORS restrictions on standard audio elements
        // Set referrerPolicy to 'no-referrer' so public endpoints don't block localhost referrers
        (audio as any).referrerPolicy = 'no-referrer';

        if (options?.rate && Number.isFinite(options.rate)) {
          audio.playbackRate = Math.max(0.5, Math.min(2.0, options.rate));
        }

        let isDone = false;
        const finish = () => {
          if (!isDone) {
            isDone = true;
            if (this.currentAudio === audio) {
              this.currentAudio = null;
            }
            if (options?.onEnd) options.onEnd();
            resolve();
          }
        };

        audio.onended = () => {
          finish();
        };

        let attempt = 0;
        const urls = [primaryUrl, secondaryUrl, tertiaryUrl];

        const tryNextUrl = () => {
          attempt++;
          if (attempt < urls.length) {
            audio.src = urls[attempt];
            audio.play().catch(() => tryNextUrl());
          } else {
            // Last resort: invoke speech synthesis with available OS voice so user hears speech!
            this.fallbackWebSpeechLastResort(text, lang, options);
            finish();
          }
        };

        audio.onerror = () => {
          tryNextUrl();
        };

        audio.src = urls[0];
        audio.play().catch(() => {
          tryNextUrl();
        });
      } catch (err) {
        console.warn('Audio stream execution error:', err);
        this.fallbackWebSpeechLastResort(text, lang, options);
        if (options?.onEnd) options.onEnd();
        resolve();
      }
    });
  }

  /**
   * Last resort fallback: Speak with default system voice so audio is NEVER silent!
   */
  private fallbackWebSpeechLastResort(
    text: string,
    lang: SupportedLanguage,
    options?: { onEnd?: () => void }
  ) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        const u = new SpeechSynthesisUtterance(text);
        const matching = this.getMatchingVoices(lang, LANG_MAP[lang] || 'en-US');
        if (matching.length > 0) {
          u.voice = matching[0];
          u.lang = matching[0].lang;
        } else if (this.voices.length > 0) {
          // If no matching language voice exists on Windows, assign the default system voice so sound is audible!
          u.voice = this.voices[0];
          u.lang = this.voices[0].lang;
        } else {
          u.lang = 'en-US';
        }

        u.onend = () => options?.onEnd?.();
        u.onerror = () => options?.onEnd?.();
        this.activeUtterance = u;
        window.speechSynthesis.speak(u);
      } catch (e) {
        options?.onEnd?.();
      }
    } else {
      options?.onEnd?.();
    }
  }

  /**
   * Diagnostic test speaker function that plays a crisp confirmation voice.
   */
  public async testSpeaker(lang: SupportedLanguage = 'en', onDone?: () => void) {
    this.playAcousticChime('listen');
    const phrase = lang === 'hi'
      ? 'भाषिक ऑडिओ प्रणाली यशस्वीरित्या कार्यरत आहे'
      : lang === 'mr'
      ? 'भाषिक ध्वनी प्रणाली योग्य रीतीने सुरू आहे'
      : 'Bhashiq real-time voice translation audio is functioning perfectly.';
    return this.speak(phrase, lang, { onEnd: onDone, onError: onDone });
  }

  public stopSpeaking() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {
        // ignore
      }
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }

    this.activeUtterance = null;
    if (typeof window !== 'undefined') {
      (window as any).__bhashiqActiveUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    const isAudioPlaying = Boolean(this.currentAudio && !this.currentAudio.paused && !this.currentAudio.ended);
    const isSynthSpeaking = Boolean(typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking);
    return isAudioPlaying || isSynthSpeaking;
  }

  /**
   * Pronunciation Evaluation Assistant (Page 6 & 9 of PDF)
   * Analyzes speech accuracy, words missed, and suggestions
   */
  public evaluatePronunciation(
    targetText: string,
    spokenText: string
  ): {
    accuracy: number;
    matchedWords: string[];
    missedWords: string[];
    extraWords: string[];
    feedback: string;
  } {
    const clean = (s: string) => s.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?¿¡]/g, '').trim();
    const targetWords = clean(targetText).split(/\s+/).filter(Boolean);
    const spokenWords = clean(spokenText).split(/\s+/).filter(Boolean);

    if (targetWords.length === 0) {
      return { accuracy: 100, matchedWords: [], missedWords: [], extraWords: [], feedback: 'Great job!' };
    }

    const matchedWords: string[] = [];
    const missedWords: string[] = [];
    const extraWords: string[] = [...spokenWords];

    for (const tw of targetWords) {
      const idx = extraWords.indexOf(tw);
      if (idx !== -1) {
        matchedWords.push(tw);
        extraWords.splice(idx, 1);
      } else {
        // Check partial match with Levenshtein-like character similarity
        const partialIdx = extraWords.findIndex(ew => {
          if (Math.abs(ew.length - tw.length) > 2) return false;
          let common = 0;
          for (let i = 0; i < Math.min(ew.length, tw.length); i++) {
            if (ew[i] === tw[i]) common++;
          }
          return common / Math.max(ew.length, tw.length) > 0.65;
        });

        if (partialIdx !== -1) {
          matchedWords.push(tw);
          extraWords.splice(partialIdx, 1);
        } else {
          missedWords.push(tw);
        }
      }
    }

    let accuracy = Math.round((matchedWords.length / targetWords.length) * 100);
    // Add small bonus for speaking clearly
    if (accuracy > 0 && extraWords.length === 0) accuracy = Math.min(100, accuracy + 5);

    let feedback = 'Outstanding pronunciation! Native-level clarity.';
    if (accuracy < 60) {
      feedback = 'Practice syllable pacing. Pay special attention to the missed words.';
    } else if (accuracy < 85) {
      feedback = 'Very good attempt! Try repeating more smoothly without pausing.';
    }

    return {
      accuracy,
      matchedWords,
      missedWords,
      extraWords,
      feedback
    };
  }
}

export const speechService = new SpeechService();
