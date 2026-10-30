import React, { useState, useEffect } from 'react';
import { AlertOctagon, Volume2, MapPin, ShieldCheck, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EMERGENCY_PHRASES, SUPPORTED_LANGUAGES } from '../../data/mockData';
import { SupportedLanguage, GPSCoordinates } from '../../types';
import { speechService } from '../../services/speechService';
import { soundEffects } from '../../services/audioService';
import { gpsValidationService } from '../../services/gpsValidationService';
import { emergencyRateLimiter } from '../../services/emergencyRateLimiter';
import { EmergencyConfirmationDialog } from './EmergencyConfirmationDialog';

export const EmergencyMode: React.FC = () => {
  const { addXP } = useApp();

  const [targetLang, setTargetLang] = useState<SupportedLanguage>('hi');
  const [activeSOS, setActiveSOS] = useState<typeof EMERGENCY_PHRASES[0] | null>(null);
  const [activeLocation, setActiveLocation] = useState<GPSCoordinates | null>(null);

  // Confirmation dialog state to prevent accidental triggers
  const [confirmingPhrase, setConfirmingPhrase] = useState<typeof EMERGENCY_PHRASES[0] | null>(null);
  const [rateLimitNotice, setRateLimitNotice] = useState<string | null>(null);

  // Cleanup speech upon unmount to prevent lingering audio
  useEffect(() => {
    return () => {
      speechService.stopSpeaking();
    };
  }, []);

  // Request trigger: checks rate limit and opens confirmation dialog
  const requestTriggerSOS = (phrase: typeof EMERGENCY_PHRASES[0]) => {
    const rateCheck = emergencyRateLimiter.checkRateLimit();
    if (!rateCheck.allowed) {
      setRateLimitNotice(rateCheck.reason || 'Rate limit cooldown active. Please wait.');
      setTimeout(() => setRateLimitNotice(null), 4000);
      return;
    }
    setRateLimitNotice(null);
    setConfirmingPhrase(phrase);
  };

  // Execute broadcast once confirmed in dialog with validated GPS
  const handleConfirmedBroadcast = async ({
    phrase,
    coordinates,
    targetLang: broadcastLang,
  }: {
    phrase: typeof EMERGENCY_PHRASES[0];
    coordinates: GPSCoordinates;
    targetLang: SupportedLanguage;
  }) => {
    setConfirmingPhrase(null);
    setActiveSOS(phrase);
    setActiveLocation(coordinates);

    // 1. Play Emergency Siren
    soundEffects.playEmergencySiren();

    // 2. Speak distress message loud & clearly
    const transMap = phrase.translations as Record<string, string>;
    const translated = transMap[broadcastLang] || phrase.en;
    speechService.speak(translated, broadcastLang, {
      voiceGender: 'male',
      rate: 0.9,
      pitch: 1.1,
      tone: 'professional',
    });

    // 3. Award XP for emergency usage (authoritative action: EMERGENCY_USED)
    addXP(15, 'Emergency Distress Alert broadcast with validated GPS');

    // 4. Optionally send telemetry to server broadcast endpoint if online
    try {
      await fetch('/api/emergency/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phraseId: phrase.id,
          originalText: phrase.en,
          translatedText: translated,
          targetLang: broadcastLang,
          location: coordinates,
        }),
      });
    } catch (e) {
      // Offline fallback: Siren & localized TTS already active locally
    }
  };

  return (
    <div className="w-full space-y-5 animate-fade-in">
      {/* Rate-limit active notice banner */}
      {rateLimitNotice && (
        <div 
          data-testid="emergency-rate-limit-notice"
          className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center space-x-3 animate-fade-in shadow-xs"
        >
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <span className="font-bold block">Accidental Trigger Guard Active</span>
            <span className="text-[11px] text-amber-700">{rateLimitNotice}</span>
          </div>
        </div>
      )}

      {/* High-visibility Emergency Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl shadow-red-600/20 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-2xl animate-pulse">
              <AlertOctagon className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black uppercase tracking-wider">Emergency SOS Translator</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30">
                  🛡️ Rate-Limited & GPS Validated
                </span>
              </div>
              <p className="text-xs text-red-100 mt-0.5">
                Two-step confirmation dialog with GPS schema validation (−90° to +90° Lat, −180° to +180° Lon) and siren broadcast.
              </p>
            </div>
          </div>

          {/* Target Country / Language */}
          <div className="flex items-center space-x-2 bg-black/20 p-2 rounded-2xl backdrop-blur-sm text-xs">
            <span className="font-bold text-red-100">Local Language:</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as SupportedLanguage)}
              className="bg-white text-slate-900 border border-red-300 rounded-xl px-3 py-1 font-bold outline-none cursor-pointer shadow-xs"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Fullscreen High-Visibility Active SOS Card */}
      {activeSOS && (
        <div className="p-8 rounded-3xl bg-red-600 text-white border-4 border-red-400 shadow-2xl text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="px-3.5 py-1 rounded-full bg-white text-red-700 font-black text-xs uppercase tracking-widest animate-pulse shadow-xs">
              🚨 Active Distress Broadcast
            </span>
            <button
              onClick={() => {
                setActiveSOS(null);
                setActiveLocation(null);
              }}
              className="text-xs text-white/80 hover:text-white underline font-bold"
            >
              Dismiss
            </button>
          </div>

          <div className="space-y-2 py-2">
            <span className="text-sm text-red-100 font-bold block uppercase tracking-wider">
              {activeSOS.en}
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight">
              {(activeSOS.translations as Record<string, string>)[targetLang] || activeSOS.en}
            </h2>
          </div>

          {/* Validated GPS Telemetry Readout */}
          {activeLocation && (
            <div 
              data-testid="active-sos-location"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-black/25 backdrop-blur-md border border-white/20 text-xs font-mono font-bold"
            >
              <MapPin className="w-4 h-4 text-cyan-300" />
              <span>Telemetry GPS: {gpsValidationService.formatReadable(activeLocation)}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
            </div>
          )}

          <div>
            <button
              onClick={() => requestTriggerSOS(activeSOS)}
              className="px-8 py-3.5 rounded-2xl bg-white text-red-700 hover:bg-red-50 font-black text-sm uppercase tracking-wider shadow-xl flex items-center justify-center space-x-2 mx-auto active:scale-95 transition-all"
            >
              <Volume2 className="w-5 h-5 text-red-700" />
              <span>Re-Broadcast Loud Audio</span>
            </button>
          </div>
        </div>
      )}

      {/* 1-Tap SOS Quick Phrase Buttons with Confirmation Guards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {EMERGENCY_PHRASES.map((phrase) => {
          const trans = (phrase.translations as Record<string, string>)[targetLang] || phrase.en;
          return (
            <button
              key={phrase.id}
              onClick={() => requestTriggerSOS(phrase)}
              className="p-5 rounded-2xl bg-white border-2 border-red-200 hover:border-red-500 hover:bg-red-50/50 text-left transition-all group flex flex-col justify-between space-y-2 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 group-hover:text-red-700">
                  "{phrase.en}"
                </span>
                <span className="p-2 rounded-xl bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <Volume2 className="w-4 h-4" />
                </span>
              </div>

              <div className="text-lg font-black text-slate-900 group-hover:text-red-700">
                {trans}
              </div>

              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-red-600 tracking-wider pt-1 border-t border-slate-100">
                <span>Confirmation Guard Active</span>
                <span className="text-slate-400">Tap to review & broadcast</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirmation Dialog Component */}
      {confirmingPhrase && (
        <EmergencyConfirmationDialog
          isOpen={Boolean(confirmingPhrase)}
          phrase={confirmingPhrase}
          targetLang={targetLang}
          onConfirm={handleConfirmedBroadcast}
          onCancel={() => setConfirmingPhrase(null)}
        />
      )}
    </div>
  );
};
