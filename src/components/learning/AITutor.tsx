import React, { useState } from 'react';
import { Bot, Send, Volume2, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupportedLanguage } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/mockData';
import { speechService } from '../../services/speechService';
import { translateText } from '../../services/translationService';

interface TutorFeedback {
  grammar: string;
  vocabulary: string;
  sentenceStructure: string;
  pronunciationTip: string;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  translation?: string;
  feedback?: TutorFeedback;
}

export const AITutor: React.FC = () => {
  const { addXP } = useApp();

  const [tutorLang, setTutorLang] = useState<SupportedLanguage>('es');
  const [userInput, setUserInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: '¡Hola! ¿Cómo estás? ¿De qué te gustaría hablar hoy?',
      translation: 'Hello! How are you? What would you like to talk about today?',
    }
  ]);

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const userText = userInput.trim();
    setUserInput('');

    // Generate smart structured feedback on grammar/structure
    let grammarNote = 'Good grammatical agreement.';
    let vocabNote = 'Natural word choices.';
    let structureNote = 'Proper sentence order.';
    let pronunTip = 'Focus on rolling your "r" sounds smoothly.';

    if (userText.length < 6) {
      structureNote = 'Try expanding into a full subject-verb-object sentence.';
    }
    if (/yo soy/i.test(userText)) {
      grammarNote = 'In Spanish, "Yo" is often omitted since the verb conjugation reveals the subject.';
    }

    const feedback: TutorFeedback = {
      grammar: grammarNote,
      vocabulary: vocabNote,
      sentenceStructure: structureNote,
      pronunciationTip: pronunTip,
    };

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: userText,
      feedback,
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    addXP(20, 'AI Tutor conversational practice');

    // Simulate AI response
    setTimeout(async () => {
      let aiReply = '';
      if (tutorLang === 'es') {
        aiReply = '¡Muy bien! Me parece excelente. ¿Qué planes tienes para el fin de semana?';
      } else if (tutorLang === 'hi') {
        aiReply = 'बहुत बढ़िया! क्या आप मुझे अपने कॉलेज और प्रोजेक्ट के बारे में कुछ और बता सकते हैं?';
      } else if (tutorLang === 'ja') {
        aiReply = '素晴らしいですね！週末には何をしますか？';
      } else {
        aiReply = 'Tres bien! Parlez-moi de votre ville ou de vos etudes.';
      }

      const trans = await translateText(aiReply, tutorLang, 'en');

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        translation: trans.translatedText,
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);

      speechService.speak(aiReply, tutorLang, {
        voiceGender: 'female',
        rate: 0.9,
      });
    }, 1200);
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-panel flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" /> AI Language Tutor
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Chat conversationally in your target language. AI analyzes your grammar, vocabulary, sentence structure & pronunciation.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-600 font-semibold">Target Language:</span>
          <select
            value={tutorLang}
            onChange={(e) => setTutorLang(e.target.value as SupportedLanguage)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 outline-none font-semibold cursor-pointer shadow-xs"
          >
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Thread */}
      <div className="p-5 rounded-3xl glass-panel h-[480px] flex flex-col justify-between shadow-xs">
        <div className="space-y-4 overflow-y-auto pr-1">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-4 rounded-2xl max-w-[85%] space-y-2 shadow-xs ${
                    isUser 
                      ? 'bg-blue-600 text-white rounded-br-xs' 
                      : 'bg-white border border-slate-200 text-slate-900 rounded-bl-xs'
                  }`}
                >
                  <div className={`flex items-center justify-between text-[11px] mb-1 ${
                    isUser ? 'text-blue-100 font-semibold' : 'text-slate-500 font-semibold'
                  }`}>
                    <span className="font-bold">{isUser ? 'You' : 'AI Tutor (Sofia 🤖)'}</span>
                    {!isUser && (
                      <button
                        onClick={() => speechService.speak(m.text, tutorLang, { voiceGender: 'female', rate: 0.9 })}
                        className="text-blue-600 hover:text-blue-800 p-0.5 rounded"
                        title="Listen"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="text-sm font-bold">{m.text}</div>

                  {m.translation && (
                    <div className="text-xs text-slate-500 italic pt-1 border-t border-slate-100">
                      "{m.translation}"
                    </div>
                  )}

                  {/* Structured Feedback Card (Page 10 of PDF: Grammar, Vocabulary, Structure, Pronunciation) */}
                  {m.feedback && (
                    <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-400 text-[11px] space-y-1 mt-2 text-white">
                      <div className="font-bold text-white flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-300" /> AI Feedback Analysis:
                      </div>
                      <div className="text-blue-50">
                        • <strong>Grammar:</strong> {m.feedback.grammar}
                      </div>
                      <div className="text-blue-50">
                        • <strong>Vocabulary:</strong> {m.feedback.vocabulary}
                      </div>
                      <div className="text-blue-50">
                        • <strong>Structure:</strong> {m.feedback.sentenceStructure}
                      </div>
                      <div className="text-amber-200 font-semibold">
                        • <strong>Pronunciation Tip:</strong> {m.feedback.pronunciationTip}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="p-3 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex items-center space-x-2 w-fit animate-pulse shadow-xs">
              <Bot className="w-4 h-4 text-blue-600" />
              <span>AI Tutor is crafting feedback & response...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="flex items-center space-x-2 pt-3 border-t border-slate-200">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Reply in ${SUPPORTED_LANGUAGES.find(l => l.code === tutorLang)?.name}...`}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
          />

          <button
            onClick={handleSend}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
