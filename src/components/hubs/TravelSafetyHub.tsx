import React, { useState, useEffect } from 'react';
import { Compass, AlertOctagon, BarChart3, Sparkles } from 'lucide-react';
import { TravelMode } from '../travel/TravelMode';
import { EmergencyMode } from '../travel/EmergencyMode';
import { AnalyticsDashboard } from '../analytics/AnalyticsDashboard';
import { useApp } from '../../context/AppContext';

export const TravelSafetyHub: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  type SubMode = 'phrases' | 'sos' | 'analytics';

  const getSubMode = (): SubMode => {
    if (activeTab === 'emergency') return 'sos';
    if (activeTab === 'analytics') return 'analytics';
    return 'phrases';
  };

  const [subMode, setSubMode] = useState<SubMode>(getSubMode());

  useEffect(() => {
    if (activeTab === 'emergency') setSubMode('sos');
    else if (activeTab === 'analytics') setSubMode('analytics');
    else if (activeTab === 'travel') setSubMode('phrases');
  }, [activeTab]);

  const handleSelectMode = (mode: SubMode) => {
    setSubMode(mode);
    if (mode === 'phrases') setActiveTab('travel');
    else if (mode === 'sos') setActiveTab('emergency');
    else if (mode === 'analytics') setActiveTab('analytics');
  };

  return (
    <div className="w-full space-y-5">
      {/* Sleek Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 cyber-card p-2.5 sm:p-3 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse ml-2" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            Travel Assistance & Distress SOS Center:
          </span>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
          <button
            onClick={() => handleSelectMode('phrases')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
              subMode === 'phrases'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Travel Phrasebooks</span>
          </button>

          <button
            onClick={() => handleSelectMode('sos')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
              subMode === 'sos'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm ring-1 ring-red-400/50'
                : 'text-rose-600 hover:text-rose-800 hover:bg-white'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Emergency SOS</span>
            <span className="ml-1 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider rounded bg-rose-50 text-rose-700 border border-rose-300">
              GPS Verified
            </span>
          </button>

          <button
            onClick={() => handleSelectMode('analytics')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
              subMode === 'analytics'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Linguistic Analytics</span>
          </button>
        </div>
      </div>

      {/* Render active sub-tool */}
      <div className="animate-fade-in w-full">
        {subMode === 'phrases' && <TravelMode />}
        {subMode === 'sos' && <EmergencyMode />}
        {subMode === 'analytics' && <AnalyticsDashboard />}
      </div>
    </div>
  );
};
