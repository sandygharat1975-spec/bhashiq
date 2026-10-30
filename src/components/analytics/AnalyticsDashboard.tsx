import React from 'react';
import { BarChart3, Award, PieChart } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AnalyticsDashboard: React.FC = () => {
  const { user, savedWords } = useApp();

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-panel">
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" /> Language Analytics & Weekly Report
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Detailed metrics tracking your translation usage, speaking accuracy, and learning progression.
        </p>
      </div>

      {/* KPI Stats Grid (Directly matching PDF Page 12) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Words Learned</span>
          <div className="text-2xl font-black text-slate-900">{124 + savedWords.length}</div>
          <span className="text-[10px] text-emerald-600 font-bold">+18 this week</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Speaking Sessions</span>
          <div className="text-2xl font-black text-blue-600">17</div>
          <span className="text-[10px] text-slate-500 font-medium">Live calls & AI</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Translation Sessions</span>
          <div className="text-2xl font-black text-indigo-600">34</div>
          <span className="text-[10px] text-slate-500 font-medium">Camera + Text</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Average Accuracy</span>
          <div className="text-2xl font-black text-emerald-600">87%</div>
          <span className="text-[10px] text-emerald-600 font-bold">High precision</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel text-center space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Daily Streak</span>
          <div className="text-2xl font-black text-amber-600 flex items-center justify-center gap-1">
            <span>{user.streak}</span>
            <span>🔥</span>
          </div>
          <span className="text-[10px] text-amber-600 font-bold">Consistent learner</span>
        </div>
      </div>

      {/* Languages Used Breakdown (Page 12: Hindi 45%, English 35%, Spanish 20%) */}
      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Languages Used Breakdown</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Weekly Distribution</span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-200">
          <div className="bg-orange-500 h-full w-[45%]" title="Hindi 45%" />
          <div className="bg-blue-600 h-full w-[35%]" title="English 35%" />
          <div className="bg-amber-400 h-full w-[20%]" title="Spanish 20%" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-xs font-bold text-slate-800">🇮🇳 Hindi</span>
            </div>
            <span className="text-xs font-black font-mono text-orange-600">45%</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-xs font-bold text-slate-800">🇬🇧 English</span>
            </div>
            <span className="text-xs font-black font-mono text-blue-600">35%</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-xs font-bold text-slate-800">🇪🇸 Spanish</span>
            </div>
            <span className="text-xs font-black font-mono text-amber-600">20%</span>
          </div>
        </div>
      </div>

      {/* Activity Timeline / Viva Ready Summary */}
      <div className="p-6 rounded-3xl glass-panel space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-4 h-4 text-blue-600" /> Project Viva Performance Summary
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed">
          <strong>Bhashiq (भाषिक)</strong> architecture combines <strong>WebRTC signaling</strong>, <strong>Web Speech API (continuous SpeechRecognition + SpeechSynthesis)</strong>, 
          <strong>Tesseract.js OCR Computer Vision</strong>, and <strong>Linguistic Context Heuristics</strong> to eliminate the language barrier 
          across live voice phone calls, face-to-face conversations, and camera overlays with an integrated adaptive gamified learning engine.
        </p>
      </div>
    </div>
  );
};
