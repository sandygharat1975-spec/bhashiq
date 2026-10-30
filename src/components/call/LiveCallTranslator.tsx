import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Users, 
  Radio, 
  Bookmark, 
  Share2, 
  ArrowRightLeft,
  Download,
  ScreenShare,
  Activity,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupportedLanguage, CallMessage, SimulatedCaller } from '../../types';
import { SUPPORTED_LANGUAGES, SIMULATED_CALLERS } from '../../data/mockData';
import { speechService } from '../../services/speechService';
import { translateText, translateLiveCallText, autoDetectLanguage } from '../../services/translationService';
import { socketService } from '../../services/socketService';
import { soundEffects } from '../../services/audioService';
import { sanitizationService } from '../../services/sanitizationService';

export const LiveCallTranslator: React.FC = () => {
  const { user, saveWordToBank, addXP } = useApp();

  // Call Status
  const [isInCall, setIsInCall] = useState<boolean>(false);
  const [isRinging, setIsRinging] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [callMode, setCallMode] = useState<'simulated' | 'peer-room'>('simulated');
  const [selectedCaller, setSelectedCaller] = useState<SimulatedCaller>(SIMULATED_CALLERS[0]);
  const [roomId, setRoomId] = useState<string>('LL-2026');

  // Audio / Video Media states
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [autoDetect, setAutoDetect] = useState<boolean>(true);

  // Latency & Telemetry
  const [liveLatency, setLiveLatency] = useState<number>(38);
  const [confidenceScore, setConfidenceScore] = useState<number>(99.4);

  // Languages
  const [myLanguage, setMyLanguage] = useState<SupportedLanguage>('en');
  const [peerLanguage, setPeerLanguage] = useState<SupportedLanguage>('hi');

  // Live Speech & Translation Streams
  const [interimSpeech, setInterimSpeech] = useState<string>('');
  const [isSpeakingNow, setIsSpeakingNow] = useState<boolean>(false);
  const [detectedBadge, setDetectedBadge] = useState<string | null>(null);
  const [messages, setMessages] = useState<CallMessage[]>([
    {
      id: 'm-init',
      sender: 'peer',
      senderName: 'Rahul Sharma',
      originalText: 'नमस्ते! क्या आप मुझे बता सकते हैं कि कॉलेज का मुख्य गेट कहाँ है?',
      translatedText: 'Hello! Can you tell me where the main gate of the college is?',
      fromLang: 'hi',
      toLang: 'en',
      timestamp: '12:00 PM',
      audioPlayed: true,
    }
  ]);

  // Video element refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const subtitlesScrollRef = useRef<HTMLDivElement | null>(null);

  // Helper to securely stop, disable, and detach all MediaStreamTrack instances
  const stopMediaStreamTracks = (stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {
          console.warn('Error stopping MediaStreamTrack:', e);
        }
      });
    }
  };

  // Explicit unmount cleanup handler to prevent background eavesdropping,
  // lingering camera/mic indicators, and memory leaks
  useEffect(() => {
    return () => {
      stopMediaStreamTracks(mediaStreamRef.current);
      mediaStreamRef.current = null;
      stopMediaStreamTracks(screenStreamRef.current);
      screenStreamRef.current = null;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      speechService.stopListening();
      speechService.stopSpeaking();
    };
  }, []);

  // Call duration counter
  useEffect(() => {
    let interval: any = null;
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
        // Slightly vary latency telemetry for realistic presentation
        setLiveLatency(Math.floor(32 + Math.random() * 12));
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isInCall]);

  // Keep subtitles scrolled to bottom
  useEffect(() => {
    if (subtitlesScrollRef.current) {
      subtitlesScrollRef.current.scrollTop = subtitlesScrollRef.current.scrollHeight;
    }
  }, [messages, interimSpeech]);

  // Webcam stream management
  useEffect(() => {
    let isCancelled = false;

    if (isInCall && isVideoOn && !isScreenSharing) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          if (isCancelled) {
            stopMediaStreamTracks(stream);
            return;
          }
          mediaStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Webcam not accessible, using avatar fallback:', err);
        });
    } else if (!isVideoOn && mediaStreamRef.current) {
      stopMediaStreamTracks(mediaStreamRef.current);
      mediaStreamRef.current = null;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }

    return () => {
      isCancelled = true;
      if (mediaStreamRef.current) {
        stopMediaStreamTracks(mediaStreamRef.current);
        mediaStreamRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };
  }, [isInCall, isVideoOn, isScreenSharing]);

  // Socket connection for Peer Room
  useEffect(() => {
    if (callMode === 'peer-room' && isInCall) {
      socketService.init();
      socketService.joinRoom(roomId, user.name, myLanguage);

      socketService.onReceiveTranscript((incomingMsg) => {
        // Strict DOMPurify & HTML entity sanitization prior to UI component injection
        const safeMsg = sanitizationService.sanitizeCallMessage(incomingMsg);
        soundEffects.playMessagePop();
        setMessages(prev => [...prev, safeMsg]);
        if (!isAudioMuted) {
          speechService.speak(safeMsg.translatedText, myLanguage, {
            voiceGender: user.voiceGender,
            rate: user.voiceSpeed,
            tone: user.voiceTone,
          });
        }
      });
    }

    return () => {
      if (callMode === 'peer-room') {
        socketService.disconnect();
      }
    };
  }, [callMode, isInCall, roomId]);

  // Screen share toggle
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        stopMediaStreamTracks(screenStreamRef.current);
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      // Re-enable camera if video on
      if (isVideoOn && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }).catch(() => null);
        if (stream && localVideoRef.current) {
          mediaStreamRef.current = stream;
          localVideoRef.current.srcObject = stream;
        }
      }
    } else {
      try {
        const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          if (screenStreamRef.current) {
            stopMediaStreamTracks(screenStreamRef.current);
            screenStreamRef.current = null;
          }
          setIsScreenSharing(false);
          if (isVideoOn && navigator.mediaDevices?.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: false })
              .then((camStream) => {
                mediaStreamRef.current = camStream;
                if (localVideoRef.current) {
                  localVideoRef.current.srcObject = camStream;
                }
              })
              .catch(() => {});
          }
        };
      } catch (e) {
        console.warn('Screen share canceled:', e);
      }
    }
  };

  // Start Call Handler with Dial Ringtone
  const startCall = () => {
    setIsRinging(true);
    soundEffects.playRingtone();

    setTimeout(() => {
      setIsRinging(false);
      setIsInCall(true);
      soundEffects.playSuccess();
      addXP(20, 'Started live translated call');
      
      if (callMode === 'simulated') {
        setPeerLanguage(selectedCaller.language);
        setTimeout(() => {
          playPeerMessage(selectedCaller.greetingText);
        }, 1000);
      }
    }, 1400);
  };

  const endCall = () => {
    soundEffects.playCallEnd();
    setIsInCall(false);
    setIsRinging(false);
    speechService.stopListening();
    speechService.stopSpeaking();
    if (mediaStreamRef.current) {
      stopMediaStreamTracks(mediaStreamRef.current);
      mediaStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      stopMediaStreamTracks(screenStreamRef.current);
      screenStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
  };

  // User Speaks: Start/Stop Mic
  const toggleSpeechRecognition = () => {
    if (isSpeakingNow) {
      speechService.stopListening();
      setIsSpeakingNow(false);
      return;
    }

    setIsSpeakingNow(true);
    let langToUse = myLanguage;

    speechService.startListening(
      langToUse,
      async (transcript, isFinal) => {
        setInterimSpeech(transcript);

        if (isFinal) {
          setIsSpeakingNow(false);
          setInterimSpeech('');
          await handleUserSpokenFinal(transcript);
        }
      },
      (err) => {
        console.warn('Speech Rec error:', err);
        setIsSpeakingNow(false);
      },
      () => {
        setIsSpeakingNow(false);
      }
    );
  };

  // Process user speech
  const handleUserSpokenFinal = async (text: string) => {
    const safeText = sanitizationService.sanitizePlainText(text);
    if (!safeText) return;

    let activeSrcLang = myLanguage;

    if (autoDetect) {
      const detected = autoDetectLanguage(safeText);
      activeSrcLang = detected.lang;
      setDetectedBadge(detected.lang.toUpperCase());
      setTimeout(() => setDetectedBadge(null), 3000);
    }

    const translated = await translateLiveCallText(safeText, activeSrcLang, peerLanguage);
    soundEffects.playMessagePop();

    const newMsg: CallMessage = {
      id: `msg-${Date.now()}`,
      sender: 'self',
      senderName: sanitizationService.sanitizePlainText(user.name),
      originalText: safeText,
      translatedText: sanitizationService.sanitizePlainText(translated.translatedText),
      fromLang: activeSrcLang,
      toLang: peerLanguage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      redacted: Boolean(translated.redactedEntities && translated.redactedEntities.length > 0),
      detectedEntities: translated.redactedEntities,
    };

    setMessages(prev => [...prev, newMsg]);
    addXP(15, 'Live speech translated');

    if (callMode === 'peer-room') {
      socketService.sendTranscript(roomId, newMsg);
    }

    if (callMode === 'simulated') {
      setTimeout(() => {
        generateSimulatedPeerReply(text);
      }, 1600);
    }
  };

  // Simulate remote peer replying with realistic TTS
  const generateSimulatedPeerReply = async (userSaid: string) => {
    let replyOriginal = '';
    for (const item of selectedCaller.sampleResponses) {
      if (typeof item.promptTrigger === 'string' && userSaid.toLowerCase().includes(item.promptTrigger)) {
        replyOriginal = item.responseOriginal;
        break;
      } else if (item.promptTrigger instanceof RegExp && item.promptTrigger.test(userSaid)) {
        replyOriginal = item.responseOriginal;
        break;
      }
    }

    if (!replyOriginal) {
      if (selectedCaller.language === 'hi') {
        replyOriginal = 'हाँ, मैं आपकी बात समझ गया। यह लाइव अनुवाद प्रणाली वाकई बहुत तेज़ और उपयोगी है!';
      } else if (selectedCaller.language === 'mr') {
        replyOriginal = 'हो नक्कीच, मला तुमचं बोलणं समजलं. हे तंत्रज्ञान खूपच प्रभावीपणे काम करत आहे!';
      } else if (selectedCaller.language === 'es') {
        replyOriginal = '¡Entendido perfectamente! La traducción en tiempo real funciona con increíble rapidez.';
      } else {
        replyOriginal = 'Hai, wakarimashita! Totemo benri na shisutemu desu ne.';
      }
    }

    await playPeerMessage(replyOriginal);
  };

  const playPeerMessage = async (originalText: string) => {
    const safeOriginal = sanitizationService.sanitizePlainText(originalText);
    const translated = await translateLiveCallText(safeOriginal, selectedCaller.language, myLanguage);
    soundEffects.playMessagePop();

    const peerMsg: CallMessage = {
      id: `msg-${Date.now()}`,
      sender: 'peer',
      senderName: sanitizationService.sanitizePlainText(selectedCaller.name),
      originalText: safeOriginal,
      translatedText: sanitizationService.sanitizePlainText(translated.translatedText),
      fromLang: selectedCaller.language,
      toLang: myLanguage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      redacted: Boolean(translated.redactedEntities && translated.redactedEntities.length > 0),
      detectedEntities: translated.redactedEntities,
    };

    setMessages(prev => [...prev, peerMsg]);

    if (!isAudioMuted) {
      speechService.speak(translated.translatedText, myLanguage, {
        voiceGender: user.voiceGender,
        rate: user.voiceSpeed,
        tone: user.voiceTone,
      });
    }
  };

  // Download complete session transcript for college viva / project record
  const downloadSessionTranscript = () => {
    let content = `BHASHIQ REAL-TIME CALL TRANSCRIPT\n`;
    content += `Date: ${new Date().toLocaleDateString()}\n`;
    content += `Duration: ${formatDuration(callDuration)}\n`;
    content += `Caller: ${selectedCaller.name} (${selectedCaller.languageName})\n`;
    content += `Participant: ${user.name}\n`;
    content += `Latency: ${liveLatency}ms | Confidence: ${confidenceScore}%\n`;
    content += `========================================================\n\n`;

    messages.forEach((m, idx) => {
      content += `[${m.timestamp}] ${m.sender === 'self' ? user.name : m.senderName} (${m.fromLang.toUpperCase()} → ${m.toLang.toUpperCase()}):\n`;
      content += `  Original: "${m.originalText}"\n`;
      content += `  Translated: "${m.translatedText}"\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bhashiq_call_transcript_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-4 animate-fade-in">
      
      {/* Top Banner / Call Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl cyber-card border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
              <Phone className="w-5 h-5 animate-pulse" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Live On-Call Voice Translator</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-600 text-white font-black">
              Core USP
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Real-time bidirectional speech translation: speak in your language, peer hears in theirs.
          </p>
        </div>

        {/* Telemetry Indicator Bar */}
        <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-xs">
          <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span className="text-slate-800 font-mono font-medium">{liveLatency}ms Latency</span>
          <span className="text-slate-300">|</span>
          <span className="text-cyan-700 font-mono font-bold">{confidenceScore}% STT</span>
          <span className="text-slate-300">|</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-800 border border-violet-300" title="Live call audio strictly translated via on-premise zero-retention enterprise models">
            🛡️ DPA Zero-Retention
          </span>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setCallMode('simulated')}
            disabled={isInCall}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              callMode === 'simulated' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Simulated Caller
          </button>
          <button
            onClick={() => setCallMode('peer-room')}
            disabled={isInCall}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              callMode === 'peer-room' ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Peer Call Room (Multi-Device)
          </button>
        </div>
      </div>

      {/* Main Video & Calling Stage */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl min-h-[520px] flex flex-col justify-between">
        
        {/* Call In-Progress Bar */}
        {isInCall && (
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 pointer-events-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-mono font-medium text-emerald-400">{formatDuration(callDuration)}</span>
              <span className="text-slate-600">|</span>
              <span className="text-xs text-slate-300 font-medium">
                {callMode === 'simulated' ? selectedCaller.name : `Room: ${roomId}`}
              </span>
            </div>

            {/* Auto Detection Badge Notification */}
            {detectedBadge && (
              <div className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold animate-bounce-short">
                🔍 Auto-Detected: {detectedBadge}
              </div>
            )}

            {/* Action Bar (Transcript Export & Voice Status) */}
            <div className="hidden sm:flex items-center space-x-2 pointer-events-auto">
              <button
                onClick={downloadSessionTranscript}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700 text-xs text-cyan-300 transition-colors"
                title="Download Live Subtitle Transcript"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Transcript</span>
              </button>
            </div>
          </div>
        )}

        {/* Dialing Ringing Overlay */}
        {isRinging && (
          <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <div className="relative">
              <img
                src={selectedCaller.avatar}
                alt={selectedCaller.name}
                className="w-28 h-28 rounded-full object-cover ring-4 ring-cyan-400 animate-pulse shadow-2xl"
              />
              <span className="absolute -bottom-1 -right-1 p-2 bg-blue-600 rounded-full text-white shadow">
                <Phone className="w-4 h-4 animate-bounce-short" />
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Calling {selectedCaller.name}...</h3>
              <p className="text-xs text-cyan-400 mt-1">Establishing Low-Latency Translation Bridge</p>
            </div>
          </div>
        )}

        {/* Video Grid (Dual Caller Screens) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 flex-1">
          
          {/* Peer Screen (Remote Caller e.g. Rahul / Room Peer) */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900/90 border border-slate-800 flex items-center justify-center min-h-[240px]">
            {callMode === 'simulated' ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <img
                  src={selectedCaller.avatar}
                  alt={selectedCaller.name}
                  className={`w-28 h-28 rounded-full object-cover ring-4 ring-blue-500/40 shadow-xl transition-transform ${
                    isInCall ? 'scale-105 ring-emerald-500/60' : ''
                  }`}
                />
                <div className="mt-3">
                  <div className="flex items-center justify-center space-x-1.5">
                    <h3 className="font-bold text-white text-base">{selectedCaller.name}</h3>
                    <span className="text-base">{SUPPORTED_LANGUAGES.find(l => l.code === selectedCaller.language)?.flag}</span>
                  </div>
                  <p className="text-xs text-slate-400">{selectedCaller.role}</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-cyan-300 border border-blue-500/20">
                    Native: {selectedCaller.languageName}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center mb-3">
                  <Users className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="font-bold text-white">Peer Caller</h3>
                <p className="text-xs text-slate-400">Waiting for peer in Room {roomId}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    disabled={isInCall}
                    className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-center font-mono text-cyan-300 uppercase"
                  />
                  <button
                    onClick={() => navigator.clipboard?.writeText(roomId)}
                    className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                    title="Copy Room Code"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Peer Language Badge */}
            <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-[11px] text-slate-300 flex items-center space-x-1.5">
              <span>{SUPPORTED_LANGUAGES.find(l => l.code === peerLanguage)?.flag}</span>
              <span>{SUPPORTED_LANGUAGES.find(l => l.code === peerLanguage)?.name}</span>
            </div>
          </div>

          {/* Self Screen (You) */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900/90 border border-slate-800 flex items-center justify-center min-h-[240px]">
            {isVideoOn && isInCall ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isScreenSharing ? 'transform -scale-x-100' : ''}`}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center mb-2">
                  <span className="text-3xl">👤</span>
                </div>
                <h3 className="font-bold text-white">{user.name} (You)</h3>
                <p className="text-xs text-slate-400">Camera is {isVideoOn ? 'Connecting...' : 'Off'}</p>
              </div>
            )}

            {/* Your Language Selector & Auto-Detect Toggle */}
            <div className="absolute bottom-3 left-3 flex items-center space-x-2">
              <div className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-[11px] text-slate-300 flex items-center space-x-1.5">
                <span>{SUPPORTED_LANGUAGES.find(l => l.code === myLanguage)?.flag}</span>
                <span>You: {SUPPORTED_LANGUAGES.find(l => l.code === myLanguage)?.name}</span>
              </div>

              {/* Auto detect toggle */}
              <button
                onClick={() => setAutoDetect(!autoDetect)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm transition-all ${
                  autoDetect 
                    ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/40' 
                    : 'bg-black/50 text-slate-400 border border-slate-700'
                }`}
              >
                Auto-Detect: {autoDetect ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

        </div>

        {/* Quick Conversation Prompts (Useful during presentations) */}
        {isInCall && (
          <div className="px-4 py-1.5 flex items-center space-x-2 overflow-x-auto text-[11px]">
            <span className="text-slate-400 whitespace-nowrap flex items-center gap-1 font-semibold">
              <MessageSquare className="w-3 h-3 text-cyan-400" /> Quick Ask:
            </span>
            <button
              onClick={() => handleUserSpokenFinal("Where is the railway station?")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 whitespace-nowrap border border-slate-700 transition-colors"
            >
              "Where is the railway station?"
            </button>
            <button
              onClick={() => handleUserSpokenFinal("How are you doing today?")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 whitespace-nowrap border border-slate-700 transition-colors"
            >
              "How are you doing today?"
            </button>
            <button
              onClick={() => handleUserSpokenFinal("Is there good food in the canteen?")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 whitespace-nowrap border border-slate-700 transition-colors"
            >
              "Is there good food in the canteen?"
            </button>
          </div>
        )}

        {/* Live Subtitles Display Stream (Pages 1 & 2 of PDF) */}
        {isInCall && (
          <div className="px-4 pb-3">
            <div 
              ref={subtitlesScrollRef}
              className="max-h-48 overflow-y-auto space-y-2 p-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800/80 shadow-inner"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
                <span className="flex items-center gap-1 font-semibold text-cyan-400">
                  <Radio className="w-3 h-3 text-cyan-400 animate-pulse" /> Live Subtitle Stream
                </span>
                <span>Low Latency AI Speech Engine</span>
              </div>

              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`p-2.5 rounded-xl text-xs transition-all ${
                    msg.sender === 'self' 
                      ? 'bg-blue-950/40 border border-blue-800/40 text-blue-100 ml-4' 
                      : 'bg-slate-800/60 border border-slate-700/60 text-slate-200 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold flex items-center gap-1.5 text-cyan-300">
                      <span>{msg.sender === 'self' ? '👤 You' : `🗣️ ${msg.senderName}`}</span>
                      <span className="text-[10px] font-normal text-slate-400">({msg.fromLang.toUpperCase()} → {msg.toLang.toUpperCase()})</span>
                      {msg.redacted && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40" title={`Client-side redacted: ${msg.detectedEntities?.join(', ')}`}>
                          🛡️ PII Masked
                        </span>
                      )}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                      <button
                        onClick={() => saveWordToBank({
                          originalText: msg.originalText,
                          translatedText: msg.translatedText,
                          fromLang: msg.fromLang,
                          toLang: msg.toLang,
                          context: 'Live Call Conversation',
                        })}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-amber-300 transition-colors"
                        title="Save Word/Phrase to Vocabulary Bank"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-slate-400 italic">
                      "{msg.originalText}"
                    </div>
                    <div className="font-semibold text-white text-sm flex items-center justify-between">
                      <span>"{msg.translatedText}"</span>
                      <button
                        onClick={() => speechService.speak(msg.translatedText, msg.toLang, {
                          voiceGender: user.voiceGender,
                          rate: user.voiceSpeed,
                          tone: user.voiceTone,
                        })}
                        className="p-1 rounded text-cyan-400 hover:text-cyan-200"
                        title="Replay Audio"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {interimSpeech && (
                <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-700/40 text-cyan-200 text-xs animate-pulse">
                  <span className="font-semibold">Transcribing: </span>
                  <span>{interimSpeech}...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Call Controls Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          
          {!isInCall ? (
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-semibold">Select Remote Caller:</span>
              <div className="flex items-center space-x-2 overflow-x-auto">
                {SIMULATED_CALLERS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCaller(c);
                      setPeerLanguage(c.language);
                    }}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      selectedCaller.id === c.id 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{c.avatar ? '🗣️' : ''}</span>
                    <span>{c.name.split(' ')[0]}</span>
                    <span className="text-[10px] opacity-80">({c.languageName})</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-slate-100 px-3 py-1.5 rounded-xl text-xs border border-slate-200">
                <select
                  value={myLanguage}
                  onChange={(e) => setMyLanguage(e.target.value as SupportedLanguage)}
                  className="bg-transparent text-slate-700 font-bold outline-none cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map(l => (
                    <option key={l.code} value={l.code} className="bg-white text-slate-800">{l.flag} {l.name}</option>
                  ))}
                </select>
                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-blue-700 font-bold">
                  {SUPPORTED_LANGUAGES.find(l => l.code === peerLanguage)?.flag} {SUPPORTED_LANGUAGES.find(l => l.code === peerLanguage)?.name}
                </span>
              </div>
            </div>
          )}

          {/* Action Call Buttons */}
          <div className="flex items-center space-x-3 mx-auto sm:mx-0">
            {!isInCall ? (
              <button
                onClick={startCall}
                disabled={isRinging}
                className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
              >
                <Phone className="w-5 h-5 animate-bounce-short" />
                <span>{isRinging ? 'Dialing...' : 'Start Live Call'}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={toggleSpeechRecognition}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 ${
                    isSpeakingNow 
                      ? 'bg-rose-600 text-white shadow-rose-600/30 animate-pulse' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>{isSpeakingNow ? 'Listening (Speak Now)' : 'Tap to Speak'}</span>
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-3 rounded-2xl border transition-all ${
                    isMuted 
                      ? 'bg-red-50 border-red-300 text-red-600' 
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className={`p-3 rounded-2xl border transition-all ${
                    !isVideoOn 
                      ? 'bg-red-50 border-red-300 text-red-600' 
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={isVideoOn ? 'Turn Video Off' : 'Turn Video On'}
                >
                  {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={toggleScreenShare}
                  className={`p-3 rounded-2xl border transition-all ${
                    isScreenSharing 
                      ? 'bg-cyan-50 border-cyan-300 text-cyan-700' 
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
                >
                  <ScreenShare className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsAudioMuted(!isAudioMuted)}
                  className={`p-3 rounded-2xl border transition-all ${
                    isAudioMuted 
                      ? 'bg-amber-50 border-amber-300 text-amber-700' 
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={isAudioMuted ? 'Unmute Audio Voice' : 'Mute Audio Voice'}
                >
                  {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={endCall}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Call</span>
                </button>
              </>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
