import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api';
import { Send, Bot, Sparkles, Globe, RefreshCw, AlertCircle } from 'lucide-react';

interface CopilotProps {
  userMode?: string;
  location?: string;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  source?: string;
  confidence?: number;
  assets?: string[];
  timestamp?: string;
  language?: string;
}

const LANGUAGES = [
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'hi', label: 'हिंदी (Hindi)', flag: '🇮🇳' },
  { id: 'gu', label: 'ગુજરાતી (Gujarati)', flag: '🦁' },
];

const QUESTIONS_BY_LANG: { [lang: string]: string[] } = {
  en: [
    'Why is KT-WT-05 underperforming?',
    'What is our current wind vs solar generation in Kutch?',
    'What is the grid curtailment risk with Gujarat GETCO?',
    'What will happen if we delay blade maintenance?',
    'What does the 24-hour weather forecast show?',
  ],
  hi: [
    'कच्छ और बनासकांठा में आज कुल उत्पादन कितना है?',
    'पवन ऊर्जा और सौर ऊर्जा का वर्तमान उत्पादन क्या है?',
    'KT-WT-05 टरबाइन के प्रदर्शन में गिरावट का क्या कारण है?',
    'क्या आज गुजरात GETCO ग्रिड कर्टेलमेंट का कोई जोखिम है?',
    'मौसम पूर्वानुमान के आधार पर अगले 24 घंटे का उत्पादन कैसा रहेगा?',
  ],
  gu: [
    'કચ્છ અને બનાસકાંઠા હાઇબ્રિડ પાર્કમાં કુલ ઉત્પાદન કેટલું છે?',
    'પવન ઊર્જા અને સોલાર ઊર્જાનું વર્તમાન ઉત્પાદન કેટલું છે?',
    'KT-WT-05 પવન ટર્બાઇનમાં પાવર ડ્રોપનું કારણ શું છે?',
    'ગુજરાત GETCO ગ્રીડ સાથે કટોકટી કે કર્ટલમેન્ટનું જોખમ છે?',
    'લાઈવ હવામાન મુજબ આગામી ૨૪ કલાકમાં કેટલું ઉત્પાદન થશે?',
  ],
};

const GREETINGS: { [lang: string]: string } = {
  en: 'Hello! I am the GridPulse AI Copilot powered by IBM Granite LLM. Ask me about Kutch & Banaskantha hybrid solar-wind park performance, predictive maintenance, live Open-Meteo weather, or GETCO grid integration.',
  hi: 'नमस्ते! मैं IBM Granite LLM द्वारा संचालित GridPulse AI कॉपायलट हूँ। मुझसे कच्छ और बनासकांठा के हाइब्रिड सोलर-विंड पार्क, मेंटेनेंस, लाइव मौसम और ग्रिड इंटीग्रेशन के बारे में हिंदी, गुजराती या अंग्रेजी में पूछें।',
  gu: 'નમસ્તે! હું IBM Granite LLM સંચાલિત GridPulse AI કૉપાયલટ છું. મને કચ્છ અને બનાસકાંઠાના સોલાર-પવન હાઇબ્રિડ પાર્ક, પ્રિડિક્ટિવ મેન્ટેનન્સ, લાઈવ હવામાન અથવા ગ્રીડ ઇન્ટિગ્રેશન વિશે ગુજરાતી, હિન્દી કે અંગ્રેજીમાં કોઈપણ પ્રશ્ન પૂછો.',
};

export default function Copilot({ userMode = 'operator', location = 'Kutch & Banaskantha' }: CopilotProps) {
  const [language, setLanguage] = useState('en');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      text: GREETINGS['en'],
      source: 'IBM Granite LLM',
      confidence: 0.98,
      language: 'en',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgId, setMsgId] = useState(1);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: 'assistant',
        text: GREETINGS[newLang] || GREETINGS['en'],
        source: 'IBM Granite LLM',
        confidence: 0.98,
        language: newLang,
      },
    ]);
  };

  const send = async (q?: string) => {
    const question = q || input.trim();
    if (!question || loading) return;
    setInput('');
    setLoading(true);

    const userMsg: Message = { id: msgId, role: 'user', text: question, language };
    setMessages((m) => [...m, userMsg]);
    setMsgId((n) => n + 1);

    try {
      const res = await fetch('/api/copilot/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, language, user_mode: userMode }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const answer = data.results?.answer || 'No response received from IBM Granite.';

      const assistantMsg: Message = {
        id: msgId + 1,
        role: 'assistant',
        text: answer,
        source: data.results?.source || 'IBM Granite LLM',
        confidence: data.confidence,
        assets: data.results?.relevant_assets || [],
        timestamp: data.results?.timestamp,
        language,
      };

      setMessages((m) => [...m, assistantMsg]);
      setMsgId((n) => n + 2);
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        {
          id: msgId + 1,
          role: 'assistant',
          text: `Error contacting IBM Granite service: ${e.message}. Please ensure the Express server is running.`,
          source: 'System Error',
        },
      ]);
      setMsgId((n) => n + 2);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestions = QUESTIONS_BY_LANG[language] || QUESTIONS_BY_LANG['en'];

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] min-h-[540px] bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">
                Multilingual AI Renewable Copilot
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                IBM Granite
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live reasoning across Kutch & Banaskantha · {location}
            </p>
          </div>
        </div>

        {/* Language selector toggle */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <Globe className="w-3.5 h-3.5 text-slate-500 ml-1" />
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              onClick={() => handleLanguageChange(l.id)}
              className={`text-xs px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                language === l.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="mr-1">{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex gap-2 overflow-x-auto no-scrollbar">
        {currentQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => send(q)}
            disabled={loading}
            className="shrink-0 text-xs px-3 py-1.5 bg-slate-800/90 border border-slate-700/80 text-slate-300 rounded-full hover:bg-blue-900/30 hover:border-blue-500/40 hover:text-blue-300 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[75%] rounded-xl p-3.5 text-sm ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                  : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-bl-none shadow-md'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-700/50 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-blue-400 font-medium">
                    <Sparkles className="w-3 h-3" />
                    {m.source || 'IBM Granite LLM'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono">
                      Real Data: MongoDB + Open-Meteo
                    </span>
                    {m.confidence && (
                      <span className="text-emerald-400 font-mono">
                        {Math.round(m.confidence * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="whitespace-pre-line leading-relaxed">{m.text}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-3.5 rounded-bl-none text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span>IBM Granite is reasoning across real-time park telemetry...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            language === 'gu'
              ? 'સોલાર, પવન, મેન્ટેનન્સ અથવા ગ્રીડ વિશે પ્રશ્ન પૂછો...'
              : language === 'hi'
              ? 'सोलर, पवन, मेंटेनेंस या ग्रिड के बारे में प्रश्न पूछें...'
              : 'Ask about solar/wind generation, maintenance, or GETCO grid...'
          }
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
