import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  Volume2, 
  Mic
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MINI_GAMES_DATA } from '../../data/mockData';
import { speechService } from '../../services/speechService';
import { SupportedLanguage } from '../../types';

export const MiniGames: React.FC = () => {
  const { addXP } = useApp();

  const [activeGame, setActiveGame] = useState<'word-match' | 'listening' | 'translation' | 'speaking'>('word-match');

  // Stop any active speech listening or speaking when unmounting or navigating away
  useEffect(() => {
    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
    };
  }, []);

  // --- 1. Word Match Game State ---
  const [selectedWord1, setSelectedWord1] = useState<{ id: string; type: 'en' | 'target'; text: string } | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);

  // --- 2. Listening Challenge State ---
  const [listenIdx, setListenIdx] = useState<number>(0);
  const [selectedListenOpt, setSelectedListenOpt] = useState<number | null>(null);
  const [listenSubmitted, setListenSubmitted] = useState<boolean>(false);

  // --- 3. Translation Challenge State ---
  const [transIdx, setTransIdx] = useState<number>(0);
  const [selectedTransOpt, setSelectedTransOpt] = useState<number | null>(null);
  const [transSubmitted, setTransSubmitted] = useState<boolean>(false);

  // --- 4. Speaking Challenge State ---
  const [speakIdx, setSpeakIdx] = useState<number>(0);
  const [isSpeakingMic, setIsSpeakingMic] = useState<boolean>(false);
  const [speakFeedback, setSpeakFeedback] = useState<string | null>(null);

  // Word Match Logic
  const handleWordMatchClick = (id: string, type: 'en' | 'target', text: string) => {
    if (matchedPairs.includes(id)) return;

    if (!selectedWord1) {
      setSelectedWord1({ id, type, text });
      return;
    }

    if (selectedWord1.type === type) {
      setSelectedWord1({ id, type, text });
      return;
    }

    // Checking match
    if (selectedWord1.id === id) {
      setMatchedPairs(prev => [...prev, id]);
      setSelectedWord1(null);
      addXP(15, 'Word Match found');
    } else {
      setSelectedWord1(null);
    }
  };

  // Listening Question Play
  const playListenClip = () => {
    const q = MINI_GAMES_DATA.listeningQuestions[listenIdx];
    speechService.speak(q.audioText, q.lang as SupportedLanguage, {
      voiceGender: 'female',
      rate: 0.9
    });
  };

  const handleListenAnswer = (optIdx: number) => {
    if (listenSubmitted) return;
    setSelectedListenOpt(optIdx);
    setListenSubmitted(true);
    const q = MINI_GAMES_DATA.listeningQuestions[listenIdx];
    if (optIdx === q.correctIndex) {
      addXP(25, 'Listening Challenge Correct');
    }
  };

  const handleTransAnswer = (optIdx: number) => {
    if (transSubmitted) return;
    setSelectedTransOpt(optIdx);
    setTransSubmitted(true);
    const q = MINI_GAMES_DATA.translationQuestions[transIdx];
    if (optIdx === q.correctIndex) {
      addXP(25, 'Translation Challenge Correct');
    }
  };

  // Speaking Challenge Mic
  const startSpeakingChallengeMic = () => {
    const challenge = MINI_GAMES_DATA.speakingChallenges[speakIdx];
    setIsSpeakingMic(true);
    setSpeakFeedback(null);

    speechService.startListening(
      challenge.targetLang as SupportedLanguage,
      (transcript, isFinal) => {
        if (isFinal) {
          setIsSpeakingMic(false);
          const evalResult = speechService.evaluatePronunciation(challenge.targetPhrase, transcript);
          if (evalResult.accuracy >= 70) {
            setSpeakFeedback(`Awesome! ${evalResult.accuracy}% accuracy: "${transcript}"`);
            addXP(30, 'Speaking Challenge Completed');
          } else {
            setSpeakFeedback(`Keep trying! ${evalResult.accuracy}% match. You said: "${transcript}"`);
          }
        }
      },
      () => setIsSpeakingMic(false),
      () => setIsSpeakingMic(false)
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-panel">
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-indigo-600" /> Interactive Language Mini Games
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Reinforce vocabulary and comprehension through quick interactive game challenges.
        </p>
      </div>

      {/* Game Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setActiveGame('word-match')}
          className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
            activeGame === 'word-match'
              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-xs'
          }`}
        >
          🧩 Word Match
        </button>

        <button
          onClick={() => setActiveGame('listening')}
          className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
            activeGame === 'listening'
              ? 'bg-cyan-600 border-cyan-600 text-white shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-xs'
          }`}
        >
          🎧 Listening Challenge
        </button>

        <button
          onClick={() => setActiveGame('translation')}
          className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
            activeGame === 'translation'
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-xs'
          }`}
        >
          📝 Translation Quiz
        </button>

        <button
          onClick={() => setActiveGame('speaking')}
          className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
            activeGame === 'speaking'
              ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-xs'
          }`}
        >
          🎤 Speaking Challenge
        </button>
      </div>

      {/* 1. WORD MATCH GAME */}
      {activeGame === 'word-match' && (
        <div className="p-6 rounded-3xl glass-panel space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Match Word Pairs</h3>
              <p className="text-xs text-slate-500">Match English words on the left with Spanish on the right</p>
            </div>
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
              {matchedPairs.length} / {MINI_GAMES_DATA.wordMatchPairs.length} Pairs Matched
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* English Column */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">English</span>
              {MINI_GAMES_DATA.wordMatchPairs.map(p => {
                const isMatched = matchedPairs.includes(p.id);
                const isSelected = selectedWord1?.id === p.id && selectedWord1.type === 'en';
                return (
                  <button
                    key={`en-${p.id}`}
                    disabled={isMatched}
                    onClick={() => handleWordMatchClick(p.id, 'en', p.en)}
                    className={`w-full p-3.5 rounded-xl border text-left text-sm font-semibold transition-all ${
                      isMatched 
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800 cursor-default line-through' 
                        : isSelected 
                        ? 'bg-blue-100 border-blue-500 text-blue-900 ring-2 ring-blue-500/30' 
                        : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {p.en}
                  </button>
                );
              })}
            </div>

            {/* Target Language Column (Scrambled) */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-2">Spanish</span>
              {[...MINI_GAMES_DATA.wordMatchPairs].reverse().map(p => {
                const isMatched = matchedPairs.includes(p.id);
                const isSelected = selectedWord1?.id === p.id && selectedWord1.type === 'target';
                return (
                  <button
                    key={`target-${p.id}`}
                    disabled={isMatched}
                    onClick={() => handleWordMatchClick(p.id, 'target', p.target)}
                    className={`w-full p-3.5 rounded-xl border text-left text-sm font-semibold transition-all ${
                      isMatched 
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800 cursor-default line-through' 
                        : isSelected 
                        ? 'bg-blue-100 border-blue-500 text-blue-900 ring-2 ring-blue-500/30' 
                        : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {p.target}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. LISTENING CHALLENGE */}
      {activeGame === 'listening' && (
        <div className="p-6 rounded-3xl glass-panel space-y-4">
          {(() => {
            const q = MINI_GAMES_DATA.listeningQuestions[listenIdx];
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-xs font-bold text-slate-500">
                    Question {listenIdx + 1} of {MINI_GAMES_DATA.listeningQuestions.length}
                  </span>
                  <span className="text-xs font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full">+25 XP</span>
                </div>

                <div className="text-center py-4 space-y-3">
                  <p className="text-xs text-slate-600 font-medium">{q.prompt}</p>
                  <button
                    onClick={playListenClip}
                    className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 mx-auto shadow-md transition-all active:scale-95"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Play Audio Clip</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = selectedListenOpt === oIdx;
                    const isCorrect = oIdx === q.correctIndex;
                    return (
                      <button
                        key={oIdx}
                        disabled={listenSubmitted}
                        onClick={() => handleListenAnswer(oIdx)}
                        className={`p-4 rounded-2xl border text-left text-xs font-semibold transition-all ${
                          listenSubmitted && isCorrect
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold'
                            : listenSubmitted && isSelected && !isCorrect
                            ? 'bg-rose-100 border-rose-500 text-rose-900'
                            : isSelected
                            ? 'bg-cyan-100 border-cyan-500 text-cyan-900'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {listenSubmitted && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                    <span>💡 {q.explanation}</span>
                    <button
                      onClick={() => {
                        setListenSubmitted(false);
                        setSelectedListenOpt(null);
                        setListenIdx((listenIdx + 1) % MINI_GAMES_DATA.listeningQuestions.length);
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* 3. TRANSLATION CHALLENGE */}
      {activeGame === 'translation' && (
        <div className="p-6 rounded-3xl glass-panel space-y-4">
          {(() => {
            const q = MINI_GAMES_DATA.translationQuestions[transIdx];
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-xs font-bold text-slate-500">
                    Challenge {transIdx + 1} of {MINI_GAMES_DATA.translationQuestions.length}
                  </span>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">+25 XP</span>
                </div>

                <div className="text-center py-4">
                  <h3 className="text-xl font-black text-slate-900">{q.prompt}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = selectedTransOpt === oIdx;
                    const isCorrect = oIdx === q.correctIndex;
                    return (
                      <button
                        key={oIdx}
                        disabled={transSubmitted}
                        onClick={() => handleTransAnswer(oIdx)}
                        className={`p-4 rounded-2xl border text-left text-xs font-semibold transition-all ${
                          transSubmitted && isCorrect
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold'
                            : transSubmitted && isSelected && !isCorrect
                            ? 'bg-rose-100 border-rose-500 text-rose-900'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        <span className="text-slate-400 font-mono mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {transSubmitted && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                    <span>💡 {q.explanation}</span>
                    <button
                      onClick={() => {
                        setTransSubmitted(false);
                        setSelectedTransOpt(null);
                        setTransIdx((transIdx + 1) % MINI_GAMES_DATA.translationQuestions.length);
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Next Question
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* 4. SPEAKING CHALLENGE */}
      {activeGame === 'speaking' && (
        <div className="p-6 rounded-3xl glass-panel space-y-4">
          {(() => {
            const ch = MINI_GAMES_DATA.speakingChallenges[speakIdx];
            return (
              <div className="space-y-4 text-center">
                <div>
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                    Speech Mission #{speakIdx + 1}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">{ch.prompt}</h3>
                  <p className="text-xs text-slate-500 mt-1">Hint: {ch.hints}</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Target Expression:</span>
                  <p className="text-lg font-black text-slate-900">{ch.targetPhrase}</p>
                  <p className="text-xs font-mono text-blue-600 font-bold">/{ch.phonetic}/</p>
                </div>

                {/* Speak button */}
                <button
                  onClick={startSpeakingChallengeMic}
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all shadow-lg active:scale-95 ${
                    isSpeakingMic 
                      ? 'bg-rose-600 text-white animate-pulse ring-8 ring-rose-200' 
                      : 'bg-gradient-to-tr from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white shadow-rose-500/25'
                  }`}
                >
                  <Mic className="w-8 h-8" />
                </button>
                <span className="text-xs text-slate-700 block font-bold">
                  {isSpeakingMic ? 'Listening... Speak target phrase now' : 'Tap Mic & Speak Answer'}
                </span>

                {speakFeedback && (
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900 animate-fade-in flex items-center justify-between">
                    <span>{speakFeedback}</span>
                    <button
                      onClick={() => {
                        setSpeakFeedback(null);
                        setSpeakIdx((speakIdx + 1) % MINI_GAMES_DATA.speakingChallenges.length);
                      }}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Next Mission
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
};
