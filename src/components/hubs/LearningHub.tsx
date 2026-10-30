import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Gamepad2, 
  Swords, 
  Bot, 
  BookmarkCheck, 
  BrainCircuit, 
  HeartHandshake 
} from 'lucide-react';
import { LearningDashboard } from '../learning/LearningDashboard';
import { MiniGames } from '../learning/MiniGames';
import { MultiplayerChallenge } from '../learning/MultiplayerChallenge';
import { AITutor } from '../learning/AITutor';
import { VocabularyBank } from '../learning/VocabularyBank';
import { PersonalizedLearning } from '../learning/PersonalizedLearning';
import { LanguageBuddy } from '../learning/LanguageBuddy';
import { useApp } from '../../context/AppContext';

export const LearningHub: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  type SubMode = 'overview' | 'games' | 'arena' | 'ai-tutor' | 'vocab' | 'adaptive' | 'buddy';

  const getSubMode = (): SubMode => {
    switch (activeTab) {
      case 'mini-games': return 'games';
      case 'multiplayer': return 'arena';
      case 'ai-tutor': return 'ai-tutor';
      case 'vocab-bank': return 'vocab';
      case 'adaptive-learning': return 'adaptive';
      case 'language-buddy': return 'buddy';
      default: return 'overview';
    }
  };

  const [subMode, setSubMode] = useState<SubMode>(getSubMode());

  useEffect(() => {
    switch (activeTab) {
      case 'mini-games': setSubMode('games'); break;
      case 'multiplayer': setSubMode('arena'); break;
      case 'ai-tutor': setSubMode('ai-tutor'); break;
      case 'vocab-bank': setSubMode('vocab'); break;
      case 'adaptive-learning': setSubMode('adaptive'); break;
      case 'language-buddy': setSubMode('buddy'); break;
      case 'learning-hub': setSubMode('overview'); break;
    }
  }, [activeTab]);

  const handleSelectMode = (mode: SubMode) => {
    setSubMode(mode);
    switch (mode) {
      case 'overview': setActiveTab('learning-hub'); break;
      case 'games': setActiveTab('mini-games'); break;
      case 'arena': setActiveTab('multiplayer'); break;
      case 'ai-tutor': setActiveTab('ai-tutor'); break;
      case 'vocab': setActiveTab('vocab-bank'); break;
      case 'adaptive': setActiveTab('adaptive-learning'); break;
      case 'buddy': setActiveTab('language-buddy'); break;
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Friendly Segmented Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 cyber-card p-2.5 sm:p-3 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse ml-2" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Gamified Learning Studio:</span>
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto bg-slate-100 p-1 rounded-xl text-xs font-bold max-w-full border border-slate-200 scrollbar-none">
          <button
            onClick={() => handleSelectMode('overview')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              subMode === 'overview'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Overview & Badges</span>
          </button>

          <button
            onClick={() => handleSelectMode('games')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              subMode === 'games'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Mini-Games</span>
          </button>

          <button
            onClick={() => handleSelectMode('arena')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              subMode === 'arena'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>1v1 Arena</span>
          </button>

          <button
            onClick={() => handleSelectMode('ai-tutor')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              subMode === 'ai-tutor'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Tutor</span>
          </button>

          <button
            onClick={() => handleSelectMode('vocab')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              subMode === 'vocab'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Vocab Bank</span>
          </button>

          <button
            onClick={() => handleSelectMode('adaptive')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              subMode === 'adaptive'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Spaced Flashcards</span>
          </button>

          <button
            onClick={() => handleSelectMode('buddy')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              subMode === 'buddy'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Language Buddy</span>
          </button>
        </div>
      </div>

      {/* Render active sub-tool */}
      <div className="animate-fade-in">
        {subMode === 'overview' && <LearningDashboard />}
        {subMode === 'games' && <MiniGames />}
        {subMode === 'arena' && <MultiplayerChallenge />}
        {subMode === 'ai-tutor' && <AITutor />}
        {subMode === 'vocab' && <VocabularyBank />}
        {subMode === 'adaptive' && <PersonalizedLearning />}
        {subMode === 'buddy' && <LanguageBuddy />}
      </div>
    </div>
  );
};
