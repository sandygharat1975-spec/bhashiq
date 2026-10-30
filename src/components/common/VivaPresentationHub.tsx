import React, { useState } from 'react';
import { 
  GraduationCap, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Layers 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const VivaPresentationHub: React.FC = () => {
  const { setActiveTab } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const vivaQuestions = [
    {
      q: "1. What is the core USP of Bhashiq and how does the live call translation work?",
      a: "The USP is real-time bidirectional call translation. When Person A speaks Hindi, client-side Speech-to-Text (STT) streams interim and final tokens. The translation engine matches phrases or queries the linguistic layer, and Web Speech Synthesis (TTS) renders the translated English voice to Person B with under 50ms processing latency. Live subtitles are mirrored in real time for accessibility."
    },
    {
      q: "2. How does the Camera & AR Vision Translator recognize text on menus and signboards?",
      a: "It utilizes Tesseract.js (WebAssembly-compiled OCR) to perform spatial bounding box extraction directly inside the browser canvas. The system localizes text coordinates (x0, y0, x1, y1), translates the detected strings, and renders translated text labels over the original positions creating an augmented reality overlay."
    },
    {
      q: "3. How is the Pronunciation Accuracy calculated?",
      a: "The pronunciation evaluation algorithm performs tokenized phoneme and word-level alignment using normalized Levenshtein edit distance. Accuracy is formulated as: Accuracy = (1 - Distance / max(len(spoken), len(target))) * 100%. The system highlights missed words and phonetic guidance."
    },
    {
      q: "4. What is Back-Translation and why was it implemented?",
      a: "Back-translation is a quality verification mechanism. The original phrase is translated to the target language and immediately translated back to the source language. A Dice-Sørensen semantic similarity index is computed to verify that meaning and nuance were not distorted during translation."
    },
    {
      q: "5. How does the system handle ambiguous homonyms and idioms?",
      a: "For polysemous homonyms (e.g. 'Bank' = Financial institution vs River bank), the system detects multi-meaning tokens and offers contextual disambiguation chips. For idioms (e.g. 'What\\'s up?'), rule-based contextual translation overrides literal word-for-word translation to avoid erroneous outputs like 'What is physically above?'"
    },
    {
      q: "6. Explain the real-time networking architecture for multi-device calls.",
      a: "We developed a lightweight Node.js Express + Socket.IO signaling server. When two clients join the same Room Code (e.g. 'LL-2026'), the server negotiates peer signaling and relays transcript events, allowing two distinct phones or computers to experience synchronized live translation across the room."
    },
    {
      q: "7. How does the Voice-Preservation Mode work?",
      a: "Rather than using a uniform robotic voice, the speech synthesis parameters dynamically adjust pitch (e.g., 0.88 for male vocal depth, 1.15 for female profiles), speaking rate (0.8x - 1.2x), and emotional tone presets to mirror the speaker's vocal characteristics in the translated output."
    },
    {
      q: "8. What offline capabilities exist for travelers and emergencies?",
      a: "The Travel Mode and Emergency SOS modules utilize pre-cached local dictionary packages stored in memory. Even without internet connectivity, travelers can broadcast loud distress messages in 6+ languages and access airport, taxi, and hotel phrasebooks."
    }
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/20 rounded-2xl text-white">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Bhashiq Viva & Project Evaluation Hub</h1>
            <p className="text-xs text-blue-100 mt-1 font-medium">
              Comprehensive technical reference, mathematical formulations, and examiner Q&A answers for your college project evaluation.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Demo Workflow Navigator */}
      <div className="p-5 rounded-2xl glass-panel space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" /> Recommended 3-Minute Viva Demonstration Flow:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <button 
            onClick={() => setActiveTab('live-call')}
            className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-left transition-all shadow-xs"
          >
            <span className="font-bold text-blue-600 block mb-1">Step 1: Live Call</span>
            <p className="text-slate-500 text-[11px]">Show live voice translation with Rahul & real-time subtitles.</p>
          </button>

          <button 
            onClick={() => setActiveTab('camera-ar')}
            className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-left transition-all shadow-xs"
          >
            <span className="font-bold text-cyan-600 block mb-1">Step 2: AR Vision</span>
            <p className="text-slate-500 text-[11px]">Show OCR overlay on Marathi menu (Misal Pav ₹120).</p>
          </button>

          <button 
            onClick={() => setActiveTab('text-context')}
            className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-left transition-all shadow-xs"
          >
            <span className="font-bold text-indigo-600 block mb-1">Step 3: Context AI</span>
            <p className="text-slate-500 text-[11px]">Show "Bank" homonym and "What's up?" idiom detection.</p>
          </button>

          <button 
            onClick={() => setActiveTab('learning-hub')}
            className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-left transition-all shadow-xs"
          >
            <span className="font-bold text-amber-600 block mb-1">Step 4: Gamification</span>
            <p className="text-slate-500 text-[11px]">Show badges, XP level, and 1v1 multiplayer arena.</p>
          </button>
        </div>
      </div>

      {/* System Architecture Specifications */}
      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" /> Technical Architecture Specifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
            <span className="font-bold text-blue-700 uppercase tracking-wider block">Front-End Layer</span>
            <ul className="space-y-1.5 text-slate-600 font-medium">
              <li>• <strong>Framework:</strong> React 19 + TypeScript (strict typing)</li>
              <li>• <strong>Styling:</strong> Tailwind CSS + Light Glassmorphism UX</li>
              <li>• <strong>Speech Recognition:</strong> Native Web Speech API</li>
              <li>• <strong>Speech Synthesis:</strong> Web SpeechSynthesis Utterance</li>
              <li>• <strong>Computer Vision:</strong> Tesseract.js WebAssembly OCR</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
            <span className="font-bold text-indigo-700 uppercase tracking-wider block">Signaling & Backend Layer</span>
            <ul className="space-y-1.5 text-slate-600 font-medium">
              <li>• <strong>Runtime:</strong> Node.js + Express</li>
              <li>• <strong>Signaling:</strong> Socket.IO Room Channels (Port 5001)</li>
              <li>• <strong>Audio Synthesis:</strong> Web Audio API (OscillatorNode)</li>
              <li>• <strong>Offline Caching:</strong> LocalStorage + Phrasebook caches</li>
              <li>• <strong>Verification:</strong> Round-trip Back-Translation engine</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Examiner Viva Q&A Accordion */}
      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-800">Top Viva Questions & Examiner Answers</h2>
        </div>

        <div className="space-y-3">
          {vivaQuestions.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-slate-800 hover:text-blue-600 transition-colors"
                >
                  <span>{item.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 animate-fade-in font-medium">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
