import React, { useState, useEffect } from 'react';
import { Mic, Volume2, Bookmark, ArrowRightLeft, Users, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupportedLanguage } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/mockData';
import { speechService } from '../../services/speechService';
import { translateLiveCallText } from '../../services/translationService';
import { sanitizationService } from '../../services/sanitizationService';

interface ConversationTurn {
  id: string;
  speaker: 'A' | 'B';
  originalText: string;
  translatedText: string;
  fromLang: SupportedLanguage;
  toLang: SupportedLanguage;
  timestamp: string;
}

export const ConversationMode: React.FC = () => {
  const { user, saveWordToBank, addXP } = useApp();

  const [langA, setLangA] = useState<SupportedLanguage>('hi');
  const [langB, setLangB] = useState<SupportedLanguage>('en');

  // Stop any active speech listening or speaking when unmounting or navigating away
  useEffect(() => {
    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
    };
  }, []);

  const [activeSpeaker, setActiveSpeaker] = useState<'A' | 'B' | null>(null);
  const [interimText, setInterimText] = useState<string>('');

  const [turns, setTurns] = useState<ConversationTurn[]>([
    {
      id: 'turn-1',
      speaker: 'A',
      originalText: 'नमस्ते, आप कैसे हैं?',
      translatedText: 'Hello, how are you?',
      fromLang: 'hi',
      toLang: 'en',
      timestamp: '10:30 AM',
    },
    {
      id: 'turn-2',
      speaker: 'B',
      originalText: 'I am fine, thank you! How is your day going?',
      translatedText: 'मैं ठीक हूँ, धन्यवाद! आपका दिन कैसा बीत रहा है?',
      fromLang: 'en',
      toLang: 'hi',
      timestamp: '10:31 AM',
    }
  ]);

  const startListeningFor = (speaker: 'A' | 'B') => {
    if (activeSpeaker === speaker) {
      speechService.stopListening();
      setActiveSpeaker(null);
      setInterimText('');
      return;
    }

    setActiveSpeaker(speaker);
    const fromLang = speaker === 'A' ? langA : langB;
    const toLang = speaker === 'A' ? langB : langA;

    speechService.startListening(
      fromLang,
      async (transcript, isFinal) => {
        setInterimText(transcript);
        if (isFinal) {
          setActiveSpeaker(null);
          setInterimText('');
          
          const safeTranscript = sanitizationService.sanitizePlainText(transcript);
          const translated = await translateLiveCallText(safeTranscript, fromLang, toLang);
          const newTurn: ConversationTurn = {
            id: `turn-${Date.now()}`,
            speaker,
            originalText: safeTranscript,
            translatedText: sanitizationService.sanitizePlainText(translated.translatedText),
            fromLang,
            toLang,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          setTurns(prev => [...prev, newTurn]);
          addXP(15, 'Conversation turn translated');

          // Auto speak for counterpart
          speechService.speak(translated.translatedText, toLang, {
            voiceGender: user.voiceGender,
            rate: user.voiceSpeed,
            tone: user.voiceTone,
          });
        }
      },
      (err) => {
        console.warn('Speech error:', err);
        setActiveSpeaker(null);
        setInterimText('');
      },
      () => {
        setActiveSpeaker(null);
      }
    );
  };

  const swapLanguages = () => {
    const temp = langA;
    setLangA(langB);
    setLangB(temp);
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-panel flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900">Live Conversation Interpreter</h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Two people sitting face-to-face. Tap either speaker to speak and have it translated aloud.
          </p>
        </div>

        {/* Language Pair Selectors */}
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-xs">
          <select
            value={langA}
            onChange={(e) => setLangA(e.target.value as SupportedLanguage)}
            className="bg-transparent text-slate-800 outline-none font-semibold cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
            ))}
          </select>

          <button onClick={swapLanguages} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>

          <select
            value={langB}
            onChange={(e) => setLangB(e.target.value as SupportedLanguage)}
            className="bg-transparent text-slate-800 outline-none font-semibold cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Two-Person Dual Push-To-Talk Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Person A Card */}
        <div className={`p-5 rounded-2xl border transition-all ${
          activeSpeaker === 'A' 
            ? 'bg-blue-50 border-blue-500 shadow-md shadow-blue-500/10' 
            : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <span className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-sm font-black text-blue-700">
                A
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Speaker A</h3>
                <span className="text-[11px] text-slate-500">
                  {SUPPORTED_LANGUAGES.find(l => l.code === langA)?.name}
                </span>
              </div>
            </div>
            {activeSpeaker === 'A' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white animate-pulse">
                Listening...
              </span>
            )}
          </div>

          <button
            onClick={() => startListeningFor('A')}
            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-98 ${
              activeSpeaker === 'A'
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>{activeSpeaker === 'A' ? 'Stop Speaking' : 'Tap to Speak (Speaker A)'}</span>
          </button>
        </div>

        {/* Person B Card */}
        <div className={`p-5 rounded-2xl border transition-all ${
          activeSpeaker === 'B' 
            ? 'bg-emerald-50 border-emerald-500 shadow-md shadow-emerald-500/10' 
            : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <span className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-sm font-black text-emerald-700">
                B
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Speaker B</h3>
                <span className="text-[11px] text-slate-500">
                  {SUPPORTED_LANGUAGES.find(l => l.code === langB)?.name}
                </span>
              </div>
            </div>
            {activeSpeaker === 'B' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white animate-pulse">
                Listening...
              </span>
            )}
          </div>

          <button
            onClick={() => startListeningFor('B')}
            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-98 ${
              activeSpeaker === 'B'
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>{activeSpeaker === 'B' ? 'Stop Speaking' : 'Tap to Speak (Speaker B)'}</span>
          </button>
        </div>
      </div>

      {/* Interim Transcribing text */}
      {interimText && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs animate-pulse flex items-center justify-between shadow-xs">
          <span>Speaker {activeSpeaker} is speaking: "{interimText}"</span>
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
        </div>
      )}

      {/* Transcript Log */}
      <div className="p-5 rounded-2xl glass-panel space-y-3">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2.5">
          Conversation Stream Log
        </h3>

        <div className="space-y-3 max-h-[380px] overflow-y-auto">
          {turns.map((turn) => {
            const isA = turn.speaker === 'A';
            return (
              <div
                key={turn.id}
                className={`p-4 rounded-xl border flex flex-col space-y-2 transition-all shadow-xs ${
                  isA 
                    ? 'bg-blue-50/60 border-blue-200 ml-0 md:mr-12' 
                    : 'bg-emerald-50/60 border-emerald-200 mr-0 md:ml-12'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      isA ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      Speaker {turn.speaker}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">{turn.timestamp}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => saveWordToBank({
                        originalText: turn.originalText,
                        translatedText: turn.translatedText,
                        fromLang: turn.fromLang,
                        toLang: turn.toLang,
                        context: 'Conversation Interpreter'
                      })}
                      className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-white transition-colors"
                      title="Save to Vocabulary"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => speechService.speak(turn.translatedText, turn.toLang, {
                        voiceGender: user.voiceGender,
                        rate: user.voiceSpeed,
                        tone: user.voiceTone,
                      })}
                      className="p-1 rounded-md text-blue-600 hover:text-blue-800 hover:bg-white transition-colors"
                      title="Play Translation Voice"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Original vs Translated */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="bg-white/80 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Original</span>
                    <p className="text-slate-800 text-sm font-medium">{turn.originalText}</p>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-blue-600 block mb-0.5">Translation</span>
                    <p className="text-slate-900 text-sm font-bold">{turn.translatedText}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
