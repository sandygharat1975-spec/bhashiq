import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  Volume2, 
  Clock, 
  RefreshCw 
} from 'lucide-react';
import { SupportedLanguage, GPSCoordinates } from '../../types';
import { gpsValidationService } from '../../services/gpsValidationService';
import { emergencyRateLimiter } from '../../services/emergencyRateLimiter';

interface EmergencyConfirmationDialogProps {
  isOpen: boolean;
  phrase: {
    id: string;
    en: string;
    translations: Record<string, string>;
    severity?: string;
  };
  targetLang: SupportedLanguage;
  onConfirm: (payload: { phrase: any; coordinates: GPSCoordinates; targetLang: SupportedLanguage }) => void;
  onCancel: () => void;
}

export const EmergencyConfirmationDialog: React.FC<EmergencyConfirmationDialogProps> = ({
  isOpen,
  phrase,
  targetLang,
  onConfirm,
  onCancel,
}) => {
  // Coordinates state (Default to Pune, India for realistic demonstration)
  const [latInput, setLatInput] = useState<string>('18.5204');
  const [lonInput, setLonInput] = useState<string>('73.8567');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Rate limit tracking state
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [rateLimitReason, setRateLimitReason] = useState<string | null>(null);

  // Validation state
  const validationResult = gpsValidationService.validate({
    latitude: latInput,
    longitude: lonInput,
  });

  // Attempt to fetch current geolocation if supported
  const fetchCurrentLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatInput(position.coords.latitude.toFixed(6));
          setLonInput(position.coords.longitude.toFixed(6));
          setIsLocating(false);
        },
        (err) => {
          console.warn('Geolocation lookup notice:', err.message);
          setIsLocating(false);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    }
  };

  // Check rate limit on dialog open and tick down every second
  useEffect(() => {
    if (!isOpen) return;

    const check = () => {
      const status = emergencyRateLimiter.checkRateLimit();
      if (!status.allowed) {
        setCooldownRemaining(status.remainingCooldownSec);
        setRateLimitReason(status.reason || 'Trigger rate limit in progress');
      } else {
        setCooldownRemaining(0);
        setRateLimitReason(null);
      }
    };

    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const translatedText = phrase.translations[targetLang] || phrase.en;
  const isConfirmDisabled = !validationResult.isValid || cooldownRemaining > 0;

  const handleConfirmClick = () => {
    if (isConfirmDisabled || !validationResult.sanitized) return;

    const recorded = emergencyRateLimiter.recordTrigger();
    if (!recorded) {
      const check = emergencyRateLimiter.checkRateLimit();
      setCooldownRemaining(check.remainingCooldownSec);
      setRateLimitReason(check.reason || 'Rate limit active');
      return;
    }

    onConfirm({
      phrase,
      coordinates: validationResult.sanitized,
      targetLang,
    });
  };

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl border-2 border-red-500 shadow-2xl overflow-hidden text-slate-900">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg uppercase tracking-wide">
                Confirm Emergency Broadcast
              </h3>
              <p className="text-xs text-red-100 font-medium">
                Prevent accidental sirens & false emergency alerts
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close dialog"
            className="p-1.5 rounded-xl hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          
          {/* Rate Limit Cooldown Warning Banner */}
          {cooldownRemaining > 0 && (
            <div 
              data-testid="cooldown-banner"
              className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center space-x-3 animate-pulse"
            >
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <span className="font-bold block">Rate-Limit Cooldown Active ({cooldownRemaining}s)</span>
                <span className="text-[11px] text-amber-700">{rateLimitReason}</span>
              </div>
            </div>
          )}

          {/* Distress Phrase Preview */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Distress Message to Broadcast:
            </span>
            <div className="text-sm font-semibold text-slate-700">
              "{phrase.en}"
            </div>
            <div className="text-lg font-black text-red-600 pt-1">
              "{translatedText}"
            </div>
          </div>

          {/* GPS Coordinates & Schema Validation Card */}
          <div className="p-4 rounded-2xl border bg-white space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-cyan-600" />
                <span className="text-xs font-bold text-slate-800">
                  Telemetry GPS Coordinates Schema
                </span>
              </div>
              <button
                type="button"
                onClick={fetchCurrentLocation}
                disabled={isLocating}
                className="text-[11px] font-semibold text-cyan-700 hover:text-cyan-900 flex items-center space-x-1"
                title="Get Current Geolocation"
              >
                <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Locating...' : 'Refresh GPS'}</span>
              </button>
            </div>

            {/* Latitude & Longitude Inputs */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Latitude (-90° to +90°):
                </label>
                <input
                  type="text"
                  data-testid="latitude-input"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  placeholder="e.g. 18.5204"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:border-cyan-500 focus:outline-none font-mono font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Longitude (-180° to +180°):
                </label>
                <input
                  type="text"
                  data-testid="longitude-input"
                  value={lonInput}
                  onChange={(e) => setLonInput(e.target.value)}
                  placeholder="e.g. 73.8567"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:border-cyan-500 focus:outline-none font-mono font-medium text-slate-800"
                />
              </div>
            </div>

            {/* Schema Validation Feedback */}
            <div className="pt-1">
              {validationResult.isValid && validationResult.sanitized ? (
                <div 
                  data-testid="gps-valid-indicator"
                  className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center space-x-2 text-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold">
                    ✓ Valid GPS Schema: {gpsValidationService.formatReadable(validationResult.sanitized)}
                  </span>
                </div>
              ) : (
                <div 
                  data-testid="gps-error-indicator"
                  className="p-2.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs space-y-1"
                >
                  <div className="flex items-center space-x-1.5 font-bold">
                    <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>Invalid GPS Schema:</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5 text-red-700">
                    {validationResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
          >
            Cancel / Dismiss
          </button>

          <button
            type="button"
            data-testid="confirm-broadcast-btn"
            disabled={isConfirmDisabled}
            onClick={handleConfirmClick}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 ${
              isConfirmDisabled
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>
              {cooldownRemaining > 0 
                ? `Cooldown (${cooldownRemaining}s)` 
                : 'Confirm & Broadcast Distress'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
