import React, { useState } from 'react';
import { BrainCircuit, AlertTriangle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ADAPTIVE_CHALLENGES } from '../../data/mockData';

export const PersonalizedLearning: React.FC = () => {
  const { addXP } = useApp();

  const [activeArea, setActiveArea] = useState<'pastTense' | 'genderAgreement'>('pastTense');
  const [inChallenge, setInChallenge] = useState<boolean>(false);
  const [qIdx, setQIdx] = useState<number>(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);

  const challengeData = ADAPTIVE_CHALLENGES[activeArea];
  const q = challengeData.questions[qIdx];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOpt(idx);
    setIsAnswered(true);

    if (idx === q.correctIndex) {
      addXP(20, 'Adaptive weak-area question solved');
    }
  };

  const handleNext = () => {
    if (qIdx + 1 < challengeData.questions.length) {
      setQIdx(prev => prev + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
    } else {
      setCompleted(true);
      addXP(40, 'Completed 5-minute Adaptive Challenge');
    }
  };

  const resetChallenge = () => {
    setInChallenge(false);
    setQIdx(0);
    setSelectedOpt(null);
    setIsAnswered(false);
    setCompleted(false);
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-panel">
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-amber-500" /> Personalized Adaptive Learning
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Analyzes historical quiz mistakes, isolates weak grammatical patterns, and auto-generates 5-minute targeted drills.
        </p>
      </div>

      {!inChallenge ? (
        <div className="space-y-4">
          {/* Detected Weak Areas (Page 10 of PDF) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Weak Area 1: Past Tense */}
            <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-300 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-amber-900 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Detected Weak Area: Past Tense
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/70 text-amber-900 font-mono">
                  42% Accuracy
                </span>
              </div>
              <p className="text-xs text-slate-700">
                You frequently confuse past tense conjugations across English, Hindi ("गया था"), and Spanish ("Comí").
              </p>
              <button
                onClick={() => {
                  setActiveArea('pastTense');
                  setInChallenge(true);
                  setQIdx(0);
                  setCompleted(false);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xs transition-all"
              >
                Launch 5-Minute Past Tense Challenge
              </button>
            </div>

            {/* Weak Area 2: Gender Agreement */}
            <div className="p-5 rounded-3xl bg-indigo-50/80 border border-indigo-200 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-indigo-900 text-sm">
                  <AlertTriangle className="w-4 h-4 text-indigo-600" /> Detected Weak Area: Gender Agreements
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 font-mono">
                  55% Accuracy
                </span>
              </div>
              <p className="text-xs text-slate-700">
                Occasional mismatch in feminine/masculine verb agreements ("रहा/रही" in Hindi & "El/La" in Spanish).
              </p>
              <button
                onClick={() => {
                  setActiveArea('genderAgreement');
                  setInChallenge(true);
                  setQIdx(0);
                  setCompleted(false);
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-xs transition-all"
              >
                Launch Gender Agreement Booster
              </button>
            </div>

          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl glass-panel space-y-4 shadow-sm">
          {!completed ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900 text-xs">{challengeData.title}</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">
                  Question {qIdx + 1} of {challengeData.questions.length}
                </span>
              </div>

              <div className="text-center py-4">
                <h3 className="text-xl font-black text-slate-900">{q.prompt}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((opt, oIdx) => {
                  const isSelected = selectedOpt === oIdx;
                  const isCorrect = oIdx === q.correctIndex;
                  return (
                    <button
                      key={oIdx}
                      disabled={isAnswered}
                      onClick={() => handleSelect(oIdx)}
                      className={`p-4 rounded-2xl border text-left text-sm font-semibold transition-all ${
                        isAnswered && isCorrect
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold'
                          : isAnswered && isSelected && !isCorrect
                          ? 'bg-rose-100 border-rose-500 text-rose-900'
                          : isSelected
                          ? 'bg-blue-100 border-blue-500 text-blue-900'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between animate-fade-in shadow-xs">
                  <span>💡 {q.explanation}</span>
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Next Question
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 space-y-4 animate-fade-in">
              <div className="text-5xl">🎯</div>
              <h2 className="text-2xl font-black text-slate-900">Adaptive Drill Completed!</h2>
              <p className="text-xs text-slate-600">
                You've strengthened your mastery of <strong>{challengeData.area}</strong>. Your accuracy is now predicted to exceed 75%!
              </p>
              <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300">
                +40 XP Earned
              </div>
              <div className="pt-2">
                <button
                  onClick={resetChallenge}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Return to Weak Areas Hub
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
