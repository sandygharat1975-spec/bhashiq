import React, { useState, useEffect } from 'react';
import { BookOpen, Volume2, Mic, Sparkles } from 'lucide-react';
import { TextContextTranslator } from '../translator/TextContextTranslator';
import { SpeechTranslator } from '../translator/SpeechTranslator';
import { PronunciationAssistant } from '../translator/PronunciationAssistant';
import { useApp } from '../../context/AppContext';

export const SmartTranslatorHub: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const getSubMode = (): 'context' | 'speech' | 'pronunciation' => {
    if (activeTab === 'speech') return 'speech';
    if (activeTab === 'pronunciation') return 'pronunciation';
    return 'context';
  };

  const [subMode, setSubMode] = useState<'context' | 'speech' | 'pronunciation'>(getSubMode());

  useEffect(() => {
    if (activeTab === 'speech') setSubMode('speech');
    else if (activeTab === 'pronunciation') setSubMode('pronunciation');
    else if (activeTab === 'text-context') setSubMode('context');
  }, [activeTab]);

  const handleSelectMode = (mode: 'context' | 'speech' | 'pronunciation') => {
    setSubMode(mode);
    if (mode === 'context') setActiveTab('text-context');
    else if (mode === 'speech') setActiveTab('speech');
    else if (mode === 'pronunciation') setActiveTab('pronunciation');
  };

  return (
    <div className="w-full space-y-5">
      {/* Sleek Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse ml-2" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            Linguistic AI Studio:
          </span>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100/90 p-1 rounded-xl text-xs font-bold border border-slate-200">
          <button
            onClick={() => handleSelectMode('context')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
              subMode === 'context'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25 ring-1 ring-violet-400/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-violet-300" />
            <span>Context & Idiom AI</span>
          </button>

          <button
            onClick={() => handleSelectMode('speech')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
              subMode === 'speech'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/25 ring-1 ring-cyan-400/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-300" />
            <span>Live Voice & Speech</span>
          </button>

          <button
            onClick={() => handleSelectMode('pronunciation')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
              subMode === 'pronunciation'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/25 ring-1 ring-amber-400/40 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-amber-500" />
            <span>Pronunciation Coach</span>
          </button>
        </div>
      </div>

      {/* Render active sub-tool */}
      <div className="animate-fade-in w-full">
        {subMode === 'context' && <TextContextTranslator />}
        {subMode === 'speech' && <SpeechTranslator />}
        {subMode === 'pronunciation' && <PronunciationAssistant />}
      </div>
    </div>
  );
};
