import React, { useState } from 'react';
import { HeartHandshake, Send, Volume2, Bookmark } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupportedLanguage } from '../../types';
import { translateText } from '../../services/translationService';
import { speechService } from '../../services/speechService';

interface BuddyMessage {
  id: string;
  sender: 'you' | 'partner';
  originalText: string;
  translatedText: string;
  fromLang: SupportedLanguage;
  toLang: SupportedLanguage;
  timestamp: string;
}

export const LanguageBuddy: React.FC = () => {
  const { user, saveWordToBank, addXP } = useApp();

  const [inputMsg, setInputMsg] = useState<string>('');
  const [youLang] = useState<SupportedLanguage>('en'); // You speak English, learn Japanese
  const [partnerLang] = useState<SupportedLanguage>('ja'); // Partner speaks Japanese, learns English

  const [chatMessages, setChatMessages] = useState<BuddyMessage[]>([
    {
      id: 'b1',
      sender: 'partner',
      originalText: 'こんにちは！英語の練習を手伝ってくれますか？',
      translatedText: 'Hello! Can you help me practice English?',
      fromLang: 'ja',
      toLang: 'en',
      timestamp: '1:10 PM',
    },
    {
      id: 'b2',
      sender: 'you',
      originalText: 'Of course! I would love to practice Japanese with you too.',
      translatedText: 'もちろんです！私もあなたと一緒に日本語を練習したいです。',
      fromLang: 'en',
      toLang: 'ja',
      timestamp: '1:11 PM',
    }
  ]);

  const handleSend = async () => {
    if (!inputMsg.trim()) return;

    const userText = inputMsg.trim();
    setInputMsg('');

    // Translate English -> Japanese
    const trans = await translateText(userText, youLang, partnerLang);
    const newMsg: BuddyMessage = {
      id: `b_${Date.now()}`,
      sender: 'you',
      originalText: userText,
      translatedText: trans.translatedText,
      fromLang: youLang,
      toLang: partnerLang,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, newMsg]);
    addXP(15, 'Tandem buddy message sent');

    // Simulate partner reply
    setTimeout(async () => {
      const partnerReplies = [
        { ja: '日本の文化で一番興味があるものは何ですか？', en: 'What interests you the most in Japanese culture?' },
        { ja: 'アニメや日本料理は好きですか？', en: 'Do you like anime or Japanese cuisine?' },
        { ja: '素晴らしい発音ですね！一緒に上達しましょう。', en: 'Great pronunciation! Let\'s improve together.' }
      ];
      const randomReply = partnerReplies[Math.floor(Math.random() * partnerReplies.length)];

      const partnerMsg: BuddyMessage = {
        id: `b_${Date.now() + 1}`,
        sender: 'partner',
        originalText: randomReply.ja,
        translatedText: randomReply.en,
        fromLang: 'ja',
        toLang: 'en',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages(prev => [...prev, partnerMsg]);
    }, 1500);
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-panel flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-pink-600" /> Language Buddy (Tandem Exchange)
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Seamless bilingual chat: You speak English (learning Japanese 🇯🇵), partner speaks Japanese (learning English 🇬🇧).
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold shadow-xs">
            <span>You: 🇬🇧 English → 🇯🇵</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold shadow-xs">
            <span>Partner: 🇯🇵 Japanese → 🇬🇧</span>
          </div>
        </div>
      </div>

      {/* Chat Thread */}
      <div className="p-5 rounded-3xl glass-panel h-[420px] flex flex-col justify-between">
        <div className="space-y-3 overflow-y-auto pr-1">
          {chatMessages.map((msg) => {
            const isYou = msg.sender === 'you';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isYou ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-4 rounded-2xl max-w-[85%] sm:max-w-[70%] space-y-1.5 shadow-sm ${
                    isYou 
                      ? 'bg-blue-600 text-white rounded-br-xs' 
                      : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200'
                  }`}
                >
                  <div className={`flex items-center justify-between space-x-3 text-[10px] mb-0.5 ${
                    isYou ? 'text-blue-100' : 'text-slate-500'
                  }`}>
                    <span className="font-bold">{isYou ? 'You' : 'Partner (Kenji 🇯🇵)'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div className="text-sm font-semibold">{msg.originalText}</div>
                  
                  <div className={`pt-1.5 mt-1 border-t text-xs flex items-center justify-between gap-2 ${
                    isYou ? 'border-white/20 text-blue-100' : 'border-slate-100 text-slate-600'
                  }`}>
                    <span className="italic">"{msg.translatedText}"</span>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        onClick={() => speechService.speak(msg.translatedText, msg.toLang, {
                          voiceGender: user.voiceGender,
                          rate: user.voiceSpeed,
                          tone: user.voiceTone,
                        })}
                        className={`p-1 rounded transition-colors ${
                          isYou ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-blue-600'
                        }`}
                        title="Pronounce"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => saveWordToBank({
                          originalText: msg.originalText,
                          translatedText: msg.translatedText,
                          fromLang: msg.fromLang,
                          toLang: msg.toLang,
                          context: 'Language Buddy Exchange',
                        })}
                        className={`p-1 rounded transition-colors ${
                          isYou ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-amber-500'
                        }`}
                        title="Save to Vocabulary"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <div className="flex items-center space-x-2 pt-3 border-t border-slate-200">
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type in English (will automatically translate for your partner)..."
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
