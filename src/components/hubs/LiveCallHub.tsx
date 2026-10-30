import React, { useState, useEffect } from 'react';
import { PhoneCall, Users, Radio, Sparkles } from 'lucide-react';
import { LiveCallTranslator } from '../call/LiveCallTranslator';
import { ConversationMode } from '../call/ConversationMode';
import { SpeakerIdMode } from '../call/SpeakerIdMode';
import { useApp } from '../../context/AppContext';

export const LiveCallHub: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  // Determine initial submode based on activeTab
  const getSubMode = (): 'phone' | 'face-to-face' | 'group' => {
    if (activeTab === 'conversation') return 'face-to-face';
    if (activeTab === 'multi-speaker') return 'group';
    return 'phone';
  };

  const [subMode, setSubMode] = useState<'phone' | 'face-to-face' | 'group'>(getSubMode());

  useEffect(() => {
    if (activeTab === 'conversation') setSubMode('face-to-face');
    else if (activeTab === 'multi-speaker') setSubMode('group');
    else if (activeTab === 'live-call') setSubMode('phone');
  }, [activeTab]);

  const handleSelectMode = (mode: 'phone' | 'face-to-face' | 'group') => {
    setSubMode(mode);
    if (mode === 'phone') setActiveTab('live-call');
    else if (mode === 'face-to-face') setActiveTab('conversation');
    else if (mode === 'group') setActiveTab('multi-speaker');
  };

  return (
    <div className="w-full space-y-5">
      {/* Sleek Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ml-2" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            Live Voice Calling Workspace:
          </span>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100/90 p-1 rounded-xl text-xs font-bold border border-slate-200">
          <button
            onClick={() => handleSelectMode('phone')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
              subMode === 'phone'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25 ring-1 ring-violet-400/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Phone Call</span>
            <span className="ml-1 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider rounded bg-cyan-300 text-slate-900">
              USP
            </span>
          </button>

          <button
            onClick={() => handleSelectMode('face-to-face')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
              subMode === 'face-to-face'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/25 ring-1 ring-teal-400/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-teal-600" />
            <span>Face-to-Face</span>
          </button>

          <button
            onClick={() => handleSelectMode('group')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
              subMode === 'group'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25 ring-1 ring-indigo-400/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-indigo-600" />
            <span>Group Discussion</span>
          </button>
        </div>
      </div>

      {/* Render active sub-tool */}
      <div className="animate-fade-in w-full">
        {subMode === 'phone' && <LiveCallTranslator />}
        {subMode === 'face-to-face' && <ConversationMode />}
        {subMode === 'group' && <SpeakerIdMode />}
      </div>
    </div>
  );
};
