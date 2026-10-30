import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Layers, 
  Volume2, 
  Sparkles, 
  RefreshCw, 
  Bookmark 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupportedLanguage, OCRBoundingBox } from '../../types';
import { SUPPORTED_LANGUAGES, DEMO_VISION_ITEMS } from '../../data/mockData';
import { ocrService } from '../../services/ocrService';
import { speechService } from '../../services/speechService';

export const CameraTranslator: React.FC = () => {
  const { user, saveWordToBank, addXP } = useApp();

  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'samples'>('samples');
  const [targetLang, setTargetLang] = useState<SupportedLanguage>('en');
  const [selectedDemo, setSelectedDemo] = useState(DEMO_VISION_ITEMS[1]); // Default to Misal Pav menu

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showAROverlay, setShowAROverlay] = useState<boolean>(true);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [detectedBoxes, setDetectedBoxes] = useState<OCRBoundingBox[]>(DEMO_VISION_ITEMS[1].boxes);

  // Camera video ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Helper to securely stop, disable, and detach all MediaStreamTrack instances
  const stopMediaStream = (stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {
          console.warn('Error stopping camera track:', e);
        }
      });
    }
  };

  // Stop camera when leaving mode or transitioning
  useEffect(() => {
    let isCancelled = false;

    if (activeMode === 'camera') {
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          if (isCancelled) {
            stopMediaStream(stream);
            return;
          }
          cameraStreamRef.current = stream;
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Camera access denied or unavailable:', err);
        });
    } else {
      stopMediaStream(cameraStreamRef.current);
      stopMediaStream(cameraStream);
      cameraStreamRef.current = null;
      setCameraStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      isCancelled = true;
      stopMediaStream(cameraStreamRef.current);
      stopMediaStream(cameraStream);
      cameraStreamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      speechService.stopSpeaking();
    };
  }, [activeMode]);

  // Explicit unmount cleanup handler to prevent background eavesdropping and lingering recording indicators
  useEffect(() => {
    return () => {
      stopMediaStream(cameraStreamRef.current);
      cameraStreamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      speechService.stopSpeaking();
    };
  }, []);

  // Handle preset demo item selection
  const selectDemoItem = (item: typeof DEMO_VISION_ITEMS[0]) => {
    setSelectedDemo(item);
    setCustomImage(null);
    setDetectedBoxes(item.boxes);
    addXP(10, 'Vision AR demo loaded');
  };

  // Handle uploaded image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const url = ev.target?.result as string;
      setCustomImage(url);
      setIsProcessing(true);

      const img = new Image();
      img.src = url;
      img.onload = async () => {
        const result = await ocrService.processImage(img, targetLang);
        setDetectedBoxes(result.boxes);
        setIsProcessing(false);
        addXP(25, 'Uploaded image OCR analyzed');
      };
    };
    reader.readAsDataURL(file);
  };

  // Capture frame from live camera
  const captureCameraFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCustomImage(dataUrl);
    setActiveMode('upload');
    setIsProcessing(true);

    const result = await ocrService.processImage(canvas, targetLang);
    setDetectedBoxes(result.boxes);
    setIsProcessing(false);
    addXP(30, 'Live Camera AR OCR translated');
  };

  const activeImageUrl = customImage || selectedDemo.imageUrl;

  return (
    <div className="w-full space-y-5 animate-fade-in">
      {/* Top Header */}
      <div className="p-4 sm:p-5 rounded-2xl cyber-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Camera className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Camera & AR Computer Vision Translator
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              Multi-Modal Optical Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Scan restaurant menus, posters, signboards, or screenshots with real-time AR translated overlay.
          </p>
        </div>

        {/* Target Language & Controls */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-medium">Target:</span>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value as SupportedLanguage)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 outline-none font-bold cursor-pointer shadow-xs"
          >
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.code} className="bg-white text-slate-800">{l.flag} {l.name}</option>
            ))}
          </select>

          {/* AR Overlay Switch */}
          <button
            onClick={() => setShowAROverlay(!showAROverlay)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold border transition-all ${
              showAROverlay 
                ? 'bg-cyan-50 border-cyan-500 text-cyan-700 shadow-xs' 
                : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>AR Overlay: {showAROverlay ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setActiveMode('samples')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeMode === 'samples' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Demo Posters & Menus</span>
        </button>

        <button
          onClick={() => setActiveMode('camera')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeMode === 'camera' ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Live Camera AR</span>
        </button>

        <button
          onClick={() => setActiveMode('upload')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeMode === 'upload' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Image / Poster</span>
        </button>
      </div>

      {/* Preset Demo Selection Bar */}
      {activeMode === 'samples' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DEMO_VISION_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => selectDemoItem(item)}
              className={`p-3.5 rounded-2xl border text-left flex items-center space-x-3 transition-all ${
                selectedDemo.id === item.id && !customImage
                  ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-xs'
              }`}
            >
              <img src={item.imageUrl} alt={item.title} className="w-14 h-14 rounded-xl object-cover shadow-xs border border-slate-200" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 uppercase">
                  {item.badge}
                </span>
                <h4 className="font-bold text-slate-900 text-xs mt-1.5 truncate">{item.title}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{item.boxes.length} detected texts</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Main Vision Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Visual Viewport with AR Overlay */}
        <div className="lg:col-span-2 relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-300 shadow-md min-h-[420px] flex items-center justify-center">
          
          {activeMode === 'camera' ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-h-[460px] object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Camera Snap Button */}
              <button
                onClick={captureCameraFrame}
                className="absolute bottom-6 px-6 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-xl shadow-cyan-500/30 flex items-center space-x-2 active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Capture & Translate</span>
              </button>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center bg-black/40">
              <img
                src={activeImageUrl}
                alt="Source OCR Target"
                className="max-h-[480px] w-full object-contain"
              />

              {/* AR Translated Text Overlays (Page 4 of PDF) */}
              {showAROverlay && detectedBoxes.map((box, bIdx) => (
                <div
                  key={bIdx}
                  style={{
                    position: 'absolute',
                    left: `${box.bbox.x0}%`,
                    top: `${box.bbox.y0}%`,
                    width: `${Math.max(12, box.bbox.x1 - box.bbox.x0)}%`,
                    height: `${Math.max(10, box.bbox.y1 - box.bbox.y0)}%`,
                  }}
                  className="bg-slate-950/85 backdrop-blur-md border-2 border-cyan-400 rounded-lg p-1.5 flex flex-col justify-center shadow-xl animate-fade-in pointer-events-auto hover:scale-105 transition-transform"
                >
                  <div className="text-[10px] text-cyan-300 line-through opacity-70 truncate">
                    {box.text}
                  </div>
                  <div className="text-xs font-extrabold text-white text-shadow truncate flex items-center justify-between">
                    <span>{box.translatedText}</span>
                    <button
                      onClick={() => speechService.speak(box.translatedText, targetLang, {
                        voiceGender: user.voiceGender,
                        rate: user.voiceSpeed,
                        tone: user.voiceTone,
                      })}
                      className="ml-1 text-cyan-400 hover:text-white"
                      title="Pronounce"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-cyan-400 space-y-2">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-semibold">Running Computer Vision & OCR...</span>
                </div>
              )}
            </div>
          )}

          {/* AR Mode Indicator badge */}
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-[11px] font-bold text-cyan-300 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>AR Live Spatial Overlay</span>
          </div>

        </div>

        {/* Translation Extraction List */}
        <div className="p-5 rounded-3xl glass-panel space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-600" /> Detected Texts ({detectedBoxes.length})
              </h3>
              <span className="text-[10px] text-slate-600 font-bold uppercase font-mono bg-slate-100 px-2 py-0.5 rounded">
                {selectedDemo.detectedLanguage.toUpperCase()} → {targetLang.toUpperCase()}
              </span>
            </div>

            {/* List of text items */}
            <div className="space-y-2.5 mt-3 max-h-[340px] overflow-y-auto">
              {detectedBoxes.map((box, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-mono text-[10px] font-semibold">Text #{idx + 1}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">{box.confidence}% match</span>
                  </div>

                  <div className="text-slate-600 font-medium">
                    {box.text}
                  </div>

                  <div className="text-slate-900 font-bold text-sm flex items-center justify-between pt-0.5">
                    <span>{box.translatedText}</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => speechService.speak(box.translatedText, targetLang, {
                          voiceGender: user.voiceGender,
                          rate: user.voiceSpeed,
                          tone: user.voiceTone,
                        })}
                        className="p-1 rounded text-cyan-600 hover:text-cyan-800 hover:bg-slate-50 transition-colors"
                        title="Listen"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => saveWordToBank({
                          originalText: box.text,
                          translatedText: box.translatedText,
                          fromLang: selectedDemo.detectedLanguage as SupportedLanguage,
                          toLang: targetLang,
                          context: 'Vision Camera Translation',
                        })}
                        className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-slate-50 transition-colors"
                        title="Save to Vocabulary"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload input button when on upload mode */}
          {activeMode === 'upload' && (
            <label className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer shadow-md transition-all active:scale-98">
              <Upload className="w-4 h-4" />
              <span>Select Poster / Menu File</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          )}

        </div>

      </div>

    </div>
  );
};
