import React from 'react';
import { PanelLeft, Download, Sun, Moon } from 'lucide-react';
import ToneSelector from './ToneSelector';

export default function Header({
  isSidebarOpen,
  onToggleSidebar,
  conversationTitle = 'New Chat',
  selectedTone,
  onSelectTone,
  isStreaming = false,
  onExportMarkdown,
  hasMessages = false,
  isExporting = false,
  theme = 'dark',
  onToggleTheme,
}) {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/70 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left side: Sidebar Toggle & Thread Title */}
      <div className="flex items-center gap-3 min-w-0">
        {!isSidebarOpen && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title="Open Sidebar"
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800/80 transition-all shrink-0"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <div className="truncate">
          <div className="flex items-center gap-2">
            <h2 className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-100 truncate">
              {conversationTitle}
            </h2>
            {isStreaming && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/20 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-ping" />
                Streaming
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Tone Toggle, Sun/Moon Theme Toggle & Export Button */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Tone Selector Segmented Control */}
        <ToneSelector
          selectedTone={selectedTone}
          onSelectTone={onSelectTone}
          disabled={isStreaming}
        />

        {/* Dark / Light Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 transition-all shadow-sm"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* Server-Side Markdown Export Button */}
        <button
          type="button"
          onClick={onExportMarkdown}
          disabled={!hasMessages || isStreaming || isExporting}
          title={hasMessages ? "Export thread as Markdown file" : "Start chatting to export transcript"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">Export .md</span>
        </button>
      </div>
    </header>
  );
}
