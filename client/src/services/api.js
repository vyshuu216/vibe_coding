/**
 * API Service Layer for AI Chat Assistant
 * Strictly communicates with backend server on VITE_API_URL
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Fetch all conversations with optional server-side search query
 * @param {string} searchQuery
 * @returns {Promise<Array>}
 */
export async function fetchConversations(searchQuery = '') {
  const url = new URL(`${API_BASE}/conversations`);
  if (searchQuery && searchQuery.trim()) {
    url.searchParams.set('q', searchQuery.trim());
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch conversations (${response.status})`);
  }

  return response.json();
}

/**
 * Fetch a single full conversation thread by ID
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function fetchConversation(id) {
  if (!id) throw new Error('Conversation ID is required');

  const response = await fetch(`${API_BASE}/conversations/${id}`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to load conversation (${response.status})`);
  }

  return response.json();
}

/**
 * Delete a conversation thread by ID
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function deleteConversation(id) {
  if (!id) throw new Error('Conversation ID is required');

  const response = await fetch(`${API_BASE}/conversations/${id}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete conversation (${response.status})`);
  }

  return response.json();
}

/**
 * Returns export endpoint URL for a conversation
 * @param {string} id
 * @returns {string}
 */
export function getExportUrl(id) {
  return `${API_BASE}/conversations/${id}/export`;
}

/**
 * Trigger browser download of the server-generated Markdown transcript
 * @param {string} id
 * @param {string} title
 */
export async function downloadExportTranscript(id, title = 'chat') {
  const url = getExportUrl(id);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to export transcript (${response.status})`);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  const safeTitle = (title || 'conversation')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .substring(0, 30);
  a.download = `chat_${safeTitle}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Stream AI reply from POST /api/chat/stream using Server-Sent Events (SSE)
 * via native fetch, ReadableStream, and TextDecoder.
 * 
 * @param {Object} options
 * @param {string} [options.conversationId]
 * @param {string} options.message
 * @param {string} options.tone
 * @param {Function} options.onChunk - Callback invoked with each streamed text chunk
 * @param {Function} options.onDone - Callback invoked when stream completes with metadata
 * @param {Function} options.onError - Callback invoked on error
 * @param {AbortSignal} [options.signal] - Optional signal to cancel streaming
 */
export async function streamChatSSE({
  conversationId,
  message,
  tone = 'Professional',
  onChunk,
  onDone,
  onError,
  signal,
}) {
  try {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        conversationId,
        message,
        tone,
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported by this browser/environment.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep incomplete trailing line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const jsonStr = trimmed.replace(/^data:\s*/, '');
        if (!jsonStr) continue;

        try {
          const parsed = JSON.parse(jsonStr);

          if (parsed.error) {
            if (onError) onError(new Error(parsed.error));
            return;
          }

          if (parsed.chunk && onChunk) {
            onChunk(parsed.chunk);
          }

          if (parsed.done && onDone) {
            onDone(parsed);
          }
        } catch (parseError) {
          console.warn('[SSE] Could not parse event line:', trimmed, parseError);
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('[SSE] Streaming aborted by user.');
      return;
    }
    if (onError) {
      onError(error);
    } else {
      console.error('[SSE Error]', error);
    }
  }
}

