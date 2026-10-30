import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  UserProfile, 
  Badge, 
  SavedWord, 
  UILanguage, 
  NavigationTab, 
  SupportedLanguage,
  UserAccount,
  LoginCredentials,
  RegisterCredentials
} from '../types';
import { INITIAL_BADGES } from '../data/mockData';
import { UI_TRANSLATIONS, UIStrings } from '../data/translationsUI';
import { soundEffects } from '../services/audioService';
import { progressSyncService } from '../services/progressSyncService';
import { authService, DEMO_ACCOUNTS } from '../services/authService';

interface AppContextType {
  user: UserProfile;
  badges: Badge[];
  savedWords: SavedWord[];
  uiLanguage: UILanguage;
  activeTab: NavigationTab;
  currentUI: UIStrings;
  unlockedBadgeModal: Badge | null;
  isAuthoritativeSync: boolean;
  isAuthenticated: boolean;
  currentUserAccount: UserAccount | null;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchAccount: (account: UserAccount) => void;
  addXP: (amount: number, reason?: string) => void;
  saveWordToBank: (word: Omit<SavedWord, 'id' | 'timestamp' | 'masteryLevel'>) => void;
  deleteSavedWord: (id: string) => void;
  updateWordMastery: (id: string, delta: number) => void;
  setUILanguage: (lang: UILanguage) => void;
  setActiveTab: (tab: NavigationTab) => void;
  setLearningLanguage: (lang: SupportedLanguage) => void;
  updateVoiceSettings: (settings: { voiceGender?: 'male' | 'female' | 'neutral'; voiceSpeed?: number; voiceTone?: 'natural' | 'professional' | 'cheerful' }) => void;
  closeBadgeModal: () => void;
  triggerConfetti: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_USER = 'bhashiq_user_profile';
const LOCAL_STORAGE_KEY_WORDS = 'bhashiq_saved_words';
const LOCAL_STORAGE_KEY_BADGES = 'bhashiq_badges';
const LOCAL_STORAGE_KEY_UI_LANG = 'bhashiq_ui_lang';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      name: 'Aditya (Student)',
      xp: 4280,
      streak: 14,
      streakFreezes: 2,
      level: 5,
      learningLanguage: 'es',
      nativeLanguage: 'hi',
      voiceGender: 'male',
      voiceSpeed: 1.0,
      voiceTone: 'natural',
      badges: ['first_words', 'words_100', 'speaking_star', 'streak_7'],
      savedWordsCount: 12,
      dailyGoalProgress: 75,
    };
  });

  const [badges, setBadges] = useState<Badge[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_BADGES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_BADGES;
  });

  const [savedWords, setSavedWords] = useState<SavedWord[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_WORDS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      { id: 'w1', originalText: 'Gracias', translatedText: 'Thank you', fromLang: 'es', toLang: 'en', phonetic: 'grah-syahs', timestamp: Date.now() - 86400000 * 2, masteryLevel: 4 },
      { id: 'w2', originalText: 'Buenos días', translatedText: 'Good morning', fromLang: 'es', toLang: 'en', phonetic: 'bweh-nohs dee-ahs', timestamp: Date.now() - 86400000 * 3, masteryLevel: 5 },
      { id: 'w3', originalText: 'रेलवे स्टेशन कहाँ है?', translatedText: 'Where is the railway station?', fromLang: 'hi', toLang: 'en', timestamp: Date.now() - 86400000 * 1, masteryLevel: 3 },
      { id: 'w4', originalText: 'मिसळ पाव', translatedText: 'Misal Pav (Spicy Curry Snack)', fromLang: 'mr', toLang: 'en', timestamp: Date.now() - 86400000 * 4, masteryLevel: 4 },
      { id: 'w5', originalText: 'Arigatō', translatedText: 'Thank you', fromLang: 'ja', toLang: 'en', phonetic: 'ah-ree-gah-toh', timestamp: Date.now() - 86400000 * 5, masteryLevel: 2 },
    ];
  });

  const [uiLanguage, setUILanguageState] = useState<UILanguage>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_UI_LANG) as UILanguage;
    return saved && UI_TRANSLATIONS[saved] ? saved : 'en';
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>('live-call');
  const [unlockedBadgeModal, setUnlockedBadgeModal] = useState<Badge | null>(null);
  const [isAuthoritativeSync, setIsAuthoritativeSync] = useState<boolean>(false);

  // Authentication State
  const [currentUserAccount, setCurrentUserAccount] = useState<UserAccount | null>(() => {
    return authService.getCurrentSession();
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!authService.getCurrentSession();
  });

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    const res = await authService.login(credentials);
    if (res.success && res.user) {
      setCurrentUserAccount(res.user);
      setIsAuthenticated(true);
      setUser(prev => ({
        ...prev,
        name: res.user!.name,
        email: res.user!.email,
        avatar: res.user!.avatar,
        role: res.user!.role,
        xp: res.user!.xp,
        level: res.user!.level,
        streak: res.user!.streak,
        nativeLanguage: res.user!.nativeLanguage,
        learningLanguage: res.user!.learningLanguage,
      }));
      soundEffects.playSuccess();
      triggerConfetti();
      setActiveTab('live-call');
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const register = async (credentials: RegisterCredentials): Promise<{ success: boolean; error?: string }> => {
    const res = await authService.register(credentials);
    if (res.success && res.user) {
      setCurrentUserAccount(res.user);
      setIsAuthenticated(true);
      setUser(prev => ({
        ...prev,
        name: res.user!.name,
        email: res.user!.email,
        avatar: res.user!.avatar,
        role: res.user!.role,
        xp: res.user!.xp,
        level: res.user!.level,
        streak: res.user!.streak,
        nativeLanguage: res.user!.nativeLanguage,
        learningLanguage: res.user!.learningLanguage,
      }));
      soundEffects.playSuccess();
      triggerConfetti();
      unlockBadge('first_words');
      setActiveTab('live-call');
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUserAccount(null);
    setActiveTab('login');
  };

  const switchAccount = (account: UserAccount) => {
    authService.setSession(account);
    setCurrentUserAccount(account);
    setIsAuthenticated(true);
    setUser(prev => ({
      ...prev,
      name: account.name,
      email: account.email,
      avatar: account.avatar,
      role: account.role,
      xp: account.xp,
      level: account.level,
      streak: account.streak,
      nativeLanguage: account.nativeLanguage,
      learningLanguage: account.learningLanguage,
    }));
    soundEffects.playChime();
  };

  // Authoritative State Synchronization on mount
  useEffect(() => {
    progressSyncService.syncAuthoritativeProgress(user.name, user).then(res => {
      if (res.isAuthoritative) {
        setIsAuthoritativeSync(true);
        setUser(prev => ({
          ...prev,
          xp: res.profile.xp,
          level: res.profile.level,
          streak: res.profile.streak,
          dailyGoalProgress: res.profile.dailyGoalProgress,
          badges: res.profile.badges,
          signature: res.signature,
          isAuthoritative: true,
        }));
      }
    });
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_BADGES, JSON.stringify(badges));
  }, [badges]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_WORDS, JSON.stringify(savedWords));
  }, [savedWords]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_UI_LANG, uiLanguage);
  }, [uiLanguage]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {
      // ignore
    }
  };

  const addXP = (amount: number, reason?: string) => {
    // 1. Optimistic instant UI update
    setUser(prev => {
      const newXp = prev.xp + amount;
      const newLevel = Math.floor(newXp / 1000) + 1;
      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        dailyGoalProgress: Math.min(100, prev.dailyGoalProgress + Math.round(amount / 2))
      };
    });

    soundEffects.playChime();

    if (amount >= 30) {
      triggerConfetti();
    }

    // 2. Server-Authoritative state synchronization & signed validation
    const actionKey = reason?.toUpperCase().includes('VOCAB') ? 'VOCAB_SAVED'
      : reason?.toUpperCase().includes('REVISION') ? 'REVISION_PRACTICED'
      : reason?.toUpperCase().includes('SPEAKER') ? 'SPEAKER_IDENTIFIED'
      : reason?.toUpperCase().includes('CONVERSATION') ? 'CONVERSATION_TURN'
      : 'SPEECH_TRANSLATED';

    progressSyncService.awardAuthoritativeXP(actionKey, amount, reason, user.name).then(res => {
      if (res.isAuthoritative) {
        setIsAuthoritativeSync(true);
        setUser(prev => ({
          ...prev,
          xp: res.xp,
          level: res.level,
          dailyGoalProgress: res.dailyGoalProgress,
          badges: res.unlockedBadges,
          signature: res.signature,
          isAuthoritative: true,
        }));

        if (res.newlyUnlockedBadges && res.newlyUnlockedBadges.length > 0) {
          for (const bid of res.newlyUnlockedBadges) {
            unlockBadge(bid);
          }
        }
      }
    });
  };

  const unlockBadge = (badgeId: string) => {
    setBadges(prev => prev.map(b => {
      if (b.id === badgeId && !b.unlocked) {
        const updated = { ...b, unlocked: true, unlockedAt: 'Just now' };
        setUnlockedBadgeModal(updated);
        soundEffects.playSuccess();
        triggerConfetti();
        return updated;
      }
      return b;
    }));
  };

  const saveWordToBank = (wordData: Omit<SavedWord, 'id' | 'timestamp' | 'masteryLevel'>) => {
    const exists = savedWords.find(w => w.originalText.toLowerCase() === wordData.originalText.toLowerCase());
    if (exists) return;

    const newWord: SavedWord = {
      ...wordData,
      id: `w_${Date.now()}`,
      timestamp: Date.now(),
      masteryLevel: 1,
    };

    setSavedWords(prev => [newWord, ...prev]);
    setUser(prev => ({ ...prev, savedWordsCount: prev.savedWordsCount + 1 }));
    addXP(15, 'Saved new vocabulary word');

    if (savedWords.length + 1 >= 10) {
      unlockBadge('vocab_master');
    }
  };

  const deleteSavedWord = (id: string) => {
    setSavedWords(prev => prev.filter(w => w.id !== id));
    setUser(prev => ({ ...prev, savedWordsCount: Math.max(0, prev.savedWordsCount - 1) }));
  };

  const updateWordMastery = (id: string, delta: number) => {
    setSavedWords(prev => prev.map(w => {
      if (w.id === id) {
        const updatedLevel = Math.max(1, Math.min(5, w.masteryLevel + delta));
        return { ...w, masteryLevel: updatedLevel };
      }
      return w;
    }));
    addXP(10, 'Vocabulary revision practiced');
  };

  const setUILanguage = (lang: UILanguage) => {
    setUILanguageState(lang);
  };

  const setLearningLanguage = (lang: SupportedLanguage) => {
    setUser(prev => ({ ...prev, learningLanguage: lang }));
  };

  const updateVoiceSettings = (settings: { voiceGender?: 'male' | 'female' | 'neutral'; voiceSpeed?: number; voiceTone?: 'natural' | 'professional' | 'cheerful' }) => {
    setUser(prev => ({
      ...prev,
      voiceGender: settings.voiceGender ?? prev.voiceGender,
      voiceSpeed: settings.voiceSpeed ?? prev.voiceSpeed,
      voiceTone: settings.voiceTone ?? prev.voiceTone,
    }));
  };

  const closeBadgeModal = () => {
    setUnlockedBadgeModal(null);
  };

  const currentUI = UI_TRANSLATIONS[uiLanguage] || UI_TRANSLATIONS.en;

  return (
    <AppContext.Provider
      value={{
        user,
        badges,
        savedWords,
        uiLanguage,
        activeTab,
        currentUI,
        unlockedBadgeModal,
        isAuthoritativeSync,
        isAuthenticated,
        currentUserAccount,
        login,
        register,
        logout,
        switchAccount,
        addXP,
        saveWordToBank,
        deleteSavedWord,
        updateWordMastery,
        setUILanguage,
        setActiveTab,
        setLearningLanguage,
        updateVoiceSettings,
        closeBadgeModal,
        triggerConfetti,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
