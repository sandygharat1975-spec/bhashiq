import React, { useState, useEffect } from 'react';
import { Camera, FileText, Sparkles } from 'lucide-react';
import { CameraTranslator } from '../vision/CameraTranslator';
import { DocumentTranslator } from '../vision/DocumentTranslator';
import { useApp } from '../../context/AppContext';

export const VisionHub: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const getSubMode = (): 'camera' | 'document' => {
    return activeTab === 'document' ? 'document' : 'camera';
  };

  const [subMode, setSubMode] = useState<'camera' | 'document'>(getSubMode());

  useEffect(() => {
    if (activeTab === 'document') setSubMode('document');
    else if (activeTab === 'camera-ar') setSubMode('camera');
  }, [activeTab]);

  const handleSelectMode = (mode: 'camera' | 'document') => {
    setSubMode(mode);
    if (mode === 'camera') setActiveTab('camera-ar');
    else setActiveTab('document');
  };

  return (
    <div className="w-full space-y-5">
      {/* Sleek Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 cyber-card p-2.5 sm:p-3 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse ml-2" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            Computer Vision & AR Translation:
          </span>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
          <button
            onClick={() => handleSelectMode('camera')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
              subMode === 'camera'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-sm ring-1 ring-cyan-400/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>AR Camera & Signage</span>
          </button>

          <button
            onClick={() => handleSelectMode('document')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
              subMode === 'document'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm ring-1 ring-indigo-400/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Document & Text Files</span>
          </button>
        </div>
      </div>

      {/* Render active sub-tool */}
      <div className="animate-fade-in w-full">
        {subMode === 'camera' && <CameraTranslator />}
        {subMode === 'document' && <DocumentTranslator />}
      </div>
    </div>
  );
};
