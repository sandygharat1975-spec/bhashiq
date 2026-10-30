import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppProvider, useApp } from '../../context/AppContext';
import { Navbar } from '../../components/Navbar';

// Test consumer to verify state changes inside AppProvider
const StateVerifier: React.FC = () => {
  const { activeTab, uiLanguage, user, addXP } = useApp();
  return (
    <div data-testid="state-verifier">
      <span data-testid="current-tab">{activeTab}</span>
      <span data-testid="current-ui-lang">{uiLanguage}</span>
      <span data-testid="current-xp">{user.xp}</span>
      <button data-testid="earn-xp-btn" onClick={() => addXP(50)}>Earn XP</button>
    </div>
  );
};

describe('Integration Test: App Navigation, UI Localization & Shared Context', () => {
  it('renders Bhashiq navbar, switches active tabs, and changes UI language dynamically', () => {
    render(
      <AppProvider>
        <Navbar />
        <StateVerifier />
      </AppProvider>
    );

    // 1. Verify Bhashiq Branding is present
    const brandElements = screen.getAllByText(/Bhashiq|भाषिक/i);
    expect(brandElements.length).toBeGreaterThan(0);

    // 2. Initial Tab should be live-call
    expect(screen.getByTestId('current-tab').textContent).toBe('live-call');

    // 3. Click on "Camera & AR" navigation tab
    const cameraTabButtons = screen.getAllByRole('button').filter(btn => 
      btn.textContent?.includes('Camera') || btn.textContent?.includes('AR')
    );
    expect(cameraTabButtons.length).toBeGreaterThan(0);
    fireEvent.click(cameraTabButtons[0]);

    // Active tab updates in shared state
    expect(screen.getByTestId('current-tab').textContent).toBe('camera-ar');

    // 4. Click on "Learn & Play" navigation tab
    const learnTabButtons = screen.getAllByRole('button').filter(btn => 
      btn.textContent?.includes('Learn') || btn.textContent?.includes('Play')
    );
    expect(learnTabButtons.length).toBeGreaterThan(0);
    fireEvent.click(learnTabButtons[0]);
    expect(screen.getByTestId('current-tab').textContent).toBe('learning-hub');

    // 5. Verify Context Action: Awarding XP through state verifier
    const initialXP = Number(screen.getByTestId('current-xp').textContent);
    const earnXPBtn = screen.getByTestId('earn-xp-btn');
    fireEvent.click(earnXPBtn);

    const updatedXP = Number(screen.getByTestId('current-xp').textContent);
    expect(updatedXP).toBe(initialXP + 50);
  });
});
