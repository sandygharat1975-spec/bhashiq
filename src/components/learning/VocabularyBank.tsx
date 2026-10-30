import React, { useState } from 'react';
import { Bookmark, Trash2, Volume2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { speechService } from '../../services/speechService';
import { SavedWord } from '../../types';

export const VocabularyBank: React.FC = () => {
  const { savedWords, deleteSavedWord, updateWordMastery, addXP, user } = useApp();

  const [activeTab, setActiveTab] = useState<'list' | 'flashcards' | 'revision-quiz'>('list');
  const [cardIdx, setCardIdx] = useState<number>(0);
  const [flipped, setFlipped] = useState<boolean>(false);

  // Revision quiz state
  const [quizIdx, setQuizIdx] = useState<number>(0);
  const [selectedQuizOpt, setSelectedQuizOpt] = useState<string | null>(null);

  const currentCard: SavedWord | undefined = savedWords[cardIdx];

  const handleNextCard = () => {
    setFlipped(false);
    setCardIdx((cardIdx + 1) % savedWords.length);
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-panel flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-500" /> Personal Vocabulary Bank
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Every word saved from calls, camera vision, or text translator is stored here with flashcards & auto revision quizzes.
          </p>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Word List ({savedWords.length})
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'flashcards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Flashcards
          </button>
          <button
            onClick={() => setActiveTab('revision-quiz')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'revision-quiz' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Auto Revision Quiz
          </button>
        </div>
      </div>

      {/* 1. Word List View */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          {savedWords.length === 0 ? (
            <div className="p-8 rounded-3xl glass-panel text-center text-slate-500">
              <Bookmark className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No words saved yet.</p>
              <p className="text-xs mt-1 text-slate-500">Click the bookmark icon on any translated text in Call, Camera, or Text modes to save it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {savedWords.map((word) => (
                <div
                  key={word.id}
                  className="p-4 rounded-2xl glass-panel space-y-2 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-black text-amber-700 font-mono uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {word.fromLang} → {word.toLang}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">{word.context || 'General'}</span>
                    </div>

                    <div className="text-lg font-black text-slate-900">{word.originalText}</div>
                    <div className="text-sm font-bold text-blue-700 mt-0.5">{word.translatedText}</div>
                    {word.phonetic && (
                      <span className="text-xs text-slate-500 font-mono italic">/{word.phonetic}/</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold">Mastery:</span>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <div
                            key={lvl}
                            className={`w-2.5 h-2.5 rounded-full ${
                              lvl <= word.masteryLevel ? 'bg-amber-500' : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => speechService.speak(word.originalText, word.fromLang, {
                          voiceGender: user.voiceGender,
                          rate: user.voiceSpeed,
                          tone: user.voiceTone,
                        })}
                        className="p-1 rounded-md text-blue-600 hover:text-blue-800 hover:bg-slate-100 transition-colors"
                        title="Pronounce"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSavedWord(word.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Word"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Interactive Flashcards View */}
      {activeTab === 'flashcards' && savedWords.length > 0 && currentCard && (
        <div className="max-w-md mx-auto space-y-4">
          <div
            onClick={() => setFlipped(!flipped)}
            className="h-64 rounded-3xl p-8 glass-panel border border-amber-300 flex flex-col items-center justify-center text-center cursor-pointer shadow-md transition-transform hover:scale-[1.02] select-none"
          >
            <span className="text-xs font-mono font-bold text-amber-700 uppercase tracking-widest block mb-4 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
              Card {cardIdx + 1} of {savedWords.length} • {flipped ? 'Meaning' : 'Question'}
            </span>

            {!flipped ? (
              <div>
                <h2 className="text-3xl font-black text-slate-900">{currentCard.originalText}</h2>
                <p className="text-xs text-slate-500 mt-2 font-medium">Tap card to reveal translation</p>
              </div>
            ) : (
              <div>
                <h2 className="text-3xl font-black text-blue-700">{currentCard.translatedText}</h2>
                {currentCard.phonetic && (
                  <p className="text-xs text-slate-600 font-mono mt-1">/{currentCard.phonetic}/</p>
                )}
                <p className="text-xs text-slate-500 mt-3 font-semibold">Context: {currentCard.context}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                updateWordMastery(currentCard.id, -1);
                handleNextCard();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Needs Practice
            </button>

            <button
              onClick={handleNextCard}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-xs transition-colors"
            >
              Next Flashcard
            </button>

            <button
              onClick={() => {
                updateWordMastery(currentCard.id, 1);
                handleNextCard();
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
            >
              I Got This!
            </button>
          </div>
        </div>
      )}

      {/* 3. Auto Revision Quiz View */}
      {activeTab === 'revision-quiz' && savedWords.length > 0 && (
        <div className="p-6 rounded-3xl glass-panel space-y-4 max-w-lg mx-auto text-center shadow-md">
          {(() => {
            const currentQ = savedWords[quizIdx % savedWords.length];
            const distractors = savedWords.filter(w => w.id !== currentQ.id).map(w => w.translatedText);
            const fallbackOptions = ['Good morning', 'Thank you', 'Where is the station?', 'Water please'];
            const allOptions = Array.from(new Set([currentQ.translatedText, ...distractors, ...fallbackOptions])).slice(0, 4);

            return (
              <div className="space-y-4">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                  Vocabulary Mastery Check
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  What is the meaning of "{currentQ.originalText}"?
                </h3>

                <div className="grid grid-cols-1 gap-2.5 pt-2">
                  {allOptions.map((opt, oIdx) => {
                    const isSelected = selectedQuizOpt === opt;
                    const isCorrect = opt === currentQ.translatedText;
                    return (
                      <button
                        key={oIdx}
                        disabled={selectedQuizOpt !== null}
                        onClick={() => {
                          setSelectedQuizOpt(opt);
                          if (isCorrect) {
                            addXP(20, 'Vocabulary revision quiz correct');
                          }
                        }}
                        className={`p-4 rounded-xl border text-sm font-semibold transition-all ${
                          selectedQuizOpt !== null && isCorrect
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold'
                            : selectedQuizOpt !== null && isSelected && !isCorrect
                            ? 'bg-rose-100 border-rose-500 text-rose-900'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {selectedQuizOpt !== null && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setSelectedQuizOpt(null);
                        setQuizIdx(prev => prev + 1);
                      }}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      Next Quiz Word
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
