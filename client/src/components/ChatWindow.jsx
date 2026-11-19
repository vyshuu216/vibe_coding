import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import {
  Bot,
  Sparkles,
  Zap,
  Coffee,
  Briefcase,
  Layers,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';

// Dynamic Starter Prompts tailored directly to each tone vibe
const TONE_SUGGESTIONS = {
  Professional: [
    {
      title: 'Executive Summary',
      prompt: 'Draft an executive briefing outlining the strategic advantages, ROI, and reliability of migrating to an asynchronous event-driven architecture.',
      icon: Briefcase,
    },
    {
      title: 'System Architecture',
      prompt: 'Detail an enterprise blueprint for decoupling business logic, validation, and AI orchestration in a scalable MERN application.',
      icon: Layers,
    },
    {
      title: 'Risk Analysis',
      prompt: 'Conduct a thorough risk assessment covering rate limiting, network latency, and graceful degradation during peak LLM API traffic.',
      icon: TrendingUp,
    },
  ],
  Casual: [
    {
      title: "Explain Like I'm 5",
      prompt: 'Explain how Server-Sent Events (SSE) stream words one-by-one as if I were five years old playing with toy trains.',
      icon: Sparkles,
    },
    {
      title: 'Fun Tech Analogy',
      prompt: 'Give me a fun kitchen or movie analogy to understand the difference between frontend presentation and backend server logic.',
      icon: Coffee,
    },
    {
      title: 'Brainstorm Ideas',
      prompt: "Let's brainstorm 3 super creative weekend project ideas combining AI chat vibes with interactive UI widgets!",
      icon: Lightbulb,
    },
  ],
  Concise: [
    {
      title: '3-Bullet Summary',
      prompt: 'Provide a 3-bullet summary of key differences between Server-Sent Events and WebSockets.',
      icon: Zap,
    },
    {
      title: 'Quick Comparison',
      prompt: 'Quick comparison: MongoDB Atlas vs In-Memory Store for rapid developer prototyping (pros and cons only).',
      icon: CheckCircle2,
    },
    {
      title: 'TL;DR Concept',
      prompt: 'TL;DR of why LLM temperature and system instructions affect output determinism in under 40 words.',
      icon: Clock,
    },
  ],
};

export default function ChatWindow({
  messages = [],
  isStreaming = false,
  streamingContent = '',
  selectedTone = 'Professional',
  input,
  setInput,
  onSend,
  onStop,
  errorMessage = null,
}) {
  const bottomRef = useRef(null);

  // Auto-scroll on new messages or stream chunks
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSuggestionClick = (prompt) => {
    setInput(prompt);
  };

  // Select dynamic cards based on active tone
  const suggestions = TONE_SUGGESTIONS[selectedTone] || TONE_SUGGESTIONS.Professional;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Scrollable Message List */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4">
        {messages.length === 0 && !isStreaming ? (
          /* Empty State / Welcome Screen with Tone-Aware Dynamic Cards */
          <div className="flex flex-col items-center justify-center min-h-[70%] max-w-2xl mx-auto text-center px-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-5">
              <Bot className="w-8 h-8" />
            </div>

            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">
              How can I assist you today?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 max-w-md leading-relaxed">
              Experience real-time Server-Sent Events (SSE) streaming with instant tone customization and telemetry metrics.
            </p>

            {/* Quick Starter Suggestions (Dynamically updated by Selected Tone) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
              {suggestions.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <button
                    key={`${selectedTone}-${idx}`}
                    type="button"
                    onClick={() => handleSuggestionClick(s.prompt)}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-100/80 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800/90 hover:border-indigo-400 dark:hover:border-indigo-500/50 text-left transition-all duration-200 group shadow-sm hover:shadow"
                  >
                    <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-white mb-1">
                      {s.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 line-clamp-2 leading-relaxed">
                      {s.prompt}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Messages List */
          <div className="max-w-4xl mx-auto w-full">
            {messages.map((msg, idx) => (
              <ChatMessage key={msg._id || idx} message={msg} />
            ))}

            {/* In-Flight Streaming Message */}
            {isStreaming && (
              <ChatMessage
                message={{
                  role: 'assistant',
                  content: streamingContent,
                  tone: selectedTone,
                  timestamp: new Date().toISOString(),
                }}
                isStreaming={true}
              />
            )}

            {/* Error banner if stream failed */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 my-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input Bar pinned to bottom */}
      <MessageInput
        input={input}
        setInput={setInput}
        onSend={onSend}
        onStop={onStop}
        isStreaming={isStreaming}
        selectedTone={selectedTone}
      />
    </div>
  );
}
