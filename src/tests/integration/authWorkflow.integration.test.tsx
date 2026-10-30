import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider, useApp } from '../../context/AppContext';
import { LoginPage } from '../../components/auth/LoginPage';
import { Navbar } from '../../components/Navbar';

const AuthTestConsumer: React.FC = () => {
  const { user, isAuthenticated, activeTab, currentUserAccount } = useApp();
  return (
    <div data-testid="auth-consumer">
      <span data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'guest'}</span>
      <span data-testid="user-name">{user.name}</span>
      <span data-testid="user-xp">{user.xp}</span>
      <span data-testid="user-role">{currentUserAccount?.role || 'none'}</span>
      <span data-testid="active-tab">{activeTab}</span>
    </div>
  );
};

describe('Integration Test: User Authentication & Login Workflow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders login page with Sign In, Create Account switcher, and demo personas', () => {
    render(
      <AppProvider>
        <LoginPage />
        <AuthTestConsumer />
      </AppProvider>
    );

    // Header and brand presence
    const brandElements = screen.getAllByText(/Bhashiq|भाषिक/i);
    expect(brandElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/Sign In to Account/i)).toBeDefined();
    expect(screen.getByText(/Create New Account/i)).toBeDefined();

    // 1-Click demo accounts are visible
    expect(screen.getByText(/Aditya Sharma/i)).toBeDefined();
    expect(screen.getByText(/Dr. Elena Vance/i)).toBeDefined();
    expect(screen.getByText(/Marco Silva/i)).toBeDefined();
  });

  it('switches between Sign In and Create Account modes cleanly', () => {
    render(
      <AppProvider>
        <LoginPage />
      </AppProvider>
    );

    // Initial mode is sign in
    expect(screen.getByPlaceholderText(/aditya.sharma@bhashiq.ai/i)).toBeDefined();

    // Click "Create New Account"
    const signUpTab = screen.getByText(/Create New Account/i);
    fireEvent.click(signUpTab);

    // Sign up specific fields should appear
    expect(screen.getByPlaceholderText(/e.g. Maya Patel/i)).toBeDefined();
    expect(screen.getByText(/Native Language/i)).toBeDefined();
    expect(screen.getByText(/Target Learning Language/i)).toBeDefined();
    expect(screen.getByText(/Create Account & Start Translating/i)).toBeDefined();
  });

  it('logs in via 1-click demo persona and synchronizes AppContext state', async () => {
    render(
      <AppProvider>
        <LoginPage />
        <AuthTestConsumer />
      </AppProvider>
    );

    // Find and click Dr. Elena Vance's 1-click button
    const elenaBtn = screen.getByText(/Dr. Elena Vance/i).closest('button');
    expect(elenaBtn).not.toBeNull();
    fireEvent.click(elenaBtn!);

    // Wait for login resolution
    await waitFor(() => {
      expect(screen.getByTestId('user-name').textContent).toBe('Dr. Elena Vance');
      expect(screen.getByTestId('user-role').textContent).toBe('translator');
      expect(screen.getByTestId('active-tab').textContent).toBe('live-call');
    }, { timeout: 3000 });
  });

  it('authenticates user when guest clicks explore as guest', () => {
    render(
      <AppProvider>
        <LoginPage />
        <AuthTestConsumer />
      </AppProvider>
    );

    const guestBtn = screen.getByText(/Explore as Guest/i);
    fireEvent.click(guestBtn);

    expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
    expect(screen.getByTestId('active-tab').textContent).toBe('live-call');
  });
});
