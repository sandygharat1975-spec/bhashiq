import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { LiveCallHub } from './components/hubs/LiveCallHub';
import { VisionHub } from './components/hubs/VisionHub';
import { SmartTranslatorHub } from './components/hubs/SmartTranslatorHub';
import { LearningHub } from './components/hubs/LearningHub';
import { TravelSafetyHub } from './components/hubs/TravelSafetyHub';
import { VivaPresentationHub } from './components/common/VivaPresentationHub';
import { BadgeModal } from './components/common/BadgeModal';
import { LoginPage } from './components/auth/LoginPage';

const AppContent: React.FC = () => {
  const { activeTab, isAuthenticated } = useApp();

  // If user is not authenticated or explicitly on the login view,
  // show ONLY the dedicated LoginPage (NO internal studio navbar)
  if (!isAuthenticated || activeTab === 'login') {
    return <LoginPage />;
  }

  const renderActiveView = () => {
    if (['live-call', 'conversation', 'multi-speaker'].includes(activeTab)) {
      return <LiveCallHub />;
    }
    if (['camera-ar', 'document'].includes(activeTab)) {
      return <VisionHub />;
    }
    if (['text-context', 'speech', 'pronunciation'].includes(activeTab)) {
      return <SmartTranslatorHub />;
    }
    if (['learning-hub', 'mini-games', 'multiplayer', 'ai-tutor', 'vocab-bank', 'adaptive-learning', 'language-buddy'].includes(activeTab)) {
      return <LearningHub />;
    }
    if (['travel', 'emergency', 'analytics'].includes(activeTab)) {
      return <TravelSafetyHub />;
    }
    if (activeTab === 'viva-hub') {
      return <VivaPresentationHub />;
    }
    return <LiveCallHub />;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-violet-600 selection:text-white relative overflow-x-hidden">
      {/* Crisp White Canvas with subtle pastel ambient illumination */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(124,58,237,0.04),rgba(255,255,255,0))]" />
      <div className="fixed -top-32 left-10 w-96 h-96 bg-violet-500/[0.03] rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed top-1/3 -right-20 w-[500px] h-[500px] bg-cyan-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

      <Navbar />

      {/* Main Full-Width Content Workspace (Panoramic & Responsive with Zero Empty Side Margins) */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-5 pb-24 md:pb-8 relative z-10">
        {renderActiveView()}
      </main>

      <BadgeModal />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
