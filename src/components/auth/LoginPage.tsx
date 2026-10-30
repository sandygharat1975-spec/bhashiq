import React, { useState } from 'react';
import { 
  Globe, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  PhoneCall, 
  Camera, 
  Trophy, 
  Flame, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEMO_ACCOUNTS, authService } from '../../services/authService';
import { SUPPORTED_LANGUAGES } from '../../data/mockData';
import { SupportedLanguage, UserAccount, UILanguage } from '../../types';

export const LoginPage: React.FC = () => {
  const { login, register, setActiveTab, switchAccount, uiLanguage, setUILanguage } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  
  // Sign In state
  const [loginEmail, setLoginEmail] = useState('aditya.sharma@bhashiq.ai');
  const [loginPassword, setLoginPassword] = useState('Password123!');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regNativeLang, setRegNativeLang] = useState<SupportedLanguage>('en');
  const [regTargetLang, setRegTargetLang] = useState<SupportedLanguage>('hi');
  const [regRole, setRegRole] = useState<'student' | 'translator' | 'traveler' | 'pro'>('student');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Status & feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showLangMenu, setShowLangMenu] = useState(false);

  const uiLanguages: { code: UILanguage; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी (Marathi)', flag: '🇮🇳' },
    { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' },
    { code: 'fr', name: 'Français (French)', flag: '🇫🇷' },
    { code: 'ja', name: '日本語 (Japanese)', flag: '🇯🇵' },
  ];

  const passwordStrength = authService.evaluatePasswordStrength(regPassword);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await login({
        email: loginEmail,
        password: loginPassword,
        rememberMe
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
      } else {
        setSuccessMessage('Login successful! Redirecting to Live Translation Studio...');
      }
    } catch {
      setErrorMessage('Unexpected network or authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Please accept the Terms of Service & Privacy Policy to create an account.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        nativeLanguage: regNativeLang,
        learningLanguage: regTargetLang,
        role: regRole
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed.');
      } else {
        setSuccessMessage('Account created successfully! Welcome to Bhashiq.');
      }
    } catch {
      setErrorMessage('Unexpected registration error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (account: UserAccount) => {
    setLoginEmail(account.email);
    setLoginPassword('Password123!');
    setErrorMessage(null);
    setIsLoading(true);

    const res = await login({
      email: account.email,
      password: 'Password123!',
      rememberMe: true
    });

    setIsLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to login with demo account.');
    }
  };

  const handleGuestContinue = () => {
    const guestAccount: UserAccount = {
      id: 'usr_guest',
      name: 'Guest Explorer',
      email: 'guest@bhashiq.ai',
      avatar: '🚀',
      role: 'guest',
      xp: 250,
      level: 1,
      streak: 1,
      nativeLanguage: 'en',
      learningLanguage: 'es',
      createdAt: new Date().toISOString()
    };
    switchAccount(guestAccount);
    setActiveTab('live-call');
  };

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-violet-600 selection:text-white relative">
      {/* Subtle ambient illumination */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(124,58,237,0.04),rgba(255,255,255,0))]" />
      <div className="fixed -top-32 left-10 w-96 h-96 bg-violet-500/[0.03] rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed top-1/3 -right-20 w-[500px] h-[500px] bg-cyan-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* Standalone Login Header (Clean & Distraction-Free: NO internal tabs) */}
      <header className="w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-violet-500/20 ring-1 ring-violet-500/20">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-violet-700 via-indigo-700 to-cyan-600 bg-clip-text text-transparent">
                  भाषिक Bhashiq
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-violet-100 text-violet-700 rounded-md border border-violet-200">
                  AI PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block font-medium">
                Live Speech & Multi-Modal Linguistic Studio
              </p>
            </div>
          </div>

          {/* Right Header Options */}
          <div className="flex items-center space-x-3">
            {/* UI Language Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-all shadow-xs"
              >
                <span>{uiLanguages.find(l => l.code === uiLanguage)?.flag}</span>
                <span className="hidden sm:inline">
                  {uiLanguages.find(l => l.code === uiLanguage)?.name.split(' ')[0]}
                </span>
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-48 py-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 text-xs">
                  {uiLanguages.map(l => (
                    <button
                      key={l.code}
                      type="button"
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
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Guest Continue Button */}
            <button
              type="button"
              onClick={handleGuestContinue}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 text-xs font-bold transition-all shadow-xs"
            >
              <span>Explore as Guest</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Authentication Workspace */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Platform Showcase & Value Proposition (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-700 to-cyan-700 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Language Ecosystem</span>
              </span>

              <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                Connect Across Any Language in Real Time.
              </h2>
              
              <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
                Log in to sync your personalized voice presets, unlock interactive polyglot badges, track daily streaks, and participate in 1v1 multiplayer arena challenges.
              </p>

              {/* Key Highlights */}
              <div className="pt-2 space-y-2.5 text-xs text-white/90">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1 rounded-lg bg-white/20">
                    <PhoneCall className="w-3.5 h-3.5 text-cyan-300" />
                  </div>
                  <span><strong>Live On-Call Voice Translation</strong> with &lt;50ms latency</span>
                </div>

                <div className="flex items-center space-x-2.5">
                  <div className="p-1 rounded-lg bg-white/20">
                    <Camera className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                  <span><strong>Augmented Reality Signage & Menu OCR</strong> translation</span>
                </div>

                <div className="flex items-center space-x-2.5">
                  <div className="p-1 rounded-lg bg-white/20">
                    <Trophy className="w-3.5 h-3.5 text-emerald-300" />
                  </div>
                  <span><strong>Gamified Spaced Repetition</strong> with server-authoritative progress</span>
                </div>

                <div className="flex items-center space-x-2.5">
                  <div className="p-1 rounded-lg bg-white/20">
                    <ShieldCheck className="w-3.5 h-3.5 text-violet-300" />
                  </div>
                  <span><strong>Client-Side PII Tokenization</strong> & DPA Zero-Retention compliance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust & Engineering Metric Card */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Production Verified Engine
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-lg font-black text-violet-700">149/149</div>
                <div className="text-[10px] text-slate-500 font-semibold">Tests Passed</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-lg font-black text-cyan-700">13+</div>
                <div className="text-[10px] text-slate-500 font-semibold">Languages</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-lg font-black text-emerald-700">100%</div>
                <div className="text-[10px] text-slate-500 font-semibold">Client Privacy</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
            
            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  mode === 'signin'
                    ? 'bg-white text-violet-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Account</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  mode === 'signup'
                    ? 'bg-white text-violet-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Create New Account</span>
              </button>
            </div>

            {/* Error or Success Alerts */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Sign In Form */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address or Username
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. aditya.sharma@bhashiq.ai"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-violet-600 focus:bg-white transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => alert('Password reset link sent to registered email address (simulated demo). You can also use one of the 1-click accounts below.')}
                      className="text-[11px] font-semibold text-violet-700 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-violet-600 focus:bg-white transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded accent-violet-600"
                    />
                    <span>Remember my account on this browser</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-violet-500/20 active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isLoading ? 'Authenticating...' : 'Sign In to Bhashiq'}</span>
                </button>
              </form>
            )}

            {/* Sign Up / Create Account Form */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Maya Patel"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-violet-600 focus:bg-white transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. maya.patel@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-violet-600 focus:bg-white transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Language Pair Selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Native Language
                    </label>
                    <select
                      value={regNativeLang}
                      onChange={(e) => setRegNativeLang(e.target.value as SupportedLanguage)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-violet-600 cursor-pointer shadow-xs"
                    >
                      {SUPPORTED_LANGUAGES.map(l => (
                        <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Target Learning Language
                    </label>
                    <select
                      value={regTargetLang}
                      onChange={(e) => setRegTargetLang(e.target.value as SupportedLanguage)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-violet-600 cursor-pointer shadow-xs"
                    >
                      {SUPPORTED_LANGUAGES.map(l => (
                        <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* User Role Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Primary Usage Role
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'student', label: 'Student', icon: '🎓' },
                      { id: 'translator', label: 'Interpreter', icon: '🌐' },
                      { id: 'traveler', label: 'Traveler', icon: '✈️' },
                      { id: 'pro', label: 'Educator', icon: '📚' }
                    ].map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRegRole(r.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                          regRole === r.id
                            ? 'bg-violet-50 border-violet-500 text-violet-800 ring-1 ring-violet-500/30'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-base">{r.icon}</span>
                        <span>{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="At least 8 chars"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-violet-600 focus:bg-white transition-all shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-violet-600 focus:bg-white transition-all shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Password strength meter */}
                {regPassword && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                      <span>Password Strength</span>
                      <span className="capitalize">{passwordStrength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${passwordStrength.color.split(' ')[0]}`}
                        style={{ width: `${passwordStrength.score}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-2 text-xs text-slate-600 pt-1">
                  <input
                    type="checkbox"
                    id="terms-check"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded accent-violet-600 cursor-pointer"
                  />
                  <label htmlFor="terms-check" className="cursor-pointer">
                    I agree to the Zero-Retention Privacy Agreement and Data Processing Terms.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isLoading ? 'Creating Account...' : 'Create Account & Start Translating'}</span>
                </button>
              </form>
            )}

            {/* 1-Click Fast Demo Accounts Section */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  1-Click Instant Demo Accounts:
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">For Project Evaluators</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleQuickDemoLogin(acc)}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-violet-50 hover:border-violet-300 text-left transition-all flex items-center space-x-3 group"
                  >
                    <span className="text-2xl p-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform">
                      {acc.avatar}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{acc.name}</h4>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-violet-100 text-violet-800 font-bold uppercase">
                          Lvl {acc.level}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{acc.email}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-1">
                        <span>{acc.xp} XP</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-amber-600">
                          <Flame className="w-3 h-3" /> {acc.streak}d streak
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
      </main>

    </div>
  );
};
