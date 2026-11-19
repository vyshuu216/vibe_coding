# AI Chat Assistant (Production MERN Stack)

A production-ready full-stack AI Chat Assistant application built with a clean, decoupled **MERN** architecture (**Express + Node.js + MongoDB/Mongoose** backend and **React + Vite + Tailwind CSS** frontend), featuring real-time **Server-Sent Events (SSE)** token streaming, a dynamic **Tone Toggle ("The Vibe Check")**, response **telemetry analytics**, and **server-side Markdown transcript export**.

---

## 🏗️ Architecture & Philosophy

```
├── server/
│   ├── config/          # MongoDB connection & fallback management
│   ├── models/          # Mongoose schemas (Conversation, Message, Telemetry)
│   ├── controllers/     # Chat streaming & Conversation CRUD business logic
│   ├── routes/          # Express API route declarations
│   ├── utils/           # Server-side Tone system prompts & Telemetry calculations
│   └── server.js        # Express app initialization, CORS, and middleware
├── client/
│   ├── src/
│   │   ├── components/  # Modular presentation components (Sidebar, Chat, Tone, Header)
│   │   ├── services/    # api.js (Fetch + ReadableStream + TextDecoder SSE consumer)
│   │   ├── App.jsx      # Root state orchestrator
│   │   ├── main.jsx     # React root entry point
│   │   └── index.css    # Tailwind base, dark-mode styling & animations
│   ├── index.html       # HTML entry with font preconnects
│   ├── tailwind.config.js
│   └── vite.config.js
├── .gitignore
├── package.json         # Workspace convenience runners
└── README.md
```

### Strict Architectural Boundaries
1. **Business Logic strictly on Backend (`server/`)**:
   - The frontend never touches OpenAI credentials or constructs system instructions.
   - Tone validation, system instruction injection, latency timing (`latencyMs`), word counts (`wordCount`), MongoDB updates, and Markdown document generation are handled 100% on the server.
2. **Frontend Presentation Only (`client/`)**:
   - The client exclusively handles UI state, user interaction, message rendering, and streaming consumption via native `fetch` + `ReadableStream` + `TextDecoder`.

---

## ✨ Key Features

- **⚡ Real-Time SSE Token Streaming**:
  - Uses `openai` Node SDK with `stream: true`.
  - Streams tokens character-by-character over HTTP with `Content-Type: text/event-stream`.
  - Blinking typing cursor in the UI during transmission with an instant "Stop Generating" button.
- **🎭 The Vibe Check (Tone Toggle)**:
  - Header segmented control allowing switching between **Professional**, **Casual**, and **Concise** tones.
  - Tones are validated server-side in `server/utils/tones.js` and injected into the AI system instructions:
    - **Professional**: Executive, articulate, objective, structured reasoning.
    - **Casual**: Friendly, warm, conversational, relatable phrasing.
    - **Concise**: Ultra-direct, zero fluff, tight bullet points.
- **📊 Response Telemetry**:
  - The server automatically calculates response duration (`latencyMs`) and `wordCount` for each AI reply before persisting to MongoDB.
  - Telemetry is emitted in the final SSE `done` event and displayed beneath each AI bubble (e.g. `Casual • 1.2s • 54 words`).
- **📥 Server-Side Markdown Transcript Export**:
  - Dedicated endpoint `GET /api/conversations/:id/export` formats the conversation thread from MongoDB into a structured `.md` document with headers, timestamps, and tone metadata.
  - Sends with `Content-Disposition: attachment` to trigger a direct download via the "Export .md" button.
- **🔍 Server-Side Thread Search**:
  - Sidebar search input with debounced querying to `GET /api/conversations?q=...` searching thread titles and message bodies.
- **💾 Dual Persistence Modes**:
  - Connects to your live MongoDB / MongoDB Atlas instance via `MONGO_URI`.
  - Zero-config auto-fallback to an in-memory store if no local MongoDB instance is running, allowing instant evaluation out of the box.
