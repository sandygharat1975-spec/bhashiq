import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Copy, 
  Bookmark, 
  Share2, 
  Check, 
  ArrowRightLeft, 
  Sparkles, 
  Activity, 
  AlertCircle, 
  Play, 
  Radio, 
  CheckCircle2, 
  Flame,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupportedLanguage } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/mockData';
import { speechService } from '../../services/speechService';
import { translateText } from '../../services/translationService';

// Real-world instant voice test scenarios
const QUICK_VOICE_PROMPTS = [
  { text: 'नमस्ते, मुझे अस्पताल जाना है', lang: 'hi' as SupportedLanguage, label: '🇮🇳 Hospital (Hindi)' },
  { text: 'मला रेल्वे स्टेशनला जायचे आहे', lang: 'mr' as SupportedLanguage, label: '🇮🇳 Train (Marathi)' },
  { text: 'Where is the nearest medical store?', lang: 'en' as SupportedLanguage, label: '🇬🇧 Pharmacy (English)' },
  { text: '¿Dónde está la estación de metro?', lang: 'es' as SupportedLanguage, label: '🇪🇸 Metro (Spanish)' },
  { text: 'すみません、道に迷いました', lang: 'ja' as SupportedLanguage, label: '🇯🇵 Lost (Japanese)' },
  { text: 'Bonjour, où est le musée du Louvre?', lang: 'fr' as SupportedLanguage, label: '🇫🇷 Museum (French)' },
];

