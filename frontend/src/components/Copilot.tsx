import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api';

interface CopilotProps {
  userMode: string;
  location: string;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  source?: string;
  confidence?: number;
  assets?: string[];
  timestamp?: string;
  userMode?: string;
}

const OPERATOR_QUESTIONS = [
  'Why is WT-07 underperforming?',
  'Which asset needs immediate attention?',
  'What will happen if we delay maintenance?',
  'How much revenue are we losing today?',
  'What is our CO₂ impact today?',
  'Why is grid risk elevated?',
  'What does the 6-hour forecast show?',
];

const SIMPLE_QUESTIONS = [
  'Is my solar system working properly?',
  'Why did generation decrease today?',
  'How much money are we saving?',
  'Should we clean the solar panels?',
  'Will tomorrow be a good day for solar?',
  'What does the low energy alert mean?',
  'How does cloud cover affect generation?',
];

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'Hindi' },
  { id: 'gu', label: 'Gujarati' },
];

export default function Copilot({ userMode, location }: CopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0, role: 'assistant',
      text: userMode === 'simple'
        ? 'Hello! I am your GridPulse AI assistant. I can help you understand your solar and wind energy system in simple terms. What would you like to know?'
        : 'Hello. I am the GridPulse AI Operations Copilot. Ask me about asset health, maintenance priorities, generation forecasts, financial impact, or grid conditions. All answers are grounded in verified operational data from our 28-agent analytics pipeline.',
      source: 'system',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [msgId, setMsgId] = useState(1);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const questions = userMode === 'simple' ? SIMPLE_QUESTIONS : OPERATOR_QUESTIONS;

  const send = async (q?: string) => {
    const question = q || input.trim();
    if (!question || loading) return;
    setInput('');
    setLoading(true);

    const userMsg: Message = { id: msgId, role: 'user', text: question };
    setMessages(m => [...m, userMsg]);
    setMsgId(n => n + 1);

    try {
      const res = await api.copilotV2(question, language, userMode);
      const answer = res.results?.answer || 'No response received.';
      const assistantMsg: Message = {
        id: msgId + 1,
        role: 'assistant',
        text: answer,
        source: res.results?.source || 'unknown',
        confidence: res.confidence,
        assets: res.results?.relevant_assets || [],
        timestamp: res.results?.timestamp,
        userMode: res.results?.user_mode,
      };
      setMessages(m => [...m, assistantMsg]);
      setMsgId(n => n + 2);
    } catch (e: any) {
      setMessages(m => [...m, {
        id: msgId + 1, role: 'assistant',
        text: `Cannot reach the AI service. Make sure the backend is running on http://localhost:8000`,
        source: 'error',
      }]);
      setMsgId(n => n + 2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-260px)] min-h-[480px]">
      {/* Header controls */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-white">AI Renewable Energy Copilot</h2>
          <div className="text-xs text-slate-500">
            {userMode === 'simple' ? 'Plain-language answers for everyone' : 'Operator-grade analytics with IBM Granite'} · {location}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Language:</span>
          {LANGUAGES.map(l => (
            <button
              key={l.id}
              onClick={() => setLanguage(l.id)}
              className={`text-xs px-2 py-1 rounded ${language === l.id ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Suggested questions */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
        {questions.map(q => (
          <button
            key={q}
            onClick={() => send(q)}
            className="shrink-0 text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-full hover:bg-slate-700 hover:border-blue-600/50 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl rounded-xl px-4 py-3 text-sm ${
              m.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-sm'
            }`}>
              {m.role === 'assistant' && m.source !== 'system' && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
                  <span className="text-xs font-bold text-blue-400">GridPulse AI</span>
                  {m.source === 'ibm_granite' && (
                    <span className="text-xs bg-blue-900/50 text-blue-300 border border-blue-700/40 px-1.5 py-0.5 rounded text-xs">
                      IBM Granite
                    </span>
                  )}
                  {m.source === 'deterministic_fallback' && (
                    <span className="text-xs bg-slate-700 text-slate-400 border border-slate-600 px-1.5 py-0.5 rounded">
                      Analytics Engine
                    </span>
                  )}
                  {m.confidence != null && (
                    <span className="text-xs text-slate-500 ml-auto">
                      {((m.confidence || 0) * 100).toFixed(0)}% confidence
                    </span>
                  )}
                </div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed text-sm">
                {m.text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                  part.startsWith('**') && part.endsWith('**')
                    ? <strong key={i} className="text-white">{part.slice(2, -2)}</strong>
                    : <span key={i}>{part}</span>
                )}
              </div>
              {m.assets && m.assets.length > 0 && (
                <div className="mt-2 flex gap-1 flex-wrap">
                  <span className="text-xs text-slate-500">Relevant assets:</span>
                  {m.assets.map((a: string) => (
                    <span key={a} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full border border-slate-600">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-400">
              <span className="animate-pulse">Analyzing renewable energy data</span>
              <span className="animate-bounce">...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={userMode === 'simple'
            ? 'Ask anything about your solar system...'
            : 'Ask about assets, maintenance, forecasts, grid, or revenue...'}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
          disabled={loading}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
