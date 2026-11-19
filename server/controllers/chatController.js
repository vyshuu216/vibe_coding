import mongoose from 'mongoose';
import OpenAI from 'openai';
import { Conversation } from '../models/Conversation.js';
import { getSystemInstruction, normalizeTone } from '../utils/tones.js';
import { calculateWordCount, calculateLatencyMs } from '../utils/telemetry.js';

/**
 * Configure OpenAI client
 */
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return null; // Fallback mock streamer when key is unset
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
}

/**
 * Fallback simulated streaming response for testing when no OpenAI API key is supplied
 */
async function* simulateToneResponse(userMessage, tone) {
  const toneResponses = {
    Professional: `Thank you for your inquiry regarding "${userMessage}". In an enterprise context, this topic warrants a systematic evaluation. Key considerations include architectural scalability, deterministic data pipelines, and adherence to production best practices. By decoupling presentation state from business logic, the system maintains robust reliability and auditability.`,
    Casual: `Hey there! That's an awesome question about "${userMessage}". Basically, the way I look at it is like building with Lego blocks—keep your pieces modular, have fun with the vibe, and make sure everything clicks nicely together. Let me know what specific part you want to dive into!`,
    Concise: `Analysis for "${userMessage}":\n• Direct implementation recommended.\n• Core principles: modularity, low-latency streaming, and strict validation.\n• Ready for next command.`
  };

  const responseText = toneResponses[tone] || toneResponses.Professional;
  const words = responseText.split(' ');

  for (let i = 0; i < words.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 35));
    yield (i === 0 ? '' : ' ') + words[i];
  }
}

/**
 * POST /api/chat/stream
 * Server-Sent Events (SSE) streaming endpoint for AI replies
 */
export async function streamChat(req, res) {
  const startTime = Date.now();
  const { conversationId, message, tone: rawTone } = req.body || {};

  // Validation
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  const trimmedMessage = message.trim();
  const tone = normalizeTone(rawTone);
  const systemInstruction = getSystemInstruction(tone);

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  let conversation;

  try {
    // 1. Find or create conversation
    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      conversation = await Conversation.findById(conversationId);
    }

    if (!conversation) {
      // Derive a clean title from the first message
      const generatedTitle = trimmedMessage.length > 40
        ? `${trimmedMessage.substring(0, 37)}...`
        : trimmedMessage;

      conversation = new Conversation({
        title: generatedTitle,
        messages: [],
      });
    }

    // 2. Append User message
    const userMessageDoc = {
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date(),
    };
    conversation.messages.push(userMessageDoc);
    await conversation.save();

    // 3. Prepare AI messages payload
    // Include last 10 messages for historical context
    const recentMessages = conversation.messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }));

    const apiMessages = [
      { role: 'system', content: systemInstruction },
      ...recentMessages,
    ];

    let assistantContent = '';
    const openai = getOpenAIClient();

    if (openai) {
      // Live streaming via OpenAI API
      const stream = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: apiMessages,
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          assistantContent += text;
          res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
        }
      }
    } else {
      // Stream tone-aware simulated fallback
      for await (const token of simulateToneResponse(trimmedMessage, tone)) {
        assistantContent += token;
        res.write(`data: ${JSON.stringify({ chunk: token })}\n\n`);
      }
    }

    // 4. Calculate Telemetry
    const latencyMs = calculateLatencyMs(startTime);
    const wordCount = calculateWordCount(assistantContent);

    // 5. Append Assistant message to conversation & persist
    const assistantMessageDoc = {
      role: 'assistant',
      content: assistantContent,
      tone,
      latencyMs,
      wordCount,
      timestamp: new Date(),
    };

    conversation.messages.push(assistantMessageDoc);
    await conversation.save();

    // 6. Send final SSE completion event
    res.write(
      `data: ${JSON.stringify({
        done: true,
        conversationId: conversation._id.toString(),
        title: conversation.title,
        tone,
        latencyMs,
        wordCount,
        assistantMessage: assistantMessageDoc,
      })}\n\n`
    );

    res.end();
  } catch (error) {
    console.error('[streamChat] Error during chat streaming:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message || 'Streaming failed.' });
    }
    res.write(`data: ${JSON.stringify({ error: error.message || 'Streaming error occurred.' })}\n\n`);
    res.end();
  }
}

