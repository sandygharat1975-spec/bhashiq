import React, { useState, useEffect } from 'react';
import { Mic, Volume2, Sparkles, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupportedLanguage } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/mockData';
import { speechService } from '../../services/speechService';

interface PracticeItem {
  id: string;
  phrase: string;
  language: SupportedLanguage;
  phonetic: string;
  meaning: string;
}

const PRACTICE_POOL: PracticeItem[] = [
  { id: 'p1', phrase: 'Bonjour', language: 'fr', phonetic: 'bon-zhoor', meaning: 'Good morning / Hello' },
  { id: 'p2', phrase: 'Comment allez-vous ?', language: 'fr', phonetic: 'koh-mahn tah-lay voo', meaning: 'How are you?' },
  { id: 'p3', phrase: 'Buenos días', language: 'es', phonetic: 'bweh-nohs dee-ahs', meaning: 'Good morning' },
  { id: 'p4', phrase: '¿Dónde está el baño?', language: 'es', phonetic: 'dohn-deh ehs-tah ehl bah-nyoh', meaning: 'Where is the bathroom?' },
  { id: 'p5', phrase: 'Arigatō gozaimasu', language: 'ja', phonetic: 'ah-ree-gah-toh goh-zai-mas', meaning: 'Thank you very much' },
  { id: 'p6', phrase: 'नमस्ते, आप कैसे हैं?', language: 'hi', phonetic: 'na-mas-te, aap kai-se hain?', meaning: 'Hello, how are you?' },
  { id: 'p7', phrase: 'तुम्ही कसे आहात?', language: 'mr', phonetic: 'tum-hee ka-se aa-haat?', meaning: 'How are you?' },
];

export const PronunciationAssistant: React.FC = () => {
  const { addXP } = useApp();

  const [selectedItem, setSelectedItem] = useState<PracticeItem>(PRACTICE_POOL[0]);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  const [evaluation, setEvaluation] = useState<{
    accuracy: number;
    matchedWords: string[];
    missedWords: string[];
    extraWords: string[];
    feedback: string;
  } | null>(null);

  // Stop any active speech listening or speaking when unmounting or navigating away
  useEffect(() => {
    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
    };
  }, []);

  const playNativePronunciation = () => {
    speechService.speak(selectedItem.phrase, selectedItem.language, {
      voiceGender: 'female',
      rate: 0.9,
      tone: 'natural'
    });
  };

  const startPracticeAttempt = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setSpokenTranscript('');
    setEvaluation(null);

    speechService.startListening(
      selectedItem.language,
      (transcript, isFinal) => {
        setSpokenTranscript(transcript);
        if (isFinal) {
          setIsListening(false);
          const result = speechService.evaluatePronunciation(selectedItem.phrase, transcript);
          setEvaluation(result);

          if (result.accuracy >= 80) {
            addXP(25, 'Pronunciation test passed with high score');
          } else {
            addXP(10, 'Pronunciation practice completed');
          }
        }
      },
      (err) => {
        console.warn('Speech error:', err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const retry = () => {
    setSpokenTranscript('');
    setEvaluation(null);
    startPracticeAttempt();
  };

  return (
    <div className="w-full space-y-5 animate-fade-in">
      {/* Header */}
      <div className="p-4 sm:p-5 rounded-2xl cyber-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
              <Mic className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              AI Pronunciation Coach
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-800">
              Interactive Acoustic Evaluation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Listen to native phonetic pronunciation, speak into the mic, and get AI evaluation on accuracy, cadence, and syllable matching.
          </p>
        </div>
      </div>

      {/* Phrase Selection Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Practice Target:</span>
        {PRACTICE_POOL.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setSelectedItem(item);
              setSpokenTranscript('');
              setEvaluation(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedItem.id === item.id 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400 text-slate-950 shadow-md shadow-amber-500/25 font-black' 
                : 'bg-white border-slate-200 text-slate-700 hover:border-amber-400'
            }`}
          >
            <span>{SUPPORTED_LANGUAGES.find(l => l.code === item.language)?.flag}</span> {item.phrase}
          </button>
        ))}
      </div>

      {/* Main Pronunciation Card */}
      <div className="p-8 rounded-3xl cyber-card-glow text-center space-y-5">
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
            Target Word / Phrase ({SUPPORTED_LANGUAGES.find(l => l.code === selectedItem.language)?.name})
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-wide">
            {selectedItem.phrase}
          </h2>
          <p className="text-sm text-cyan-800 font-mono font-bold">
            Phonetic Guide: <span className="bg-cyan-50 px-3 py-1 rounded-lg border border-cyan-200 text-cyan-900">{selectedItem.phonetic}</span>
          </p>
          <p className="text-xs text-slate-500 font-medium">Semantic Meaning: {selectedItem.meaning}</p>
        </div>

        {/* Native Pronunciation Button */}
        <div className="flex items-center justify-center space-x-3 pt-2">
          <button
            onClick={playNativePronunciation}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-cyan-600/25 transition-all active:scale-95"
          >
            <Volume2 className="w-4 h-4" />
            <span>Hear Native Pronunciation</span>
          </button>
        </div>

        {/* Mic Speaking Action */}
        <div className="pt-4 flex flex-col items-center">
          <button
            onClick={startPracticeAttempt}
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 ${
              isListening 
                ? 'bg-rose-600 text-white animate-pulse ring-8 ring-rose-500/20 shadow-rose-600/40' 
                : 'bg-gradient-to-tr from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-amber-500/25'
            }`}
          >
            <Mic className="w-10 h-10" />
          </button>
          <span className="text-xs font-bold text-slate-700 mt-3">
            {isListening ? 'Listening to your pronunciation... Speak now!' : 'Click Mic & Repeat Phrase Aloud'}
          </span>
        </div>

        {spokenTranscript && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 max-w-md mx-auto">
            You said: <strong className="text-slate-950 font-bold">"{spokenTranscript}"</strong>
          </div>
        )}
      </div>

      {/* AI Pronunciation Evaluation Results (Page 6 of PDF) */}
      {evaluation && (
        <div className="p-6 rounded-3xl cyber-card space-y-4 animate-fade-in shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-sm">AI Evaluation Breakdown</h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-black font-mono ${
                evaluation.accuracy >= 80 ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {evaluation.accuracy}%
              </span>
              <span className="text-[11px] text-slate-500 font-bold">Accuracy</span>
            </div>
          </div>

          {/* Progress Meter Bar */}
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
            <div 
              className={`h-full transition-all duration-700 ${
                evaluation.accuracy >= 80 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{ width: `${evaluation.accuracy}%` }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Matched Words */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="flex items-center gap-1 font-bold text-emerald-800 mb-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Words Matched ({evaluation.matchedWords.length})
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {evaluation.matchedWords.length > 0 ? evaluation.matchedWords.map((w, idx) => (
                  <span key={idx} className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-200">
                    {w}
                  </span>
                )) : <span className="text-slate-500 italic">None</span>}
              </div>
            </div>

            {/* Missed Words */}
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
              <span className="flex items-center gap-1 font-bold text-rose-800 mb-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Words Missed ({evaluation.missedWords.length})
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {evaluation.missedWords.length > 0 ? evaluation.missedWords.map((w, idx) => (
                  <span key={idx} className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-900 font-bold text-xs border border-rose-200">
                    {w}
                  </span>
                )) : <span className="text-slate-500 italic">No missed words!</span>}
              </div>
            </div>
          </div>

          {/* AI Feedback & Retry */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-700">
              💡 <strong>AI Feedback:</strong> {evaluation.feedback}
            </p>

            <button
              onClick={retry}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-violet-600/20 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Practice</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
