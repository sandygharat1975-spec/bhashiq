import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  Sparkles, 
  ArrowRightLeft, 
  CheckCircle2, 
  RefreshCw, 
  Bookmark, 
  Volume2,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupportedLanguage } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/mockData';
import { translateText, performBackTranslation, checkHomonym, checkIdiom } from '../../services/translationService';
import { speechService } from '../../services/speechService';

export const TextContextTranslator: React.FC = () => {
  const { user, saveWordToBank, addXP } = useApp();

  const [fromLang, setFromLang] = useState<SupportedLanguage>('en');
  const [toLang, setToLang] = useState<SupportedLanguage>('hi');

  const [inputText, setInputText] = useState<string>("What's up?");
  const [selectedContext, setSelectedContext] = useState<string>('');
  const [translatedResult, setTranslatedResult] = useState<string>('क्या चल रहा है? / आप कैसे हैं?');

  // Back translation states
  const [backResult, setBackResult] = useState<{
    forwardTranslation: string;
    backTranslation: string;
    fidelityScore: number;
    matchEvaluation: string;
  } | null>({
    forwardTranslation: 'क्या चल रहा है?',
    backTranslation: "What's going on?",
    fidelityScore: 92,
    matchEvaluation: 'High'
  });

  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Stop speaking when component unmounts
  useEffect(() => {
    return () => {
      speechService.stopSpeaking();
    };
  }, []);

  const handleListen = () => {
    if (!translatedResult || !translatedResult.trim()) return;

    if (isSpeaking) {
      speechService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    speechService.speak(translatedResult, toLang, {
      voiceGender: user.voiceGender,
      rate: user.voiceSpeed,
      tone: user.voiceTone,
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // Detect homonym & idiom
  const detectedHomonym = checkHomonym(inputText, toLang);
  const detectedIdiom = checkIdiom(inputText, toLang);

  const handleTranslate = async (overrideContext?: string) => {
    if (!inputText.trim()) return;
    setIsEvaluating(true);

    const activeCtx = overrideContext !== undefined ? overrideContext : selectedContext;
    const res = await translateText(inputText, fromLang, toLang, activeCtx);
    setTranslatedResult(res.translatedText);

    // Perform Back Translation (Page 6 of PDF)
    const back = await performBackTranslation(inputText, fromLang, toLang);
    setBackResult(back);
    setIsEvaluating(false);
    addXP(15, 'Context-aware translation evaluated');
  };

  const handleHomonymContextClick = (contextMeaning: string) => {
    setSelectedContext(contextMeaning);
    handleTranslate(contextMeaning);
  };

  const handleSamplePhrase = (phrase: string) => {
    setInputText(phrase);
    setSelectedContext('');
    setTimeout(() => {
      handleTranslate('');
    }, 100);
  };

  const handleSaveWord = () => {
    saveWordToBank({
      originalText: inputText,
      translatedText: translatedResult,
      fromLang,
      toLang,
      context: selectedContext || (detectedIdiom ? 'Idiom' : 'Context-Aware'),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="w-full space-y-5 animate-fade-in">
      {/* Header */}
      <div className="p-4 sm:p-5 rounded-2xl cyber-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700">
              <BookOpen className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Context-Aware & AI Idiom Translator
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 border border-cyan-200 text-cyan-800">
              Back-Translation Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Detects homonyms (e.g. "Bank"), interprets idiomatic expressions ("What's up?"), and verifies round-trip semantic fidelity.
          </p>
        </div>

        {/* Language selector */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs shadow-xs">
            <span className="text-slate-500 font-medium">Source:</span>
            <select
              value={fromLang}
              onChange={(e) => setFromLang(e.target.value as SupportedLanguage)}
              className="bg-transparent text-slate-900 font-bold outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.code} className="bg-white text-slate-900">{l.flag} {l.name}</option>
              ))}
            </select>
          </div>

          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs shadow-xs">
            <span className="text-slate-500 font-medium">Target:</span>
            <select
              value={toLang}
              onChange={(e) => setToLang(e.target.value as SupportedLanguage)}
              className="bg-transparent text-violet-700 font-bold outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.code} className="bg-white text-slate-900">{l.flag} {l.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Sample Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto text-xs pb-1 scrollbar-none">
        <span className="text-slate-500 font-semibold text-[11px] whitespace-nowrap">Try Realistic Scenarios:</span>
        <button
          onClick={() => handleSamplePhrase("What's up?")}
          className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-cyan-800 font-bold whitespace-nowrap border border-slate-200 shadow-xs transition-all"
        >
          💡 "What's up?" (Slang/Idiom)
        </button>
        <button
          onClick={() => handleSamplePhrase("I need to go to the bank")}
          className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-amber-800 font-bold whitespace-nowrap border border-slate-200 shadow-xs transition-all"
        >
          🏦 "Bank" (Homonym Ambiguity)
        </button>
        <button
          onClick={() => handleSamplePhrase("Piece of cake")}
          className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-emerald-800 font-bold whitespace-nowrap border border-slate-200 shadow-xs transition-all"
        >
          🍰 "Piece of cake" (Idiomatic Phrase)
        </button>
        <button
          onClick={() => handleSamplePhrase("मला कॉलेजला जायचे आहे.")}
          className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-violet-800 font-bold whitespace-nowrap border border-slate-200 shadow-xs transition-all"
        >
          🎓 "कॉलेजला जायचे आहे" (Marathi Test)
        </button>
      </div>

      {/* Main Translation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Source Text Input */}
        <div className="p-5 rounded-2xl cyber-card space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800">
                Input Text ({SUPPORTED_LANGUAGES.find(l => l.code === fromLang)?.name})
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                Source Buffer
              </span>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white focus:ring-1 focus:ring-violet-500/30 transition-all resize-none font-medium mt-3"
              placeholder="Type word, idiom, or sentence here..."
            />
          </div>

          <button
            onClick={() => handleTranslate()}
            disabled={isEvaluating}
            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-violet-600/20 flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            {isEvaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Translate & Analyze Context</span>
          </button>
        </div>

        {/* Translation Output Card */}
        <div className="p-5 rounded-2xl cyber-card-glow space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-violet-700 border-b border-slate-100 pb-2">
              <span className="font-bold">
                Contextual Output ({SUPPORTED_LANGUAGES.find(l => l.code === toLang)?.name})
              </span>
              <span className="text-[10px] bg-violet-100 text-violet-800 border border-violet-200 px-2.5 py-0.5 rounded-full font-bold">
                Smart Filtered
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-base font-bold min-h-[105px] mt-3 flex items-center">
              {translatedResult}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={handleListen}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-black shadow-md transition-all ${
                isSpeaking
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white animate-pulse ring-2 ring-rose-400'
                  : 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-cyan-600/25'
              }`}
              title="Listen to translated output"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-bounce' : ''}`} />
              <span>{isSpeaking ? 'Playing Audio...' : 'Listen Translation'}</span>
            </button>

            <button
              onClick={handleSaveWord}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                savedSuccess
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200'
              }`}
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5 text-white" /> : <Bookmark className="w-3.5 h-3.5" />}
              <span>{savedSuccess ? 'Saved to Bank!' : 'Save Word'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Homonym Context Disambiguation */}
      {detectedHomonym && (
        <div className="p-5 rounded-2xl cyber-card border border-amber-300 space-y-3 shadow-md">
          <div className="flex items-center space-x-2 text-amber-700">
            <HelpCircle className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Context Disambiguation: The word "{detectedHomonym.word}" has multiple meanings!
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Select the intended semantic context to refine the translation:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {detectedHomonym.contexts.map((ctx, cIdx) => {
              const isSelected = selectedContext === ctx.meaning;
              return (
                <button
                  key={cIdx}
                  onClick={() => handleHomonymContextClick(ctx.meaning)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected 
                      ? 'bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-400/50 shadow-md' 
                      : 'bg-white border-slate-200 hover:border-amber-300 text-slate-800 shadow-xs'
                  }`}
                >
                  <div className="font-bold text-xs text-amber-800 mb-1">{ctx.meaning}</div>
                  <div className="text-[11px] text-slate-600 line-clamp-2">{ctx.description}</div>
                  <div className="mt-2 text-xs font-bold text-violet-700 font-mono">→ {ctx.translation}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Context Idiom Detector */}
      {detectedIdiom && (
        <div className="p-5 rounded-2xl cyber-card border border-cyan-300 space-y-2.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
              <Sparkles className="w-4 h-4 text-cyan-600" /> AI Idiomatic Context Detected: "{detectedIdiom.idiomPhrase}"
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-800 border border-cyan-200 px-2.5 py-0.5 rounded-full">
              Colloquialism
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-rose-700 font-bold block mb-0.5">❌ Literal Translation (Avoided):</span>
              <p className="text-rose-900 italic font-medium">"{detectedIdiom.literalTranslation}"</p>
              <span className="text-[10px] text-slate-500">Literal meaning: "{detectedIdiom.literalMeaning}"</span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-emerald-800 font-bold block mb-0.5">✅ Contextual Meaning (Applied):</span>
              <p className="text-emerald-950 font-black">"{detectedIdiom.contextualTranslation}"</p>
              <span className="text-[10px] text-slate-600">Actual meaning: "{detectedIdiom.actualMeaning}"</span>
            </div>
          </div>
        </div>
      )}

      {/* Back-Translation Verification */}
      <div className="p-5 rounded-2xl cyber-card space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-violet-600" /> Back-Translation Semantic Verification
          </h3>
          <span className="text-xs text-slate-500 font-medium">Round-trip linguistic preservation check</span>
        </div>

        {backResult ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className={`w-5 h-5 ${
                  backResult.fidelityScore >= 85 ? 'text-emerald-600' : 'text-amber-600'
                }`} />
                <div>
                  <span className="text-xs font-bold text-slate-900">Semantic Fidelity Score</span>
                  <p className="text-[11px] text-slate-500">Meaning preserved across dual language round-trip</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xl font-black font-mono ${
                  backResult.fidelityScore >= 85 ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {backResult.fidelityScore}%
                </span>
                <span className="block text-[10px] text-slate-500 font-medium">{backResult.matchEvaluation} Quality</span>
              </div>
            </div>

            {/* Step visualization */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">1. Original ({fromLang})</span>
                <p className="font-bold text-slate-900 mt-1">{inputText}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-cyan-50/70 border border-cyan-200 shadow-xs">
                <span className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider">2. Forward Translation ({toLang})</span>
                <p className="font-bold text-cyan-950 mt-1">{backResult.forwardTranslation}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-violet-50/70 border border-violet-200 shadow-xs">
                <span className="text-[10px] font-bold text-violet-800 uppercase tracking-wider">3. Back-Translation ({fromLang})</span>
                <p className="font-bold text-violet-950 mt-1">{backResult.backTranslation}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Click "Translate & Analyze Context" to evaluate back translation fidelity.</p>
        )}
      </div>
    </div>
  );
};
