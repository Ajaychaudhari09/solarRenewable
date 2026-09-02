import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  source?: string;
  confidence?: number;
  assets?: string[];
  timestamp?: string;
}

const SAMPLE_QUESTIONS = [
  'Why is WT-07 underperforming?',
  'Which asset needs immediate attention?',
  'What will happen if we delay maintenance?',
  'How much revenue are we losing?',
  "What is tomorrow's expected generation?",
  'Why is grid risk high?',
  'What is our CO₂ impact today?',
];

export default function Copilot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0, role: 'assistant',
      text: 'Hello. I am the GridPulse AI Operations Copilot. I can answer questions about asset health, maintenance, revenue, forecasts, and grid conditions. All answers are grounded in verified operational data from our 24-agent analytics pipeline.\n\nWhat would you like to know?',
      source: 'system',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [msgId, setMsgId] = useState(1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (q?: string) => {
    const question = q || input.trim();
    if (!question || loading) return;
    setInput('');
    setLoading(true);

    const userMsg: Message = { id: msgId, role: 'user', text: question };
    setMessages(m => [...m, userMsg]);
    setMsgId(n => n + 1);

    try {
      const res = await api.copilot(question);
      const answer = res.results?.answer || 'No response received.';
      const assistantMsg: Message = {
        id: msgId + 1,
        role: 'assistant',
        text: answer,
        source: res.results?.source || 'unknown',
        confidence: res.confidence,
        assets: res.results?.relevant_assets || [],
        timestamp: res.results?.timestamp,
      };
      setMessages(m => [...m, assistantMsg]);
      setMsgId(n => n + 2);
    } catch (e: any) {
      setMessages(m => [...m, {
        id: msgId + 1, role: 'assistant',
        text: `Error: ${e.message || 'Failed to connect to copilot'}`,
        source: 'error',
      }]);
      setMsgId(n => n + 2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-240px)] min-h-[500px]">
      {/* Sample questions */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {SAMPLE_QUESTIONS.map(q => (
          <button
            key={q}
            onClick={() => send(q)}
            className="shrink-0 text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-full hover:bg-slate-700 hover:border-slate-600 transition-colors"
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
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 border border-slate-700 text-slate-200'
            }`}>
              {m.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-blue-400">GridPulse AI</span>
                  {m.source && m.source !== 'system' && (
                    <span className="text-xs text-slate-500">
                      [{m.source === 'ibm_granite' ? '🔮 IBM Granite' : '📊 Deterministic'}]
                    </span>
                  )}
                  {m.confidence != null && (
                    <span className="text-xs text-slate-500">
                      {((m.confidence || 0) * 100).toFixed(0)}% confidence
                    </span>
                  )}
                </div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed">
                {/* Render **bold** text */}
                {m.text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                  part.startsWith('**') && part.endsWith('**')
                    ? <strong key={i}>{part.slice(2, -2)}</strong>
                    : <span key={i}>{part}</span>
                )}
              </div>
              {m.assets && m.assets.length > 0 && (
                <div className="mt-2 flex gap-1 flex-wrap">
                  {m.assets.map((a: string) => (
                    <span key={a} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
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
            <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-400 animate-pulse">
              Analyzing operational data…
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
          placeholder="Ask about assets, maintenance, forecasts, grid, or revenue…"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
