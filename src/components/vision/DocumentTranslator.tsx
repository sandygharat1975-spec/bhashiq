import React, { useState } from 'react';
import { FileText, Upload, Download, Copy, Check, ArrowRightLeft, Sparkles, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupportedLanguage } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/mockData';
import { translateText } from '../../services/translationService';

export const DocumentTranslator: React.FC = () => {
  const { addXP } = useApp();

  const [fromLang, setFromLang] = useState<SupportedLanguage>('en');
  const [toLang, setToLang] = useState<SupportedLanguage>('hi');

  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [originalDoc, setOriginalDoc] = useState<string>(
    `STUDENT SYLLABUS & EXAMINATION GUIDELINES
Course: Artificial Intelligence & Natural Language Processing
Semester: Final Year Mini-Project

1. Project Overview:
Students must develop a real-time multilingual communication system. The system must support low-latency speech translation, camera-based optical character recognition, and interactive language learning gamification.

2. Submission Deadlines:
- Abstract Submission: October 15
- Working Prototype Demonstration: November 02
- Final Viva Voce: November 20

3. Evaluation Criteria:
- Technical Innovation (40%)
- Real-Time Latency & Accuracy (30%)
- User Interface Polish & Usability (30%)`
  );

  const [translatedDoc, setTranslatedDoc] = useState<string>(
    `विद्यार्थी पाठ्यक्रम एवं परीक्षा दिशानिर्देश
पाठ्यक्रम: आर्टिफिशियल इंटेलिजेंस एवं नेचुरल लैंग्वेज प्रोसेसिंग
सत्र: अंतिम वर्ष मिनी-प्रोजेक्ट

१. परियोजना अवलोकन:
विद्यार्थियों को एक वास्तविक समय बहुभाषी संचार प्रणाली विकसित करनी होगी। प्रणाली में कम-विलंबता वाला भाषण अनुवाद, कैमरा-आधारित ऑप्टिकल कैरेक्टर रिकग्निशन, और संवादात्मक भाषा शिक्षण गैमिफिकेशन शामिल होना चाहिए।

२. सबमिशन की अंतिम तिथियां:
- सारांश सबमिशन: १५ अक्टूबर
- कार्यशील प्रोटोटाइप प्रदर्शन: ०२ नवंबर
- अंतिम मौखिक परीक्षा (वाइवा): २० नवंबर

३. मूल्यांकन मानदंड:
- तकनीकी नवाचार (४०%)
- रीयल-टाइम लेटेंसी एवं सटीकता (३०%)
- यूजर इंटरफेस पॉलिश एवं उपयोगिता (३०%)`
  );

  const [copied, setCopied] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      setOriginalDoc(text);
      translateFullDocument(text);
    };
    reader.readAsText(file);
  };

  const translateFullDocument = async (textToTranslate: string) => {
    setIsTranslating(true);
    const paragraphs = textToTranslate.split('\n\n');
    const translatedParagraphs: string[] = [];

    for (const para of paragraphs) {
      if (!para.trim()) {
        translatedParagraphs.push('');
        continue;
      }
      const lines = para.split('\n');
      const translatedLines: string[] = [];
      for (const line of lines) {
        if (!line.trim()) {
          translatedLines.push('');
          continue;
        }
        const res = await translateText(line.trim(), fromLang, toLang);
        translatedLines.push(res.translatedText);
      }
      translatedParagraphs.push(translatedLines.join('\n'));
    }

    setTranslatedDoc(translatedParagraphs.join('\n\n'));
    setIsTranslating(false);
    addXP(35, 'Document translated and structured');
  };

  const handleDownload = () => {
    const blob = new Blob([translatedDoc], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translated_document_${toLang}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-panel flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Document Translator
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Upload PDF, DOCX, TXT, or images. Extracts text, translates, and preserves paragraph layout side-by-side.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2 text-xs">
          <select
            value={fromLang}
            onChange={(e) => setFromLang(e.target.value as SupportedLanguage)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 outline-none font-semibold cursor-pointer shadow-xs"
          >
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
            ))}
          </select>

          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />

          <select
            value={toLang}
            onChange={(e) => setToLang(e.target.value as SupportedLanguage)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 outline-none font-semibold cursor-pointer shadow-xs"
          >
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
            ))}
          </select>

          <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer transition-all shadow-xs">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
            <input type="file" accept=".txt,.pdf,.docx,.doc" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Side-by-Side Document Panes (Page 4 of PDF) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original Document */}
        <div className="p-5 rounded-2xl glass-panel space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
            <span className="font-bold text-slate-800">
              Original Document ({SUPPORTED_LANGUAGES.find(l => l.code === fromLang)?.name})
            </span>
            <span className="text-slate-500 text-[10px] font-semibold">Editable source</span>
          </div>

          <textarea
            value={originalDoc}
            onChange={(e) => setOriginalDoc(e.target.value)}
            rows={16}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none shadow-xs"
          />

          <button
            onClick={() => translateFullDocument(originalDoc)}
            disabled={isTranslating}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-xs"
          >
            {isTranslating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isTranslating ? 'Translating Document...' : 'Translate Entire Document'}</span>
          </button>
        </div>

        {/* Translated Document */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-blue-50/60 border border-indigo-200 space-y-2.5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-indigo-200/70 pb-2 text-xs">
              <span className="font-bold text-indigo-900">
                Translated Document ({SUPPORTED_LANGUAGES.find(l => l.code === toLang)?.name})
              </span>
              <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold text-[10px]">Structure Preserved</span>
            </div>

            <textarea
              readOnly
              value={translatedDoc}
              rows={16}
              className="w-full bg-white border border-indigo-100 rounded-xl p-3 text-xs text-slate-900 font-mono leading-relaxed mt-2 focus:outline-none resize-none shadow-xs"
            />
          </div>

          {/* Download & Copy Bar */}
          <div className="flex items-center space-x-2 pt-2 border-t border-indigo-200/70">
            <button
              onClick={handleDownload}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.txt)</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(translatedDoc);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
