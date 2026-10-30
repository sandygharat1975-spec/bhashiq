import React, { useState, useEffect } from 'react';
import { Radio, Mic, Volume2, Bookmark } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupportedLanguage } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/mockData';
import { speechService } from '../../services/speechService';
import { translateLiveCallText, autoDetectLanguage } from '../../services/translationService';
import { sanitizationService } from '../../services/sanitizationService';

interface SpeakerProfile {
  id: string;
  name: string;
  language: SupportedLanguage;
  color: string;
}

interface MultiSpeakerUtterance {
  id: string;
  speakerId: string;
  speakerName: string;
  speakerColor: string;
  language: SupportedLanguage;
  originalText: string;
  translatedText: string;
  targetLang: SupportedLanguage;
  timestamp: string;
}

export const SpeakerIdMode: React.FC = () => {
  const { user, saveWordToBank, addXP } = useApp();

  const [speakers] = useState<SpeakerProfile[]>([
    { id: 'spk-1', name: 'Speaker 1 (Rahul)', language: 'hi', color: 'from-orange-500 to-amber-600' },
    { id: 'spk-2', name: 'Speaker 2 (Ananya)', language: 'mr', color: 'from-emerald-500 to-teal-600' },
    { id: 'spk-3', name: 'Speaker 3 (Alex)', language: 'en', color: 'from-blue-500 to-indigo-600' },
  ]);

  const [activeSpeakerId, setActiveSpeakerId] = useState<string>('spk-1');
  const [targetAudienceLang, setTargetAudienceLang] = useState<SupportedLanguage>('en');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimText, setInterimText] = useState<string>('');

  // Stop any active speech listening or speaking when unmounting or navigating away
  useEffect(() => {
    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
    };
  }, []);

  const [streamLog, setStreamLog] = useState<MultiSpeakerUtterance[]>([
    {
      id: 'utt-1',
      speakerId: 'spk-1',
      speakerName: 'Speaker 1 (Rahul)',
      speakerColor: 'from-orange-500 to-amber-600',
      language: 'hi',
      originalText: 'नमस्ते दोस्तों! क्या आज की बैठक शुरू करें?',
      translatedText: 'Hello friends! Shall we begin today\'s meeting?',
      targetLang: 'en',
      timestamp: '11:00 AM'
    },
    {
      id: 'utt-2',
      speakerId: 'spk-2',
      speakerName: 'Speaker 2 (Ananya)',
      speakerColor: 'from-emerald-500 to-teal-600',
      language: 'mr',
      originalText: 'हो नक्कीच, मी अहवाल तयार ठेवला आहे.',
      translatedText: 'Yes certainly, I have kept the report ready.',
      targetLang: 'en',
      timestamp: '11:01 AM'
    },
    {
      id: 'utt-3',
      speakerId: 'spk-3',
      speakerName: 'Speaker 3 (Alex)',
      speakerColor: 'from-blue-500 to-indigo-600',
      language: 'en',
      originalText: 'Great, let\'s review the translation benchmarks together.',
      translatedText: 'बहुत बढ़िया, आइए एक साथ अनुवाद बेंचमार्क की समीक्षा करें।',
      targetLang: 'hi',
      timestamp: '11:02 AM'
    }
  ]);

  const toggleListen = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      return;
    }

    const currentSpk = speakers.find(s => s.id === activeSpeakerId) || speakers[0];
    setIsListening(true);

    speechService.startListening(
      currentSpk.language,
      async (transcript, isFinal) => {
        setInterimText(transcript);
        if (isFinal) {
          setIsListening(false);
          setInterimText('');

          const safeTranscript = sanitizationService.sanitizePlainText(transcript);
          // Auto-detect or use speaker language
          const detected = autoDetectLanguage(safeTranscript);
          const fromLang = detected.confidence > 0.9 ? detected.lang : currentSpk.language;

          const translated = await translateLiveCallText(safeTranscript, fromLang, targetAudienceLang);

          const newUtterance: MultiSpeakerUtterance = {
            id: `utt-${Date.now()}`,
            speakerId: currentSpk.id,
            speakerName: sanitizationService.sanitizePlainText(currentSpk.name),
            speakerColor: currentSpk.color,
            language: fromLang,
            originalText: safeTranscript,
            translatedText: sanitizationService.sanitizePlainText(translated.translatedText),
            targetLang: targetAudienceLang,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          setStreamLog(prev => [...prev, newUtterance]);
          addXP(20, 'Multi-speaker identification translated');

          speechService.speak(translated.translatedText, targetAudienceLang, {
            voiceGender: user.voiceGender,
            rate: user.voiceSpeed,
            tone: user.voiceTone,
          });
        }
      },
      (err) => {
        console.warn('Speech error:', err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-panel flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Radio className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900">Multi-Speaker Identification</h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Tracks distinct participants speaking Hindi, Marathi, and English simultaneously in unified translation streams.
          </p>
        </div>

        {/* Target Translation Language for the Room */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-600 font-medium">Translate all streams to:</span>
          <select
            value={targetAudienceLang}
            onChange={(e) => setTargetAudienceLang(e.target.value as SupportedLanguage)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 outline-none font-semibold cursor-pointer shadow-xs"
          >
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Speaker Selector Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {speakers.map((s) => {
          const isSelected = activeSpeakerId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSpeakerId(s.id)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isSelected 
                  ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-md' 
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${s.color} flex items-center justify-center text-white text-xs font-bold shadow-xs`}>
                  {s.name.charAt(0)}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {SUPPORTED_LANGUAGES.find(l => l.code === s.language)?.flag} {s.language.toUpperCase()}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-xs mt-2.5">{s.name}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Native {SUPPORTED_LANGUAGES.find(l => l.code === s.language)?.name}</p>
            </button>
          );
        })}
      </div>

      {/* Mic Trigger */}
      <div className="p-5 rounded-2xl glass-panel flex flex-col items-center justify-center text-center space-y-3">
        <p className="text-xs text-slate-700">
          Currently Speaking: <strong className="text-blue-700 font-bold">{speakers.find(s => s.id === activeSpeakerId)?.name}</strong>
        </p>

        <button
          onClick={toggleListen}
          className={`px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all shadow-md active:scale-95 ${
            isListening 
              ? 'bg-rose-600 text-white animate-pulse' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/20'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>{isListening ? 'Listening (Speak Now)' : `Speak as ${speakers.find(s => s.id === activeSpeakerId)?.name.split(' ')[0]}`}</span>
        </button>

        {interimText && (
          <div className="text-xs text-blue-700 font-mono animate-pulse bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
            Transcribing: "{interimText}"
          </div>
        )}
      </div>

      {/* Multi-Speaker Conversation Feed */}
      <div className="p-5 rounded-2xl glass-panel space-y-3">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2.5">
          Multi-Channel Speaker Streams
        </h3>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {streamLog.map((utt) => (
            <div
              key={utt.id}
              className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start space-x-3.5 transition-all hover:border-slate-300"
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${utt.speakerColor} flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-xs mt-0.5`}>
                {utt.speakerName.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900">{utt.speakerName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-semibold">
                      {utt.language.toUpperCase()} → {utt.targetLang.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] text-slate-400 font-mono">{utt.timestamp}</span>
                    <button
                      onClick={() => saveWordToBank({
                        originalText: utt.originalText,
                        translatedText: utt.translatedText,
                        fromLang: utt.language,
                        toLang: utt.targetLang,
                        context: 'Multi-Speaker identification'
                      })}
                      className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-slate-50 transition-colors"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => speechService.speak(utt.translatedText, utt.targetLang, {
                        voiceGender: user.voiceGender,
                        rate: user.voiceSpeed,
                        tone: user.voiceTone,
                      })}
                      className="p-1 rounded-md text-blue-600 hover:text-blue-800 hover:bg-slate-50 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 italic">"{utt.originalText}"</p>
                <p className="text-sm font-bold text-slate-900 mt-1">"{utt.translatedText}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
