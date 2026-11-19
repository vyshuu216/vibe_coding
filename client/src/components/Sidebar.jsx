import React from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  X,
  Bot,
  PanelLeftClose,
  Sparkles,
} from 'lucide-react';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Sidebar({
  isOpen,
  onClose,
  conversations = [],
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  searchQuery,
  onSearchChange,
  isLoadingConversations = false,
}) {
  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 md:w-80 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                VibeAssistant <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Production AI MERN</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60 transition-colors"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4 hidden md:block" />
            <X className="w-4 h-4 md:hidden" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            type="button"
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition-all transform active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          {isLoadingConversations ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-xs gap-2">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading threads...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-12 text-center px-4">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 mb-2 opacity-50" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {searchQuery ? 'No matching threads found' : 'No conversations yet'}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-1">
                {searchQuery ? 'Try a different keyword' : 'Start a new chat to begin'}
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeId === conv._id;
              return (
                <div
                  key={conv._id}
                  onClick={() => onSelectConversation(conv._id)}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                    isActive
                      ? 'bg-indigo-50/90 dark:bg-slate-800/90 text-indigo-950 dark:text-white border border-indigo-200/80 dark:border-slate-700/60 shadow-sm font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-900/80 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400'
                      }`}
                    />
                    <div className="truncate">
                      <div className="truncate">{conv.title}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5 font-normal">
                        <span>{formatRelativeTime(conv.updatedAt || conv.createdAt)}</span>
                        {conv.messageCount != null && (
                          <>
                            <span>•</span>
                            <span>{conv.messageCount} msg{conv.messageCount === 1 ? '' : 's'}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv._id);
                    }}
                    title="Delete thread"
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 dark:text-slate-500 dark:hover:text-rose-400 transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
          <span>SSE Streaming Enabled</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            Online
          </span>
        </div>
      </aside>
    </>
  );
}
