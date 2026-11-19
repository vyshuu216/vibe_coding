import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import {
  fetchConversations,
  fetchConversation,
  deleteConversation,
  downloadExportTranscript,
  streamChatSSE,
} from './services/api';

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentTitle, setCurrentTitle] = useState('New Chat');
  const [messages, setMessages] = useState([]);
  const [selectedTone, setSelectedTone] = useState(() => {
    return localStorage.getItem('vibe_tone') || 'Professional';
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('vibe_theme') || 'dark';
  });
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [toast, setToast] = useState(null);

  const abortControllerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Synchronize Dark / Light mode class on document element & localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('vibe_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Show transient toast notification
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Persist chosen tone in localStorage
  const handleSelectTone = (tone) => {
    setSelectedTone(tone);
    localStorage.setItem('vibe_tone', tone);
  };

  // Load conversations list from backend (supports server-side keyword search ?q=)
  const refreshConversations = useCallback(async (query = '') => {
    try {
      setIsLoadingConversations(true);
      const data = await fetchConversations(query);
      setConversations(data || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // Debounced search when searchQuery changes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      refreshConversations(searchQuery);
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, refreshConversations]);

  // Load a specific conversation thread
  const handleSelectConversation = async (id) => {
    if (isStreaming) {
      showToast('Please wait or stop current response before switching chats.', 'warn');
      return;
    }

    try {
      setErrorMessage(null);
      const data = await fetchConversation(id);
      setCurrentConversationId(data._id);
      setCurrentTitle(data.title || 'Conversation');
      setMessages(data.messages || []);
      // Close sidebar on small screens
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    } catch (err) {
      console.error('Failed to select conversation:', err);
      showToast('Could not load conversation.', 'error');
    }
  };

  // Start fresh chat
  const handleNewChat = () => {
    if (isStreaming) {
      showToast('Please wait or stop current response first.', 'warn');
      return;
    }
    setCurrentConversationId(null);
    setCurrentTitle('New Chat');
    setMessages([]);
    setStreamingContent('');
    setErrorMessage(null);
    setInput('');
  };

  // Delete a conversation thread
  const handleDeleteConversation = async (id) => {
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (currentConversationId === id) {
        handleNewChat();
      }
      showToast('Conversation deleted successfully.', 'success');
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      showToast('Failed to delete conversation.', 'error');
    }
  };

  // Export current conversation thread as Markdown
  const handleExportMarkdown = async () => {
    if (!currentConversationId) {
      showToast('Send a message first to establish a conversation to export.', 'info');
      return;
    }

    try {
      setIsExporting(true);
      await downloadExportTranscript(currentConversationId, currentTitle);
      showToast('Markdown transcript downloaded successfully!', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Failed to export transcript.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Cancel in-flight streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    // If partial content was received, persist it to local state
    if (streamingContent.trim()) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: streamingContent + ' *(stopped)*',
          tone: selectedTone,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
    setStreamingContent('');
    showToast('Generation cancelled.', 'info');
  };

  // Send message and stream reply via SSE
  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isStreaming) return;

    // Reset error & clear input immediately
    setErrorMessage(null);
    setInput('');

    // Append optimistic user message
    const userMsg = {
      role: 'user',
      content: trimmedInput,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Begin SSE Streaming state
    setIsStreaming(true);
    setStreamingContent('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulated = '';

    await streamChatSSE({
      conversationId: currentConversationId,
      message: trimmedInput,
      tone: selectedTone,
      signal: controller.signal,
      onChunk: (chunk) => {
        accumulated += chunk;
        setStreamingContent(accumulated);
      },
      onDone: (meta) => {
        setIsStreaming(false);
        setStreamingContent('');
        abortControllerRef.current = null;

        // If newly generated thread, set active conversation ID & title
        if (meta.conversationId) {
          setCurrentConversationId(meta.conversationId);
        }
        if (meta.title) {
          setCurrentTitle(meta.title);
        }

        // Commit full assistant message to state with telemetry
        if (meta.assistantMessage) {
          setMessages((prev) => [...prev, meta.assistantMessage]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: accumulated,
              tone: meta.tone || selectedTone,
              latencyMs: meta.latencyMs,
              wordCount: meta.wordCount,
              timestamp: new Date().toISOString(),
            },
          ]);
        }

        // Refresh conversation sidebar list to show updated thread & snippet
        refreshConversations(searchQuery);
      },
      onError: (err) => {
        console.error('SSE Error:', err);
        setIsStreaming(false);
        setErrorMessage(err.message || 'Error occurred while streaming.');
        abortControllerRef.current = null;
        showToast(err.message || 'Failed to stream response.', 'error');
      },
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium shadow-2xl transition-all duration-300 animate-fade-in border ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-800'
              : toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-800'
              : toast.type === 'warn'
              ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-800'
              : 'bg-white text-slate-800 border-slate-200 dark:bg-slate-900/90 dark:text-slate-200 dark:border-slate-700'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Collapsible Left History Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoadingConversations={isLoadingConversations}
      />

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          conversationTitle={currentTitle}
          selectedTone={selectedTone}
          onSelectTone={handleSelectTone}
          isStreaming={isStreaming}
          onExportMarkdown={handleExportMarkdown}
          hasMessages={messages.length > 0}
          isExporting={isExporting}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        <ChatWindow
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          selectedTone={selectedTone}
          input={input}
          setInput={setInput}
          onSend={handleSend}
          onStop={handleStopStreaming}
          errorMessage={errorMessage}
        />
      </div>
    </div>
  );
}
