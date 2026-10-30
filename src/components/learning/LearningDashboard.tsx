import React from 'react';
import { 
  Flame, 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  ChevronRight,
  Target
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SUPPORTED_LANGUAGES } from '../../data/mockData';
import { SupportedLanguage } from '../../types';

export const LearningDashboard: React.FC = () => {
  const { user, badges, savedWords, setLearningLanguage, setActiveTab } = useApp();

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === user.learningLanguage) || SUPPORTED_LANGUAGES[3];

  return (
    <div className="w-full space-y-6 animate-fade-in">
      
      {/* Top Banner / User Hero */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-md border border-white/20">
              🎓
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-white">{user.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                  Level {user.level} Polyglot
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-1">
                Learning Language: <strong className="text-white">{currentLang.flag} {currentLang.name}</strong> • Native: {SUPPORTED_LANGUAGES.find(l => l.code === user.nativeLanguage)?.name}
              </p>
            </div>
          </div>

          {/* Quick Language Switch */}
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 text-xs">
            <span className="text-blue-100 pl-1 font-medium">Switch Focus:</span>
            <select
              value={user.learningLanguage}
              onChange={(e) => setLearningLanguage(e.target.value as SupportedLanguage)}
              className="bg-white text-slate-800 rounded-xl px-3 py-1 font-bold outline-none cursor-pointer shadow-xs"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4 Stat Metric Cards (Directly matching PDF Page 7) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Learning Progress */}
        <div className="p-5 rounded-2xl glass-panel space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>{currentLang.name} Progress</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">80%</div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full w-[80%]" />
          </div>
          <span className="text-[10px] text-slate-500 block font-mono font-semibold">████████░░ 80% Complete</span>
        </div>

        {/* Metric 2: Vocabulary Words */}
        <div className="p-5 rounded-2xl glass-panel space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Vocabulary Bank</span>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{342 + savedWords.length}</div>
          <span className="text-xs text-emerald-600 font-bold">+12 words this week</span>
          <span className="text-[10px] text-slate-500 block font-medium">Personal saved flashcards</span>
        </div>

        {/* Metric 3: Day Streak */}
        <div className="p-5 rounded-2xl glass-panel space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Daily Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 flex items-center gap-1.5">
            <span>{user.streak} Days</span>
            <span className="text-base">🔥</span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] font-semibold">{user.streakFreezes} Streak Shields Active</span>
          </div>
          <span className="text-[10px] text-slate-500 block font-medium">Practice today to maintain streak</span>
        </div>

        {/* Metric 4: XP Earned */}
        <div className="p-5 rounded-2xl glass-panel space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Total XP Points</span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{user.xp.toLocaleString()} XP</div>
          <span className="text-xs text-blue-600 font-bold">Next level at {user.level * 1000} XP</span>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full" 
              style={{ width: `${(user.xp % 1000) / 10}%` }} 
            />
          </div>
        </div>

      </div>

      {/* Gamification Actions / Quick Play Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveTab('mini-games')}
          className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-left hover:border-indigo-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🎮</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">+30 XP</span>
          </div>
          <h3 className="font-bold text-slate-900 text-base mt-2.5 group-hover:text-indigo-600 transition-colors">
            Mini Games & Quizzes
          </h3>
          <p className="text-xs text-slate-600 mt-1">Word Match, Listening Challenges, Translation Race</p>
          <div className="flex items-center text-xs text-indigo-600 font-bold mt-3.5">
            <span>Play Now</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab('multiplayer')}
          className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 text-left hover:border-rose-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">⚔️</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">+100 XP</span>
          </div>
          <h3 className="font-bold text-slate-900 text-base mt-2.5 group-hover:text-rose-600 transition-colors">
            1v1 Multiplayer Arena
          </h3>
          <p className="text-xs text-slate-600 mt-1">Compete head-to-head in rapid 10-question language duels</p>
          <div className="flex items-center text-xs text-rose-600 font-bold mt-3.5">
            <span>Enter Match</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab('ai-tutor')}
          className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 text-left hover:border-sky-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🤖</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700">Adaptive</span>
          </div>
          <h3 className="font-bold text-slate-900 text-base mt-2.5 group-hover:text-sky-600 transition-colors">
            AI Language Tutor
          </h3>
          <p className="text-xs text-slate-600 mt-1">Chat in target language with grammar & sentence feedback</p>
          <div className="flex items-center text-xs text-sky-600 font-bold mt-3.5">
            <span>Start Practice</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Badges Collection Showcase (Page 8 of PDF) */}
      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">Gamification Badges</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono font-bold">
            {badges.filter(b => b.unlocked).length} / {badges.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-4 rounded-2xl border text-center transition-all ${
                b.unlocked 
                  ? 'bg-white border-amber-300 shadow-sm' 
                  : 'bg-slate-50 border-slate-200 opacity-60 grayscale'
              }`}
            >
              <div className="text-3xl mb-2">{b.icon}</div>
              <h4 className="font-bold text-slate-900 text-xs truncate">{b.title}</h4>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{b.description}</p>
              
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-center space-x-1">
                <span className="text-[10px] font-bold text-amber-600">+{b.xpReward} XP</span>
                {b.unlocked && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
