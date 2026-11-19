import mongoose from 'mongoose';
import { isConnectedToMongo } from '../config/db.js';

// --- Mongoose Schema Definition ---
const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    tone: {
      type: String,
      enum: ['Professional', 'Casual', 'Concise', null],
      default: null,
    },
    latencyMs: {
      type: Number,
      default: null,
    },
    wordCount: {
      type: Number,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const ConversationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'New Conversation',
    },
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ title: 'text', 'messages.content': 'text' });
ConversationSchema.index({ updatedAt: -1 });

const MongooseConversationModel = mongoose.model('Conversation', ConversationSchema);

// --- In-Memory Fallback Store (Used when local MongoDB is not running) ---
const inMemoryStore = new Map();

class InMemoryConversationDoc {
  constructor(data = {}) {
    this._id = data._id ? data._id.toString() : new mongoose.Types.ObjectId().toString();
    this.title = data.title || 'New Conversation';
    this.messages = (data.messages || []).map(m => ({
      _id: m._id ? m._id.toString() : new mongoose.Types.ObjectId().toString(),
      role: m.role,
      content: m.content,
      tone: m.tone || null,
      latencyMs: m.latencyMs ?? null,
      wordCount: m.wordCount ?? null,
      timestamp: m.timestamp || new Date(),
    }));
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    inMemoryStore.set(this._id.toString(), {
      _id: this._id,
      title: this.title,
      messages: [...this.messages],
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
    return this;
  }

  toObject() {
    return {
      _id: this._id,
      title: this.title,
      messages: this.messages,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  lean() {
    return Promise.resolve(this.toObject());
  }
}

class InMemorySingleQuery {
  constructor(doc) {
    this._doc = doc;
  }

  async lean() {
    return this._doc ? this._doc.toObject() : null;
  }

  then(resolve, reject) {
    return Promise.resolve(this._doc).then(resolve, reject);
  }
}

class InMemoryQuery {
  constructor(results) {
    this._results = results;
  }

  sort(sortCriteria) {
    if (sortCriteria && sortCriteria.updatedAt === -1) {
      this._results.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    return this;
  }

  select() {
    return this;
  }

  async lean() {
    return this._results.map(doc => ({
      _id: doc._id,
      title: doc.title,
      messages: doc.messages,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }

  then(resolve, reject) {
    return Promise.resolve(this._results).then(resolve, reject);
  }
}

// Unified class supporting both `new Conversation(...)` and static methods
export class Conversation {
  constructor(data) {
    if (isConnectedToMongo) {
      return new MongooseConversationModel(data);
    }
    return new InMemoryConversationDoc(data);
  }

  static findById(id) {
    if (!id) return new InMemorySingleQuery(null);
    if (isConnectedToMongo) {
      return MongooseConversationModel.findById(id);
    }
    const found = inMemoryStore.get(id.toString());
    const doc = found ? new InMemoryConversationDoc(found) : null;
    return new InMemorySingleQuery(doc);
  }

  static find(filter = {}) {
    if (isConnectedToMongo) {
      return MongooseConversationModel.find(filter);
    }

    let items = Array.from(inMemoryStore.values());

    if (filter.$or) {
      items = items.filter(doc => {
        return filter.$or.some(cond => {
          if (cond.title && cond.title instanceof RegExp) {
            if (cond.title.test(doc.title)) return true;
          }
          if (cond['messages.content'] && cond['messages.content'] instanceof RegExp) {
            return doc.messages.some(m => cond['messages.content'].test(m.content));
          }
          return false;
        });
      });
    }

    return new InMemoryQuery(items);
  }

  static async findByIdAndDelete(id) {
    if (!id) return null;
    if (isConnectedToMongo) {
      return MongooseConversationModel.findByIdAndDelete(id);
    }
    const idStr = id.toString();
    const exists = inMemoryStore.get(idStr);
    if (!exists) return null;
    inMemoryStore.delete(idStr);
    return exists;
  }
}

export default Conversation;
