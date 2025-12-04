import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupSocketHandlers } from './socket.js';
import dotenv from 'dotenv';
import connectDB from './db.js';
import Session from './models/Session.js';
import { executeCode } from './execute.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Connect to MongoDB
connectDB();

const app = express();
const server = createServer(app);

// Middleware
// CORS configuration: allow same origin in production, specific origins in dev
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    // In production, allow same origin
    if (process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }

    // In development, allow specific origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5001',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from frontend build (production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
}

// In-memory storage for active sessions
export const rooms = new Map();

// REST API Routes

// Execute code (Java, C++, Go)
app.post('/api/execute', async (req, res) => {
  const { language, code } = req.body;

  if (!code) {
    return res.status(400).json({ output: 'Error: No code provided' });
  }

  try {
    const output = await executeCode(language, code);
    res.json({ output });
  } catch (error) {
    console.error('Execution error:', error);
    res.status(500).json({ output: `Server Error: ${error.message}` });
  }
});

// Create new interview session
app.post('/api/interviews', async (req, res) => {
  try {
    const { candidateName, language } = req.body;
    const id = Math.random().toString(36).substr(2, 9);

    const room = {
      id,
      candidateName,
      language: language || 'javascript',
      code: '',
      users: new Set(),
      createdAt: new Date()
    };

    // Store in memory for active session
    rooms.set(id, room);

    // Save to database
    try {
      await Session.create({
        sessionId: id,
        candidateName,
        language: language || 'javascript',
        code: '',
        participants: [],
        isActive: true
      });
    } catch (dbError) {
      console.warn('Failed to save session to database:', dbError.message);
      // Continue without database - session still works in memory
    }

    res.json({
      id,
      url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/interview/${id}`
    });
  } catch (error) {
    console.error('Error creating interview:', error);
    res.status(500).json({ error: 'Failed to create interview session' });
  }
});

// Get active interview session
app.get('/api/interviews/:id', async (req, res) => {
  try {
    const room = rooms.get(req.params.id);

    // If in memory, return active session
    if (room) {
      return res.json({
        id: room.id,
        candidateName: room.candidateName,
        language: room.language,
        code: room.code,
        userCount: room.users.size,
        isActive: true
      });
    }

    // Otherwise, try to get from database
    try {
      const session = await Session.findOne({ sessionId: req.params.id });
      if (session) {
        return res.json({
          id: session.sessionId,
          candidateName: session.candidateName,
          language: session.language,
          code: session.code,
          userCount: 0,
          isActive: session.isActive,
          createdAt: session.createdAt,
          endedAt: session.endedAt
        });
      }
    } catch (dbError) {
      console.warn('Database query failed:', dbError.message);
    }

    return res.status(404).json({ error: 'Room not found' });
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ error: 'Failed to fetch interview session' });
  }
});

// Get all past sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const sessions = await Session.getRecentSessions(limit);

    res.json({
      sessions: sessions.map(s => ({
        id: s.sessionId,
        candidateName: s.candidateName,
        language: s.language,
        isActive: s.isActive,
        createdAt: s.createdAt,
        endedAt: s.endedAt,
        participantCount: s.participants.length
      }))
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get session details including code history
app.get('/api/sessions/:id/details', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      id: session.sessionId,
      candidateName: session.candidateName,
      language: session.language,
      code: session.code,
      isActive: session.isActive,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      endedAt: session.endedAt,
      participants: session.participants,
      codeHistory: session.codeHistory
    });
  } catch (error) {
    console.error('Error fetching session details:', error);
    res.status(500).json({ error: 'Failed to fetch session details' });
  }
});

// Delete a session
app.delete('/api/sessions/:id', async (req, res) => {
  try {
    const session = await Session.findOneAndDelete({ sessionId: req.params.id });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend for all non-API routes (SPA routing)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

// Socket.io setup
const io = new Server(server, {
  cors: corsOptions
});

setupSocketHandlers(io);

// START SERVER (only declare PORT once!)
// Don't start server if we're in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export { server, app, io };