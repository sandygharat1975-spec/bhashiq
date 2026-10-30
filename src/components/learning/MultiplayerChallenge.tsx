import React, { useState, useEffect } from 'react';
import { Swords, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MULTIPLAYER_QUIZ_POOL } from '../../data/mockData';

export const MultiplayerChallenge: React.FC = () => {
  const { user, addXP, triggerConfetti } = useApp();

  const [matchState, setMatchState] = useState<'lobby' | 'playing' | 'gameover'>('lobby');
  const [currentQIdx, setCurrentQIdx] = useState<number>(0);
  const [userScore, setUserScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);

  const opponentName = 'Aryan Sharma';

  // Timer countdown
  useEffect(() => {
    let timer: any = null;
    if (matchState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (matchState === 'playing' && timeLeft === 0) {
      handleNextQuestion(false);
    }
    return () => clearInterval(timer);
  }, [matchState, timeLeft]);

  const startMatch = () => {
    setMatchState('playing');
    setCurrentQIdx(0);
    setUserScore(0);
    setOpponentScore(0);
    setTimeLeft(10);
    setSelectedOpt(null);
  };

  const handleSelectOption = (idx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);

    const q = MULTIPLAYER_QUIZ_POOL[currentQIdx];
    const isUserCorrect = idx === q.correctIndex;

    // Simulate opponent response (75% chance correct)
    const isOpponentCorrect = Math.random() > 0.3;

    if (isUserCorrect) setUserScore(s => s + 10);
    if (isOpponentCorrect) setOpponentScore(s => s + 10);

    setTimeout(() => {
      handleNextQuestion(isUserCorrect);
    }, 1200);
  };

  const handleNextQuestion = (_userWasCorrect: boolean) => {
    if (currentQIdx + 1 < MULTIPLAYER_QUIZ_POOL.length) {
      setCurrentQIdx(prev => prev + 1);
      setTimeLeft(10);
      setSelectedOpt(null);
    } else {
      // Game Over
      setMatchState('gameover');
      if (userScore >= opponentScore) {
        addXP(100, 'Multiplayer Duel Won!');
        triggerConfetti();
      } else {
        addXP(30, 'Multiplayer Duel Runner-up');
      }
    }
  };

  const q = MULTIPLAYER_QUIZ_POOL[currentQIdx];

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-panel">
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Swords className="w-5 h-5 text-rose-600" /> 1v1 Multiplayer Language Arena
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Compete in rapid head-to-head quizzes with live score updates. Winner gets +100 XP.
        </p>
      </div>

      {matchState === 'lobby' && (
        <div className="p-8 rounded-3xl glass-panel text-center space-y-6">
          <div className="flex items-center justify-center space-x-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-blue-100 border-2 border-blue-500 flex items-center justify-center text-3xl mx-auto shadow-sm">
                👤
              </div>
              <h4 className="font-bold text-slate-900 text-sm mt-2">{user.name}</h4>
              <span className="text-[11px] text-blue-700 font-mono font-bold">Level {user.level}</span>
            </div>

            <div className="text-2xl font-black text-rose-600 animate-pulse">
              VS
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-rose-100 border-2 border-rose-500 flex items-center justify-center text-3xl mx-auto shadow-sm">
                ⚡
              </div>
              <h4 className="font-bold text-slate-900 text-sm mt-2">{opponentName}</h4>
              <span className="text-[11px] text-rose-700 font-mono font-bold">Challenger</span>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-base">Speed Translation Duel</h3>
            <p className="text-xs text-slate-600">10 seconds per question. Highest score claims victory and +100 XP reward.</p>
          </div>

          <button
            onClick={startMatch}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-sm uppercase tracking-wider shadow-md shadow-rose-600/20 active:scale-95 transition-all"
          >
            Start 1v1 Match
          </button>
        </div>
      )}

      {matchState === 'playing' && (
        <div className="space-y-4">
          {/* Live Scoreboard */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-base font-black text-blue-600">{user.name}: {userScore} pts</span>
            </div>

            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 font-mono text-xs font-bold text-amber-800">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>{timeLeft}s</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-base font-black text-rose-600">{opponentName}: {opponentScore} pts</span>
            </div>
          </div>

          {/* Question Box */}
          <div className="p-6 rounded-3xl glass-panel space-y-4 text-center">
            <span className="text-xs font-mono font-bold text-slate-500">
              Question {currentQIdx + 1} of {MULTIPLAYER_QUIZ_POOL.length}
            </span>
            <h3 className="text-2xl font-black text-slate-900">{q.prompt}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
              {q.options.map((opt, oIdx) => {
                const isSelected = selectedOpt === oIdx;
                const isCorrect = oIdx === q.correctIndex;
                return (
                  <button
                    key={oIdx}
                    disabled={selectedOpt !== null}
                    onClick={() => handleSelectOption(oIdx)}
                    className={`p-4 rounded-2xl border text-left text-sm font-semibold transition-all ${
                      selectedOpt !== null && isCorrect
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold'
                        : selectedOpt !== null && isSelected && !isCorrect
                        ? 'bg-rose-100 border-rose-500 text-rose-900'
                        : isSelected
                        ? 'bg-blue-100 border-blue-500 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <span className="text-slate-400 font-mono mr-2">{oIdx + 1}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {matchState === 'gameover' && (
        <div className="p-8 rounded-3xl glass-panel text-center space-y-4 animate-fade-in">
          <div className="text-5xl">{userScore >= opponentScore ? '🏆' : '🥈'}</div>
          <h2 className="text-2xl font-black text-slate-900">
            {userScore >= opponentScore ? 'Victory! You Won the Duel!' : 'Close Match! Good Effort!'}
          </h2>
          <p className="text-xs text-slate-600">
            Final Score: You ({userScore} pts) — {opponentName} ({opponentScore} pts)
          </p>
          <div className="inline-block px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300">
            +{userScore >= opponentScore ? '100' : '30'} XP Earned
          </div>

          <div className="pt-4">
            <button
              onClick={startMatch}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-colors"
            >
              Play Rematch
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
