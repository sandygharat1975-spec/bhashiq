import React from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const BadgeModal: React.FC = () => {
  const { unlockedBadgeModal, closeBadgeModal } = useApp();

  if (!unlockedBadgeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="relative max-w-sm w-full p-6 rounded-3xl bg-white border-2 border-amber-400 shadow-2xl text-center space-y-4">
        <button
          onClick={closeBadgeModal}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-6xl animate-bounce-short">{unlockedBadgeModal.icon}</div>

        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 block mb-1">
            New Badge Unlocked!
          </span>
          <h3 className="text-xl font-black text-slate-900">{unlockedBadgeModal.title}</h3>
          <p className="text-xs text-slate-600 mt-2">{unlockedBadgeModal.description}</p>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 font-black text-xs">
          +{unlockedBadgeModal.xpReward} XP Reward Claimed!
        </div>

        <button
          onClick={closeBadgeModal}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 transition-all"
        >
          Awesome! Continue
        </button>
      </div>
    </div>
  );
};