- **✨ Built-in AI Simulation Fallback**:
  - If `OPENAI_API_KEY` is not yet configured, the server includes a tone-aware streaming generator so you can test streaming, telemetry, and UI interactions immediately.

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (Optional: Atlas or local MongoDB; auto-falls back to in-memory store if unavailable)

### 2. Installation

Clone or open the repository root:
```bash
# Install dependencies for both server and client
npm run install:all
```
*(Or navigate to `server` and `client` individually and run `npm install`)*

---

### 3. Environment Variables Configuration

#### Backend (`server/.env`)
Create `server/.env` (or copy from `server/.env.example`):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai-chat-assistant
OPENAI_API_KEY=your_openai_api_key_here
# Optional custom base URL (e.g. OpenRouter, Ollama, LocalAI)
OPENAI_BASE_URL=
OPENAI_MODEL=gpt-4o-mini
CLIENT_URL=http://localhost:5173
```

#### Frontend (`client/.env`)
Create `client/.env` (or copy from `client/.env.example`):
```env
VITE_API_URL=http://localhost:5000/api
```

---

### 4. Running the Application

You can run the server and client concurrently or in separate terminals:

#### Terminal 1 (Backend Server):
```bash
cd server
npm run dev
```
*Backend runs on `http://localhost:5000`*

#### Terminal 2 (Frontend Client):
```bash
cd client
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🔌 API Reference Documentation

### 1. Real-Time Chat Stream
- **Endpoint**: `POST /api/chat/stream`
- **Headers**: `Content-Type: application/json`, `Accept: text/event-stream`
- **Request Body**:
  ```json
  {
    "conversationId": "6afe819426254251b5bddec3", // Optional: omits for new thread
    "message": "Explain microservices architecture",
    "tone": "Concise" // "Professional" | "Casual" | "Concise"
  }
  ```
- **SSE Stream Events**:
  - In-flight text chunk:
    ```
    data: {"chunk": "Microservices"}
    ```
  - Final completion event:
    ```
    data: {
      "done": true,
      "conversationId": "6afe819426254251b5bddec3",
      "title": "Explain microservices architecture",
      "tone": "Concise",
      "latencyMs": 840,
      "wordCount": 78,
      "assistantMessage": { ... }
    }
    ```

### 2. Conversation History & Search
- **Endpoint**: `GET /api/conversations?q=keyword`
- **Query Parameters**:
  - `q` (optional): Filter threads by keyword matching title or messages content.
- **Response**: Array of conversation previews sorted by `updatedAt: -1`.
  ```json
  [
    {
      "_id": "6afe819426254251b5bddec3",
      "title": "Explain microservices architecture",
      "createdAt": "2026-11-19T04:56:52.741Z",
      "updatedAt": "2026-11-19T04:56:55.366Z",
      "messageCount": 2,
      "lastMessageSnippet": "Microservices decompose an application into autonomous services..."
    }
  ]
  ```

### 3. Get Conversation Thread
- **Endpoint**: `GET /api/conversations/:id`
- **Response**: Complete conversation object with all messages, roles, timestamps, and telemetry metadata.

### 4. Delete Conversation
- **Endpoint**: `DELETE /api/conversations/:id`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Conversation deleted successfully."
  }
  ```

### 5. Server-Side Markdown Export
- **Endpoint**: `GET /api/conversations/:id/export`
- **Headers**:
  - `Content-Type: text/markdown; charset=utf-8`
  - `Content-Disposition: attachment; filename="chat_<title>_<id>.md"`
- **Response**: Formatted Markdown document containing conversation title, metadata headers, and styled transcripts for user and assistant messages with telemetry badges.

### 6. Health Check
- **Endpoint**: `GET /api/health`
- **Response**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-11-19T04:56:52.661Z",
    "uptime": 12.4,
    "environment": "development"
  }
  ```

---

## 🛡️ Production Build & Deployment

To build the frontend for production:
```bash
cd client
npm run build
```
The compiled, optimized production assets will be placed into `client/dist/`.
You can serve these static assets directly through Nginx, Express (`express.static`), or deploy to Vercel/Netlify.

