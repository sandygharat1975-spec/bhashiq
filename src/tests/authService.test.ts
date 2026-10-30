import { describe, it, expect, beforeEach } from 'vitest';
import { authService, DEMO_ACCOUNTS } from '../services/authService';

describe('AuthService Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes and returns default demo accounts', () => {
    const accounts = authService.getAccounts();
    expect(accounts.length).toBeGreaterThanOrEqual(4);
    expect(accounts[0].email).toBe('aditya.sharma@bhashiq.ai');
    expect(accounts[1].email).toBe('elena.vance@polyglot.org');
  });

  it('authenticates a demo user with valid credentials', async () => {
    const res = await authService.login({
      email: 'aditya.sharma@bhashiq.ai',
      password: 'Password123!'
    });

    expect(res.success).toBe(true);
    expect(res.user).toBeDefined();
    expect(res.user?.name).toBe('Aditya Sharma');
    expect(res.user?.role).toBe('student');
    expect(res.user?.xp).toBe(4280);

    const session = authService.getCurrentSession();
    expect(session).toBeDefined();
    expect(session?.email).toBe('aditya.sharma@bhashiq.ai');
  });

  it('rejects an unregistered email with friendly error message', async () => {
    const res = await authService.login({
      email: 'nonexistent.user@unknown.com',
      password: 'Password123!'
    });

    expect(res.success).toBe(false);
    expect(res.user).toBeUndefined();
    expect(res.error).toContain('No account found');
  });

  it('rejects an incorrect password', async () => {
    const res = await authService.login({
      email: 'elena.vance@polyglot.org',
      password: 'WrongPassword999!'
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Incorrect password');
  });

  it('registers a new user account with Level 1 and signup bonus XP', async () => {
    const res = await authService.register({
      name: 'Rohan Mehra',
      email: 'rohan.mehra@test.com',
      password: 'SecurePass123!',
      nativeLanguage: 'hi',
      learningLanguage: 'ja',
      role: 'traveler'
    });

    expect(res.success).toBe(true);
    expect(res.user).toBeDefined();
    expect(res.user?.name).toBe('Rohan Mehra');
    expect(res.user?.role).toBe('traveler');
    expect(res.user?.xp).toBe(150);
    expect(res.user?.level).toBe(1);
    expect(res.user?.nativeLanguage).toBe('hi');
    expect(res.user?.learningLanguage).toBe('ja');

    // Confirm persisted in accounts list
    const accounts = authService.getAccounts();
    const found = accounts.find(a => a.email === 'rohan.mehra@test.com');
    expect(found).toBeDefined();
    expect(found?.name).toBe('Rohan Mehra');
  });

  it('rejects registration if email is already taken', async () => {
    const res = await authService.register({
      name: 'Aditya Duplicate',
      email: 'aditya.sharma@bhashiq.ai',
      password: 'Password123!',
      nativeLanguage: 'hi',
      learningLanguage: 'es'
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('already exists');
  });

  it('rejects registration with invalid name or email', async () => {
    const res1 = await authService.register({
      name: '',
      email: 'valid@example.com',
      nativeLanguage: 'en',
      learningLanguage: 'es'
    });
    expect(res1.success).toBe(false);

    const res2 = await authService.register({
      name: 'Valid Name',
      email: 'invalid-email',
      nativeLanguage: 'en',
      learningLanguage: 'es'
    });
    expect(res2.success).toBe(false);
  });

  it('clears session on logout', async () => {
    await authService.login({
      email: 'aditya.sharma@bhashiq.ai',
      password: 'Password123!'
    });

    expect(authService.getCurrentSession()).not.toBeNull();
    authService.logout();
    expect(authService.getCurrentSession()).toBeNull();
  });

  it('evaluates password strength accurately', () => {
    const weak = authService.evaluatePasswordStrength('abc');
    expect(weak.score).toBeLessThanOrEqual(25);
    expect(weak.label).toBe('Weak');

    const strong = authService.evaluatePasswordStrength('P@ssw0rd2026!');
    expect(strong.score).toBe(100);
    expect(strong.label).toBe('Strong');
  });
});
