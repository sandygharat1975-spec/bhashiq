import React, { useState } from 'react';
import { Compass, Volume2, Bookmark, WifiOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TRAVEL_PACKS } from '../../data/mockData';
import { speechService } from '../../services/speechService';
import { SupportedLanguage } from '../../types';

export const TravelMode: React.FC = () => {
  const { user, saveWordToBank } = useApp();

  const [route, setRoute] = useState<string>('hi-to-ja');
  const [activeCategory, setActiveCategory] = useState<string>('taxi');

  const packs = TRAVEL_PACKS[route] || TRAVEL_PACKS['hi-to-ja'];
  const currentCategory = packs.find(c => c.id === activeCategory) || packs[0];

  const targetLangCode: SupportedLanguage = route === 'hi-to-ja' ? 'ja' : 'es';

  return (
    <div className="w-full space-y-5 animate-fade-in">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-panel flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" /> Travel Mode & Offline Packs
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Pre-packaged country travel phrasebooks with instant audio synthesis. Cached locally for offline access.
          </p>
        </div>

        {/* Route Selector */}
        <div className="flex items-center space-x-2 bg-white p-1.5 rounded-xl border border-slate-200 text-xs shadow-xs">
          <span className="text-slate-600 pl-1 font-medium">Route:</span>
          <select
            value={route}
            onChange={(e) => {
              setRoute(e.target.value);
              setActiveCategory('taxi');
            }}
            className="bg-transparent text-slate-800 outline-none font-semibold cursor-pointer"
          >
            <option value="hi-to-ja">🇮🇳 India → 🇯🇵 Japan</option>
            <option value="hi-to-es">🇮🇳 India → 🇪🇸 Spain</option>
          </select>

          <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
            <WifiOff className="w-3 h-3" /> Offline Ready
          </span>
        </div>
      </div>

      {/* Category Pills (Taxi, Food, Hotel, Transport, Shopping, Emergency) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {packs.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center space-x-2 transition-all ${
              activeCategory === cat.id
                ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-xs'
            }`}
          >
            <span className="text-lg">{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Phrase Cards */}
      <div className="space-y-3">
        {currentCategory.phrases.map((phrase, pIdx) => (
          <div
            key={pIdx}
            className="p-4 rounded-2xl glass-panel space-y-2 border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs"
          >
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium">"{phrase.en}"</span>
              <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>{phrase.target}</span>
              </div>
              <p className="text-xs font-mono text-blue-700 font-bold">/{phrase.phonetic}/</p>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={() => speechService.speak(phrase.target, targetLangCode, {
                  voiceGender: user.voiceGender,
                  rate: user.voiceSpeed,
                  tone: user.voiceTone,
                })}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Play Audio</span>
              </button>

              <button
                onClick={() => saveWordToBank({
                  originalText: phrase.en,
                  translatedText: phrase.target,
                  fromLang: 'en',
                  toLang: targetLangCode,
                  phonetic: phrase.phonetic,
                  context: `Travel Mode: ${currentCategory.name}`
                })}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-600 transition-colors"
                title="Save to Vocabulary"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
