import { UserAccount, LoginCredentials, RegisterCredentials, SupportedLanguage } from '../types';

export const DEMO_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr_aditya',
    name: 'Aditya Sharma',
    email: 'aditya.sharma@bhashiq.ai',
    password: 'Password123!',
    avatar: '🎓',
    role: 'student',
    xp: 4280,
    level: 5,
    streak: 14,
    nativeLanguage: 'hi',
    learningLanguage: 'es',
    token: 'jwt_mock_aditya_2026_token',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    id: 'usr_elena',
    name: 'Dr. Elena Vance',
    email: 'elena.vance@polyglot.org',
    password: 'Password123!',
    avatar: '🌐',
    role: 'translator',
    xp: 18450,
    level: 9,
    streak: 45,
    nativeLanguage: 'en',
    learningLanguage: 'ja',
    token: 'jwt_mock_elena_2026_token',
    createdAt: '2026-06-15T10:30:00.000Z'
  },
  {
    id: 'usr_marco',
    name: 'Marco Silva',
    email: 'marco.silva@wanderlust.io',
    password: 'Password123!',
    avatar: '✈️',
    role: 'traveler',
    xp: 2150,
    level: 3,
    streak: 8,
    nativeLanguage: 'es',
    learningLanguage: 'mr',
    token: 'jwt_mock_marco_2026_token',
    createdAt: '2026-09-20T14:15:00.000Z'
  },
  {
    id: 'usr_priya',
    name: 'Prof. Priya Deshmukh',
    email: 'priya.deshmukh@linguistics.edu',
    password: 'Password123!',
    avatar: '📚',
    role: 'pro',
    xp: 9600,
    level: 7,
    streak: 28,
    nativeLanguage: 'mr',
    learningLanguage: 'en',
    token: 'jwt_mock_priya_2026_token',
    createdAt: '2026-07-10T12:00:00.000Z'
  }
];

const STORAGE_KEY_ACCOUNTS = 'bhashiq_user_accounts';
const STORAGE_KEY_SESSION = 'bhashiq_auth_session';

export class AuthService {
  /**
   * Retrieves all registered accounts, initializing with demo personas if empty
   */
  public getAccounts(): UserAccount[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to demo accounts
    }
    this.saveAccounts(DEMO_ACCOUNTS);
    return DEMO_ACCOUNTS;
  }

  /**
   * Persist accounts to local storage
   */
  private saveAccounts(accounts: UserAccount[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    } catch {
      // Ignore quota errors in testing environments
    }
  }

  /**
   * Retrieves active authenticated session
   */
  public getCurrentSession(): UserAccount | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SESSION);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  }

  /**
   * Sets active authenticated session
   */
  public setSession(user: UserAccount): void {
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
    } catch {
      // Ignore
    }
  }

  /**
   * Clears active session on logout
   */
  public logout(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    } catch {
      // Ignore
    }
  }

  /**
   * Sign in with email or username and password
   */
  public async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    // Artificial slight micro-delay for realistic interactive feel
    await new Promise(resolve => setTimeout(resolve, 350));

    const email = credentials.email.trim().toLowerCase();
    const accounts = this.getAccounts();

    const match = accounts.find(a => 
      a.email.toLowerCase() === email || 
      a.name.toLowerCase() === email ||
      a.name.toLowerCase().includes(email)
    );

    if (!match) {
      return {
        success: false,
        error: 'No account found with this email or username. Try one of the 1-click demo accounts below or create an account.'
      };
    }

    // Verify password if provided
    if (credentials.password && match.password) {
      if (credentials.password !== match.password && credentials.password !== 'Password123!') {
        return {
          success: false,
          error: 'Incorrect password. Demo accounts use "Password123!" or click 1-click login.'
        };
      }
    }

    const sessionUser: UserAccount = {
      ...match,
      token: `jwt_session_${match.id}_${Date.now()}`
    };

    this.setSession(sessionUser);
    return {
      success: true,
      user: sessionUser
    };
  }

  /**
   * Sign up and register a new user account
   */
  public async register(credentials: RegisterCredentials): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const name = credentials.name.trim();
    const email = credentials.email.trim().toLowerCase();

    if (!name || name.length < 2) {
      return { success: false, error: 'Please enter a valid full name (at least 2 characters).' };
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const accounts = this.getAccounts();
    const existing = accounts.find(a => a.email.toLowerCase() === email);
    if (existing) {
      return { success: false, error: 'An account with this email already exists. Please sign in.' };
    }

    const newAccount: UserAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      email,
      password: credentials.password || 'Password123!',
      avatar: credentials.role === 'translator' ? '🌐' : credentials.role === 'traveler' ? '✈️' : '🎓',
      role: credentials.role || 'student',
      xp: 150, // Welcome signup bonus
      level: 1,
      streak: 1,
      nativeLanguage: credentials.nativeLanguage || 'en',
      learningLanguage: credentials.learningLanguage || 'es',
      token: `jwt_session_new_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    accounts.push(newAccount);
    this.saveAccounts(accounts);
    this.setSession(newAccount);

    return {
      success: true,
      user: newAccount
    };
  }

  /**
   * Password strength estimator
   */
  public evaluatePasswordStrength(password: string): { score: number; label: string; color: string } {
    if (!password) return { score: 0, label: 'Empty', color: 'bg-slate-200 text-slate-500' };
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;

    if (score <= 25) return { score, label: 'Weak', color: 'bg-rose-500 text-rose-700' };
    if (score <= 50) return { score, label: 'Fair', color: 'bg-amber-500 text-amber-700' };
    if (score <= 75) return { score, label: 'Good', color: 'bg-cyan-500 text-cyan-700' };
    return { score, label: 'Strong', color: 'bg-emerald-500 text-emerald-700' };
  }
}

export const authService = new AuthService();
