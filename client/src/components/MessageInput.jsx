import React, { useRef, useEffect } from 'react';
import { Send, Square, Sparkles } from 'lucide-react';

export default function MessageInput({
  input,
  setInput,
  onSend,
  onStop,
  isStreaming = false,
  selectedTone = 'Professional',
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea height to match content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      // Clamp between 48px and 160px
      textarea.style.height = `${Math.min(Math.max(scrollHeight, 48), 160)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto px-4 pb-4 pt-2">
      <div className="relative flex items-end gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-md dark:shadow-xl focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isStreaming
              ? 'Assistant is replying...'
              : `Ask anything in ${selectedTone} vibe... (Shift+Enter for newline)`
          }
          rows={1}
          disabled={isStreaming}
          className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm md:text-base resize-none outline-none px-3 py-2 max-h-40 overflow-y-auto leading-relaxed disabled:opacity-60"
        />

        {/* Action Button: Send or Stop */}
        <div className="flex items-center shrink-0 pb-1 pr-1">
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              title="Stop generating"
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all transform active:scale-95 animate-pulse"
            >
              <Square className="w-4 h-4 fill-white" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSend}
              disabled={!input.trim()}
              title="Send message"
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 dark:disabled:text-slate-600 shadow-md shadow-indigo-600/20 disabled:shadow-none transition-all transform active:scale-95 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-3 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
          <span>Vibe mode active: <span className="text-slate-700 dark:text-slate-300 font-medium">{selectedTone}</span></span>
        </span>
        <span className="hidden sm:inline">Press Enter to send, Shift + Enter for new line</span>
      </div>
    </div>
  );
}
