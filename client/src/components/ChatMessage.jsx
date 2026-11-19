import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Check, Copy, Clock, Zap, Briefcase, Coffee } from 'lucide-react';

function getToneBadge(tone) {
  switch (tone) {
    case 'Professional':
      return {
        label: 'Professional',
        icon: Briefcase,
        color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20',
      };
    case 'Casual':
      return {
        label: 'Casual',
        icon: Coffee,
        color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
      };
    case 'Concise':
      return {
        label: 'Concise',
        icon: Zap,
        color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
      };
    default:
      return null;
  }
}

export default function ChatMessage({ message, isStreaming = false }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message text:', err);
    }
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const toneBadge = message.tone ? getToneBadge(message.tone) : null;
  const ToneIcon = toneBadge?.icon;

  return (
    <div className={`flex w-full my-4 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`flex gap-3 max-w-[85%] md:max-w-[78%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
            isUser
              ? 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white'
              : 'bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 border border-slate-300 dark:border-slate-600/50 text-indigo-600 dark:text-indigo-400'
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Bubble & Metadata Container */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0`}>
          {/* Main Bubble */}
          <div
            className={`relative group rounded-2xl px-4 py-3 shadow-sm ${
              isUser
                ? 'bg-indigo-600 text-white rounded-tr-sm selection:bg-indigo-800'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-sm'
            }`}
          >
            {/* Copy button */}
            {!isStreaming && message.content && (
              <button
                type="button"
                onClick={copyToClipboard}
                title="Copy message"
                className={`absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${
                  isUser
                    ? 'hover:bg-indigo-700 text-indigo-200'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Message Body */}
            {isUser ? (
              <p className="text-[0.9375rem] leading-relaxed whitespace-pre-wrap break-words pr-4">
                {message.content}
              </p>
            ) : (
              <div
                className={`chat-markdown break-words pr-4 ${
                  isStreaming ? 'streaming-cursor' : ''
                }`}
              >
                <ReactMarkdown>{message.content || ''}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Timestamp & Telemetry Badge Row */}
          <div className="flex items-center gap-2 mt-1.5 px-1 text-xs text-slate-500 dark:text-slate-400">
            {/* Telemetry Badge (AI only) */}
            {!isUser && (message.tone || message.latencyMs != null || message.wordCount != null) && (
              <div className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/80 text-[11px] text-slate-600 dark:text-slate-400">
                {toneBadge && (
                  <span className={`inline-flex items-center gap-1 font-medium ${toneBadge.color.split(' ')[0]}`}>
                    {ToneIcon && <ToneIcon className="w-3 h-3" />}
                    {toneBadge.label}
                  </span>
                )}
                {toneBadge && (message.latencyMs != null || message.wordCount != null) && (
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                )}
                {message.latencyMs != null && (
                  <span className="text-slate-700 dark:text-slate-300 font-mono font-medium">
                    {(message.latencyMs / 1000).toFixed(2)}s
                  </span>
                )}
                {message.wordCount != null && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {message.wordCount} {message.wordCount === 1 ? 'word' : 'words'}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Timestamp */}
            <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {formatTimestamp(message.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