/**
 * GET /api/conversations
 * Fetch conversation history with optional keyword search (?q=)
 */
export async function getConversations(req, res) {
  try {
    const { q } = req.query;
    let filter = {};

    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = q.trim();
      const regex = new RegExp(searchTerm, 'i');
      filter = {
        $or: [
          { title: regex },
          { 'messages.content': regex }
        ]
      };
    }

    const conversations = await Conversation.find(filter)
      .sort({ updatedAt: -1 })
      .select('title createdAt updatedAt messages')
      .lean();

    const formatted = conversations.map(c => {
      const lastMsg = c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;
      return {
        _id: c._id,
        title: c.title,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        messageCount: c.messages ? c.messages.length : 0,
        lastMessageSnippet: lastMsg ? (lastMsg.content.substring(0, 80) + (lastMsg.content.length > 80 ? '...' : '')) : '',
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('[getConversations] Error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversations.' });
  }
}

/**
 * GET /api/conversations/:id
 * Fetch complete thread by ID
 */
export async function getConversationById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid conversation ID format.' });
    }

    const conversation = await Conversation.findById(id).lean();
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('[getConversationById] Error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation.' });
  }
}

/**
 * DELETE /api/conversations/:id
 * Delete thread by ID
 */
export async function deleteConversation(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid conversation ID format.' });
    }

    const result = await Conversation.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    res.json({ success: true, message: 'Conversation deleted successfully.' });
  } catch (error) {
    console.error('[deleteConversation] Error:', error);
    res.status(500).json({ error: 'Failed to delete conversation.' });
  }
}

/**
 * GET /api/conversations/:id/export
 * Export conversation thread as a structured Markdown (.md) attachment
 */
export async function exportConversation(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid conversation ID format.' });
    }

    const conversation = await Conversation.findById(id).lean();
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Build structured Markdown
    const exportDate = new Date().toISOString();
    let md = `# ${conversation.title}\n\n`;
    md += `> **Thread ID:** \`${conversation._id}\`  \n`;
    md += `> **Created:** ${new Date(conversation.createdAt).toLocaleString()}  \n`;
    md += `> **Updated:** ${new Date(conversation.updatedAt).toLocaleString()}  \n`;
    md += `> **Total Messages:** ${conversation.messages?.length || 0}  \n`;
    md += `> **Exported:** ${new Date().toLocaleString()}  \n\n`;
    md += `---\n\n`;

    if (conversation.messages && conversation.messages.length > 0) {
      conversation.messages.forEach((msg, index) => {
        const timeStr = new Date(msg.timestamp || conversation.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        if (msg.role === 'user') {
          md += `### 👤 User (${timeStr})\n\n`;
          md += `${msg.content}\n\n`;
        } else {
          const toneStr = msg.tone ? `Tone: ${msg.tone}` : 'Tone: Default';
          const latencyStr = msg.latencyMs != null ? `${(msg.latencyMs / 1000).toFixed(2)}s` : 'N/A';
          const wordsStr = msg.wordCount != null ? `${msg.wordCount} words` : 'N/A';

          md += `### 🤖 AI Assistant (${timeStr}) — *${toneStr} • ${latencyStr} • ${wordsStr}*\n\n`;
          md += `${msg.content}\n\n`;
        }

        if (index < conversation.messages.length - 1) {
          md += `---\n\n`;
        }
      });
    } else {
      md += `*No messages in this conversation.*\n`;
    }

    // Sanitize title for filename
    const safeTitle = conversation.title
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .substring(0, 30);
    const filename = `chat_${safeTitle || 'conversation'}_${conversation._id.toString().substring(0, 6)}.md`;

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(md);
  } catch (error) {
    console.error('[exportConversation] Error:', error);
    res.status(500).json({ error: 'Failed to export conversation.' });
  }
}