export const SpeechTranslator: React.FC = () => {
  const { user, saveWordToBank, addXP } = useApp();

  const [fromLang, setFromLang] = useState<SupportedLanguage>('hi');
  const [toLang, setToLang] = useState<SupportedLanguage>('en');

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [voiceDetected, setVoiceDetected] = useState<boolean>(false);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);

  const [originalSpeech, setOriginalSpeech] = useState<string>('मुझे अस्पताल जाना है');
  const [translatedSpeech, setTranslatedSpeech] = useState<string>('I need to go to the hospital.');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isSpeakingTranslated, setIsSpeakingTranslated] = useState<boolean>(false);
  const [isSpeakingOriginal, setIsSpeakingOriginal] = useState<boolean>(false);
  const [testingAudioOutput, setTestingAudioOutput] = useState<boolean>(false);

  // Stop any active speech listening or speaking when unmounting or navigating away
  useEffect(() => {
    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
    };
  }, []);

  // Listen to translated speech with fail-safe audio
  const handleListenTranslated = () => {
    if (!translatedSpeech || !translatedSpeech.trim()) return;

    if (isSpeakingTranslated) {
      speechService.stopSpeaking();
      setIsSpeakingTranslated(false);
      return;
    }

    setIsSpeakingTranslated(true);
    speechService.speak(translatedSpeech, toLang, {
      voiceGender: user.voiceGender,
      rate: user.voiceSpeed,
      tone: user.voiceTone,
      onEnd: () => setIsSpeakingTranslated(false),
      onError: () => setIsSpeakingTranslated(false),
    });
  };

  // Listen to original speech
  const handleListenOriginal = () => {
    if (!originalSpeech || !originalSpeech.trim()) return;

    if (isSpeakingOriginal) {
      speechService.stopSpeaking();
      setIsSpeakingOriginal(false);
      return;
    }

    setIsSpeakingOriginal(true);
    speechService.speak(originalSpeech, fromLang, {
      voiceGender: user.voiceGender,
      rate: user.voiceSpeed,
      tone: user.voiceTone,
      onEnd: () => setIsSpeakingOriginal(false),
      onError: () => setIsSpeakingOriginal(false),
    });
  };

  // Instant speaker output diagnostic test
  const handleTestSpeakerOutput = async () => {
    if (testingAudioOutput) return;
    setTestingAudioOutput(true);
    await speechService.testSpeaker(toLang, () => setTestingAudioOutput(false));
    setTimeout(() => setTestingAudioOutput(false), 2600);
  };

  // Microphone toggle with real-time volume detection
  const toggleRecording = () => {
    if (isRecording) {
      speechService.stopListening();
      setIsRecording(false);
      setMicVolume(0);
      setVoiceDetected(false);
      return;
    }

    setMicErrorMessage(null);
    setIsRecording(true);

    speechService.startListening(
      fromLang,
      async (transcript, isFinal) => {
        setOriginalSpeech(transcript);
        if (isFinal) {
          setIsRecording(false);
          setMicVolume(0);
          setVoiceDetected(false);
          setIsTranslating(true);
          const res = await translateText(transcript, fromLang, toLang);
          setTranslatedSpeech(res.translatedText);
          setIsTranslating(false);
          addXP(15, 'Live Speech Translated');

          // Auto play translated voice
          speechService.speak(res.translatedText, toLang, {
            voiceGender: user.voiceGender,
            rate: user.voiceSpeed,
            tone: user.voiceTone,
            onEnd: () => setIsSpeakingTranslated(false),
            onError: () => setIsSpeakingTranslated(false),
          });
        }
      },
      (err) => {
        console.warn('Speech recognition error:', err);
        setMicErrorMessage(err);
        setIsRecording(false);
        setMicVolume(0);
        setVoiceDetected(false);
      },
      () => {
        setIsRecording(false);
        setMicVolume(0);
        setVoiceDetected(false);
      },
      (vol, active) => {
        setMicVolume(vol);
        setVoiceDetected(active);
      }
    );
  };

  const handleManualTranslate = async () => {
    if (!originalSpeech.trim()) return;
    setIsTranslating(true);
    const res = await translateText(originalSpeech, fromLang, toLang);
    setTranslatedSpeech(res.translatedText);
    setIsTranslating(false);
    addXP(10, 'Text translated');

    speechService.speak(res.translatedText, toLang, {
      voiceGender: user.voiceGender,
      rate: user.voiceSpeed,
      tone: user.voiceTone,
      onEnd: () => setIsSpeakingTranslated(false),
      onError: () => setIsSpeakingTranslated(false),
    });
  };

  // Quick Prompt Sample Click
  const handleQuickPromptClick = async (sampleText: string, sampleLang: SupportedLanguage) => {
    setFromLang(sampleLang);
    setOriginalSpeech(sampleText);
    setIsTranslating(true);
    const res = await translateText(sampleText, sampleLang, toLang);
    setTranslatedSpeech(res.translatedText);
    setIsTranslating(false);
    addXP(10, 'Sample scenario translated');

    // Automatically speak the translation
    setIsSpeakingTranslated(true);
    speechService.speak(res.translatedText, toLang, {
      voiceGender: user.voiceGender,
      rate: user.voiceSpeed,
      tone: user.voiceTone,
      onEnd: () => setIsSpeakingTranslated(false),
      onError: () => setIsSpeakingTranslated(false),
    });
  };

  const copyToClipboard = () => {
    if (!translatedSpeech) return;
    navigator.clipboard?.writeText(translatedSpeech);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveToVocab = () => {
    if (!originalSpeech || !translatedSpeech) return;
    saveWordToBank({
      originalText: originalSpeech,
      translatedText: translatedSpeech,
      fromLang,
      toLang,
      context: 'Speech Translator',
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const swap = () => {
    const temp = fromLang;
    setFromLang(toLang);
    setToLang(temp);
    setOriginalSpeech(translatedSpeech);
    setTranslatedSpeech(originalSpeech);
  };

  return (
    <div className="w-full space-y-5 animate-fade-in">
      
      {/* Expansive Header Banner on White Canvas */}
      <div className="p-4 sm:p-5 rounded-2xl cyber-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700">
              <Mic className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              AI Live Voice & Speech Studio
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 border border-cyan-200 text-cyan-800">
              Dual-Engine TTS Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time microphone speech recognition, high-fidelity neural translation, and multi-lingual voice synthesis.
          </p>
        </div>

        {/* Global Language Selector Pills */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs shadow-xs">
            <span className="text-slate-500 font-medium">Input:</span>
            <select
              value={fromLang}
              onChange={(e) => setFromLang(e.target.value as SupportedLanguage)}
              className="bg-transparent text-slate-800 font-bold outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.code} className="bg-white text-slate-900">
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={swap} 
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-violet-700 transition-all border border-slate-200 shadow-xs"
            title="Swap input and output languages"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs shadow-xs">
            <span className="text-slate-500 font-medium">Speak in:</span>
            <select
              value={toLang}
              onChange={(e) => setToLang(e.target.value as SupportedLanguage)}
              className="bg-transparent text-violet-700 font-bold outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.code} className="bg-white text-slate-900">
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Studio 12-Column Responsive Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* Left 8 Columns: Main Studio Workspace */}
        <div className="xl:col-span-8 space-y-5">
          
          {/* Microphone & Voice Interaction Card */}
          <div className="p-6 sm:p-8 rounded-3xl cyber-card-glow relative overflow-hidden text-center space-y-6">
            
            {/* Background Soundwave Glow Effect when speaking */}
            {isRecording && (
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-cyan-500/10 to-violet-500/5 pointer-events-none animate-pulse" />
            )}

            {/* Top Status Bar inside Recording Area */}
            <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
                <span className="font-semibold text-slate-700">
                  {isRecording ? 'Microphone Active — Listening' : 'Voice Input Console'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500">Target Language:</span>
                <span className="px-2 py-0.5 rounded-md bg-violet-50 border border-violet-200 text-violet-800 font-mono font-bold text-[11px]">
                  {SUPPORTED_LANGUAGES.find(l => l.code === toLang)?.name}
                </span>
              </div>
            </div>

            {/* Glowing Big Mic Console */}
            <div className="flex flex-col items-center justify-center space-y-4 py-2">
              <div className="relative">
                {/* Expanding pulsing rings when active */}
                {isRecording && (
                  <>
                    <div className="absolute -inset-4 rounded-full bg-rose-500/15 animate-ping pointer-events-none" />
                    <div className="absolute -inset-8 rounded-full bg-violet-600/10 animate-pulse pointer-events-none" />
                  </>
                )}

                <button
                  onClick={toggleRecording}
                  className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl active:scale-95 group ${
                    isRecording 
                      ? 'bg-gradient-to-tr from-rose-600 to-pink-600 text-white ring-8 ring-rose-500/20 shadow-rose-600/40' 
                      : 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white shadow-violet-600/30 ring-4 ring-violet-500/20'
                  }`}
                  title={isRecording ? 'Click to Stop Recording' : 'Click to Speak'}
                >
                  {isRecording ? (
                    <MicOff className="w-11 h-11 animate-pulse" />
                  ) : (
                    <Mic className="w-11 h-11 group-hover:scale-110 transition-transform" />
                  )}
                </button>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {isRecording 
                    ? `Listening in ${SUPPORTED_LANGUAGES.find(l => l.code === fromLang)?.name}...` 
                    : 'Click Microphone & Speak'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isRecording 
                    ? 'Speak clearly into your mic. Translation will automatically generate.' 
                    : 'Tap to speak aloud, or choose a one-click demo phrase below'}
                </p>
              </div>

              {/* Real-time Dynamic Equalizer Bars */}
              {isRecording && (
                <div className="flex items-center justify-center space-x-1.5 h-8 pt-2">
                  <span className="w-1.5 bg-cyan-500 rounded-full animate-soundwave-1" />
                  <span className="w-1.5 bg-violet-500 rounded-full animate-soundwave-2" />
                  <span className="w-1.5 bg-pink-500 rounded-full animate-soundwave-3" />
                  <span className="w-1.5 bg-cyan-500 rounded-full animate-soundwave-4" />
                  <span className="w-1.5 bg-violet-500 rounded-full animate-soundwave-5" />
                  <span className="text-[11px] text-violet-700 font-mono font-bold ml-2">
                    {voiceDetected ? `Voice Signal: ${micVolume}%` : 'Waiting for voice...'}
                  </span>
                </div>
              )}

              {/* Mic Error Banner if permission or network blocked */}
              {micErrorMessage && (
                <div className="w-full max-w-lg p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2 text-left">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{micErrorMessage}</span>
                </div>
              )}
            </div>

            {/* Quick-Voice Demo Prompts Bar (Guarantees instant testing in 1 click) */}
            <div className="pt-3 border-t border-slate-100 text-left">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Instant Test Prompts (1-Click Voice & Translation):
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_VOICE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickPromptClick(prompt.text, prompt.lang)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-violet-300 text-slate-700 text-xs font-medium transition-all shadow-xs flex items-center space-x-1.5"
                  >
                    <span>{prompt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Split Translation Workspace: Input & Output Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Input Speech / Text Card */}
            <div className="p-5 rounded-2xl cyber-card space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{SUPPORTED_LANGUAGES.find(l => l.code === fromLang)?.flag}</span>
                    <span>Spoken Input ({SUPPORTED_LANGUAGES.find(l => l.code === fromLang)?.name})</span>
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                    Editable Text
                  </span>
                </div>

                <textarea
                  value={originalSpeech}
                  onChange={(e) => setOriginalSpeech(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white focus:ring-1 focus:ring-violet-500/30 transition-all resize-none font-medium mt-3"
                  placeholder="Speak through microphone or type here..."
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={handleManualTranslate}
                  disabled={isTranslating || !originalSpeech.trim()}
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-600/20 transition-all disabled:opacity-50"
                >
                  {isTranslating ? 'Translating...' : 'Translate Input'}
                </button>

                <button
                  onClick={handleListenOriginal}
                  className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all ${
                    isSpeakingOriginal
                      ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-400/30'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  title="Listen to original speech audio"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isSpeakingOriginal ? 'animate-bounce text-rose-600' : 'text-slate-500'}`} />
                  <span>{isSpeakingOriginal ? 'Speaking...' : 'Listen'}</span>
                </button>
              </div>
            </div>

            {/* Translated Output Card */}
            <div className="p-5 rounded-2xl cyber-card-glow space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-violet-700 border-b border-slate-100 pb-2">
                  <span className="font-bold flex items-center gap-1.5">
                    <span>{SUPPORTED_LANGUAGES.find(l => l.code === toLang)?.flag}</span>
                    <span>Translation ({SUPPORTED_LANGUAGES.find(l => l.code === toLang)?.name})</span>
                  </span>
                  <span className="text-[10px] bg-violet-100 text-violet-800 border border-violet-200 px-2 py-0.5 rounded-full font-bold">
                    Dual-Engine Audio
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-base font-bold min-h-[105px] mt-3 flex items-center">
                  {translatedSpeech ? (
                    <span>{translatedSpeech}</span>
                  ) : (
                    <span className="text-slate-400 italic font-normal text-sm">
                      Translated output will appear here with voice playback...
                    </span>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                
                {/* Big Primary Listen Button */}
                <button
                  onClick={handleListenTranslated}
                  className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md ${
                    isSpeakingTranslated
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white animate-pulse ring-2 ring-rose-400 shadow-rose-600/30'
                      : 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-cyan-600/25'
                  }`}
                  title="Listen to high-definition translated voice"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeakingTranslated ? 'animate-bounce' : ''}`} />
                  <span>{isSpeakingTranslated ? 'Playing...' : 'Listen'}</span>
                </button>

                <button
                  onClick={copyToClipboard}
                  className="flex items-center justify-center space-x-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all"
                  title="Copy translated text"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: 'Bhashiq Translation', text: `${originalSpeech} -> ${translatedSpeech}` }).catch(() => {});
                    } else {
                      copyToClipboard();
                    }
                  }}
                  className="flex items-center justify-center space-x-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all"
                  title="Share translation"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>

                <button
                  onClick={saveToVocab}
                  className={`flex items-center justify-center space-x-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    savedSuccess
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200'
                  }`}
                  title="Save to Personal Vocabulary Bank (+15 XP)"
                >
                  {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                  <span>{savedSuccess ? 'Saved!' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Companion & Diagnostics Panel */}
        <div className="xl:col-span-4 space-y-5">
          
          {/* Audio & Hardware Diagnostic Center */}
          <div className="p-5 rounded-2xl cyber-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-600" /> Audio & Hardware Center
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                Online
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Verify your speakers, sound card, and microphone connection with one-click hardware tests:
            </p>

            {/* Test Sound Button */}
            <div className="space-y-2">
              <button
                onClick={handleTestSpeakerOutput}
                disabled={testingAudioOutput}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  testingAudioOutput
                    ? 'bg-cyan-50 border-cyan-400 text-cyan-800 ring-2 ring-cyan-400/40 animate-pulse'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-cyan-400'
                }`}
              >
                <Volume2 className="w-4 h-4 text-cyan-600" />
                <span>{testingAudioOutput ? 'Playing Test Announcement...' : '🔊 Test Speaker Audio Output'}</span>
              </button>

              <button
                onClick={toggleRecording}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center space-x-2 hover:border-violet-400 transition-all"
              >
                <Mic className="w-4 h-4 text-violet-600" />
                <span>{isRecording ? 'Stop Microphone Test' : '🎤 Check Microphone Input'}</span>
              </button>
            </div>

            {/* Engine Specifications */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex justify-between">
                <span>Audio Engine:</span>
                <span className="text-slate-800 font-medium">Dual-Engine (Proxy + WebSpeech)</span>
              </div>
              <div className="flex justify-between">
                <span>Indic Voice Fallback:</span>
                <span className="text-emerald-700 font-medium">Auto-Synthesized MP3</span>
              </div>
              <div className="flex justify-between">
                <span>Microphone Status:</span>
                <span className={isRecording ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                  {isRecording ? 'Recording (Active)' : 'Standby'}
                </span>
              </div>
            </div>
          </div>

          {/* AI Cultural Nuance & Politeness Radar */}
          <div className="p-5 rounded-2xl cyber-card space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-violet-600" /> Linguistic Nuance Intelligence
              </span>
              <span className="text-[10px] bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full font-bold">
                Context-Aware
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[11px]">Detected Formality:</div>
                <div className="font-bold text-slate-900 mt-0.5">Polite / Formal (आप / Respectful)</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[11px]">Cultural Etiquette:</div>
                <div className="text-slate-600 mt-0.5 leading-relaxed text-[11px]">
                  When translating to Indic languages (Hindi/Marathi), formal verb conjugations ('जाना है') are automatically preserved for respectful social communication.
                </div>
              </div>
            </div>
          </div>

          {/* Session Gamification & Vocab Quick Stats */}
          <div className="p-5 rounded-2xl cyber-card space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" /> Session Progress
              </span>
              <span className="text-[10px] text-amber-700 font-mono font-bold">
                +{user.xp % 100} XP Today
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-lg font-black text-amber-600 font-mono">{user.streak} Days</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Active Streak</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-lg font-black text-cyan-600 font-mono">Level {user.level}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Polyglot Rank</div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
