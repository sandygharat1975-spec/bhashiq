import React, { useState } from 'react';
import { 
  Globe, 
  Flame, 
  Sparkles, 
  Sliders, 
  Volume2, 
  Check, 
  ChevronDown,
  PhoneCall,
  Camera,
  BookOpen,
  Trophy,
  Compass,
  GraduationCap,
  Play,
  User,
  LogIn,
  LogOut
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UILanguage } from '../types';
import { speechService } from '../services/speechService';
import { DEMO_ACCOUNTS } from '../services/authService';

export const Navbar: React.FC = () => {
  const { 
    user, 
    uiLanguage, 
    setUILanguage, 
    currentUI, 
    activeTab,
    setActiveTab,
    updateVoiceSettings,
    isAuthenticated,
    currentUserAccount,
    logout,
    switchAccount
  } = useApp();

  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [testingAudio, setTestingAudio] = useState(false);

  const uiLanguages: { code: UILanguage; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी (Marathi)', flag: '🇮🇳' },
    { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' },
    { code: 'fr', name: 'Français (French)', flag: '🇫🇷' },
    { code: 'ja', name: '日本語 (Japanese)', flag: '🇯🇵' },
  ];

  // Quick sound tester in header
  const handleTestSound = async () => {
    if (testingAudio) return;
    setTestingAudio(true);
    await speechService.testSpeaker('en', () => setTestingAudio(false));
    setTimeout(() => setTestingAudio(false), 2500);
  };

  // Helper to know which primary section is active
  const isCallActive = ['live-call', 'conversation', 'multi-speaker'].includes(activeTab);
  const isVisionActive = ['camera-ar', 'document'].includes(activeTab);
  const isTranslateActive = ['text-context', 'speech', 'pronunciation'].includes(activeTab);
  const isLearnActive = ['learning-hub', 'mini-games', 'multiplayer', 'ai-tutor', 'vocab-bank', 'adaptive-learning', 'language-buddy'].includes(activeTab);
  const isTravelActive = ['travel', 'emergency', 'analytics'].includes(activeTab);
  const isVivaActive = activeTab === 'viva-hub';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 text-slate-800 shadow-xs">
        <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Brand Logo */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer flex-shrink-0" 
            onClick={() => setActiveTab('live-call')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-violet-500/20 ring-1 ring-violet-500/20">
              <Globe className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-violet-700 via-indigo-700 to-cyan-600 bg-clip-text text-transparent">
                  {currentUI.appName}
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-violet-100 text-violet-700 rounded-md border border-violet-200">
                  AI PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden xl:block font-medium">
                Live On-Call & Multi-Modal Translator
              </p>
            </div>
          </div>

          {/* 5 Primary Navigation Tabs (Desktop & Tablet) */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 shadow-inner">
            <button
              onClick={() => setActiveTab('live-call')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isCallActive
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25 ring-1 ring-violet-400/40'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Live Call</span>
              <span className={`px-1.5 py-0.2 text-[9px] font-black uppercase rounded ${
                isCallActive ? 'bg-cyan-300 text-slate-900' : 'bg-slate-200 text-slate-700'
              }`}>
                USP
              </span>
            </button>

            <button
              onClick={() => setActiveTab('camera-ar')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isVisionActive
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/25 ring-1 ring-cyan-400/40'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera AR</span>
            </button>

            <button
              onClick={() => setActiveTab('text-context')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isTranslateActive
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25 ring-1 ring-indigo-400/40'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Smart Translator</span>
            </button>

            <button
              onClick={() => setActiveTab('learning-hub')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isLearnActive
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-amber-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Learn & Play</span>
            </button>

            <button
              onClick={() => setActiveTab('travel')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isTravelActive
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/25 ring-1 ring-rose-400/40'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Travel & Safety</span>
            </button>
          </nav>

          {/* Right side status badges & utility buttons */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            
            {/* Quick Audio Speaker Test Pill */}
            <button
              onClick={handleTestSound}
              className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                testingAudio
                  ? 'bg-cyan-50 border-cyan-400 text-cyan-800 ring-2 ring-cyan-400/40 animate-pulse'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-cyan-400 hover:text-cyan-700 shadow-xs'
              }`}
              title="Test Speaker & Voice Engine"
            >
              <Volume2 className="w-3.5 h-3.5 text-cyan-600" />
              <span>{testingAudio ? 'Testing Sound...' : 'Test Sound'}</span>
            </button>

            {/* Gamification Streak */}
            <div 
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-all cursor-pointer shadow-xs"
              title={`${user.streak} Day Learning Streak!`}
              onClick={() => setActiveTab('learning-hub')}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>{user.streak}d</span>
            </div>

            {/* XP Pill */}
            <div 
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-800 text-xs font-bold hover:bg-violet-100 transition-all cursor-pointer shadow-xs"
              title={`Level ${user.level} Polyglot`}
              onClick={() => setActiveTab('learning-hub')}
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>{user.xp} XP</span>
            </div>

            {/* College Project Viva Voce Button */}
            <button
              onClick={() => setActiveTab('viva-hub')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                isVivaActive 
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white ring-2 ring-violet-400 shadow-md shadow-violet-600/25' 
                  : 'bg-white border border-slate-200 text-violet-700 hover:bg-violet-50'
              }`}
              title="Project Evaluation & Viva Voce Rubric"
            >
              <GraduationCap className="w-4 h-4 text-violet-600" />
              <span className="hidden lg:inline">Viva Hub</span>
            </button>

            {/* Voice Preservation Mode Settings */}
            <div className="relative">
              <button
                onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-all flex items-center space-x-1 shadow-xs"
                title="Voice-Preservation Mode & Audio Profiles"
              >
                <Volume2 className="w-4 h-4 text-cyan-600" />
                <Sliders className="w-3 h-3 text-slate-400" />
              </button>

              {showVoiceSettings && (
                <div className="absolute right-0 mt-2 w-72 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 animate-fade-in text-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-cyan-600" /> Voice Profile
                    </span>
                    <span className="text-[10px] bg-cyan-100 text-cyan-800 font-bold px-2 py-0.5 rounded-full border border-cyan-200">
                      Dual-Engine Active
                    </span>
                  </div>

                  {/* Voice Gender Profile */}
                  <div>
                    <label className="text-xs text-slate-500 font-semibold block mb-1.5">Speaker Voice Gender</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['male', 'female', 'neutral'] as const).map(g => (
                        <button
                          key={g}
                          onClick={() => updateVoiceSettings({ voiceGender: g })}
                          className={`py-1.5 text-xs rounded-xl font-bold capitalize transition-all ${
                            user.voiceGender === g 
                              ? 'bg-violet-600 text-white shadow-xs' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Speaking Speed */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-600 font-semibold mb-1">
                      <span>Speaking Speed</span>
                      <span className="text-cyan-700 font-mono font-bold">{user.voiceSpeed}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="1.2"
                      step="0.1"
                      value={user.voiceSpeed}
                      onChange={(e) => updateVoiceSettings({ voiceSpeed: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Tone Preset */}
                  <div>
                    <label className="text-xs text-slate-500 font-semibold block mb-1.5">Emotional Tone</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['natural', 'professional', 'cheerful'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => updateVoiceSettings({ voiceTone: t })}
                          className={`py-1.5 text-xs rounded-xl font-bold capitalize transition-all ${
                            user.voiceTone === t 
                              ? 'bg-indigo-600 text-white shadow-xs' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Test Voice in Dialog */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={handleTestSound}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-violet-600/25 hover:opacity-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Test Voice Announcement</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* UI Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-all shadow-xs"
              >
                <span>{uiLanguages.find(l => l.code === uiLanguage)?.flag}</span>
                <span className="hidden sm:inline text-slate-700 font-medium">
                  {uiLanguages.find(l => l.code === uiLanguage)?.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-48 py-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 animate-fade-in text-xs">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    App Language (UI)
                  </div>
                  {uiLanguages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setUILanguage(l.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-slate-50 transition-colors ${
                        uiLanguage === l.code ? 'text-violet-700 font-bold bg-violet-50/70' : 'text-slate-700'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <span>{l.flag}</span>
                        <span>{l.name}</span>
                      </span>
                      {uiLanguage === l.code && <Check className="w-3.5 h-3.5 text-violet-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Account / Profile Badge or Login Button */}
            {isAuthenticated && currentUserAccount ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-all shadow-xs"
                  title="User Account & Profile"
                >
                  <span className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center text-sm">
                    {currentUserAccount.avatar || '👤'}
                  </span>
                  <span className="hidden sm:inline font-bold text-slate-800 max-w-[100px] truncate">
                    {currentUserAccount.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 animate-fade-in text-xs space-y-3">
                    {/* User Header */}
                    <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                      <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-lg shadow-sm">
                        {currentUserAccount.avatar || '👤'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 truncate">{currentUserAccount.name}</h4>
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-violet-100 text-violet-800">
                            Lvl {user.level}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{currentUserAccount.email}</p>
                      </div>
                    </div>

                    {/* Account Stats Strip */}
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50 text-center text-slate-700">
                      <div>
                        <span className="block text-xs font-black text-violet-700">{user.xp} XP</span>
                        <span className="text-[10px] text-slate-400">Total Earned</span>
                      </div>
                      <div>
                        <span className="block text-xs font-black text-amber-600">{user.streak} Days</span>
                        <span className="text-[10px] text-slate-400">Learning Streak</span>
                      </div>
                    </div>

                    {/* Switch Demo Accounts */}
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Switch User Account
                      </div>
                      <div className="space-y-1">
                        {DEMO_ACCOUNTS.map(acc => (
                          <button
                            key={acc.id}
                            onClick={() => {
                              switchAccount(acc);
                              setShowUserMenu(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                              currentUserAccount.id === acc.id
                                ? 'bg-violet-50 text-violet-900 font-bold border border-violet-200'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span className="flex items-center space-x-2 truncate">
                              <span>{acc.avatar}</span>
                              <span className="truncate">{acc.name}</span>
                            </span>
                            <span className="text-[10px] text-slate-400">Lvl {acc.level}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setActiveTab('login');
                          setShowUserMenu(false);
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-center text-xs transition-colors"
                      >
                        Manage / Sign In
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold flex items-center space-x-1 transition-colors"
                        title="Sign Out of Account"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('login')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  activeTab === 'login'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-violet-700 hover:bg-violet-50'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

          </div>
        </div>
      </header>

      {/* Mobile Friendly Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 z-50 px-2 py-1.5 shadow-xl flex items-center justify-around">
        <button
          onClick={() => setActiveTab('live-call')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
            isCallActive ? 'text-violet-600' : 'text-slate-500'
          }`}
        >
          <PhoneCall className="w-4 h-4 mb-0.5" />
          <span>Call</span>
        </button>

        <button
          onClick={() => setActiveTab('camera-ar')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
            isVisionActive ? 'text-cyan-600' : 'text-slate-500'
          }`}
        >
          <Camera className="w-4 h-4 mb-0.5" />
          <span>Vision</span>
        </button>

        <button
          onClick={() => setActiveTab('text-context')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
            isTranslateActive ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          <span>Translate</span>
        </button>

        <button
          onClick={() => setActiveTab('learning-hub')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
            isLearnActive ? 'text-amber-600' : 'text-slate-500'
          }`}
        >
          <Trophy className="w-4 h-4 mb-0.5" />
          <span>Learn</span>
        </button>

        <button
          onClick={() => setActiveTab('travel')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
            isTravelActive ? 'text-rose-600' : 'text-slate-500'
          }`}
        >
          <Compass className="w-4 h-4 mb-0.5" />
          <span>Travel</span>
        </button>
      </nav>
    </>
  );
};
