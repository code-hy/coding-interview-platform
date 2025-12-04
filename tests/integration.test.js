import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioc } from 'socket.io-client';
import { setupSocketHandlers } from '../backend/src/socket.js';
import { rooms } from '../backend/src/server.js';

describe('Coding Interview Platform Integration Tests', () => {
  let app, server, io, clientSocket;

  beforeAll((done) => {
    // Setup Express app with REST API routes
    app = express();
    app.use(cors());
    app.use(express.json());

    // REST API Routes (same as in server.js)
    app.post('/api/interviews', (req, res) => {
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

      rooms.set(id, room);

      res.json({
        id,
        url: `http://localhost:5001/interview/${id}`
      });
    });

    app.get('/api/interviews/:id', (req, res) => {
      const room = rooms.get(req.params.id);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.json({
        id: room.id,
        candidateName: room.candidateName,
        language: room.language,
        code: room.code,
        userCount: room.users.size
      });
    });

    // Setup server with Socket.IO
    const httpServer = createServer(app);
    io = new Server(httpServer, {
      cors: { origin: "http://localhost:5173" }
    });
    setupSocketHandlers(io);

    server = httpServer.listen(5001, () => {
      // Setup client
      clientSocket = ioc(`http://localhost:5001`);
      clientSocket.on('connect', done);
    });
  });

  afterAll((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    if (io) {
      io.close();
    }
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  beforeEach(() => {
    rooms.clear();
  });

  describe('REST API', () => {
    it('should create a new interview room', async () => {
      const response = await request(app)
        .post('/api/interviews')
        .send({ candidateName: 'John Doe', language: 'javascript' })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('url');
      expect(response.body.url).toContain('/interview/');
    });

    it('should return 404 for non-existent room', async () => {
      await request(app)
        .get('/api/interviews/nonexistent')
        .expect(404);
    });
  });

  describe('WebSocket Events', () => {
    it('should allow user to join a room', (done) => {
      // Create room first
      rooms.set('test-room', {
        id: 'test-room',
        candidateName: 'Test',
        language: 'javascript',
        code: '',
        users: new Set(),
        createdAt: new Date()
      });

      // Set up event listener BEFORE emitting
      clientSocket.once('room-state', (state) => {
        expect(state.language).toBe('javascript');
        expect(state.userCount).toBe(1);
        done();
      });

      clientSocket.emit('join-room', 'test-room', 'Test User');
    });

    it('should broadcast code changes to other users', (done) => {
      const roomId = 'test-room-code';
      rooms.set(roomId, {
        id: roomId,
        candidateName: 'Test',
        language: 'javascript',
        code: '',
        users: new Set(),
        createdAt: new Date()
      });

      // Create a second client to receive the broadcast
      const secondClient = ioc(`http://localhost:5001`);

      secondClient.on('connect', () => {
        // First client joins the room
        clientSocket.once('room-state', () => {
          // Second client joins the room
          secondClient.once('room-state', () => {
            // Second client listens for code update
            secondClient.once('code-update', (code) => {
              expect(code).toBe('console.log("hello");');
              secondClient.disconnect();
              done();
            });

            // First client sends code change
            clientSocket.emit('code-change', roomId, 'console.log("hello");');
          });

          secondClient.emit('join-room', roomId, 'User2');
        });

        clientSocket.emit('join-room', roomId, 'User1');
      });
    });

    it('should broadcast language changes', (done) => {
      const roomId = 'test-room-lang';
      rooms.set(roomId, {
        id: roomId,
        candidateName: 'Test',
        language: 'javascript',
        code: '',
        users: new Set(),
        createdAt: new Date()
      });

      // Set up event listener BEFORE joining
      clientSocket.once('room-state', () => {
        // After joining, listen for language update
        clientSocket.once('language-update', (language) => {
          expect(language).toBe('python');
          done();
        });

        // Send language change
        clientSocket.emit('language-change', roomId, 'python');
      });

      clientSocket.emit('join-room', roomId, 'User2');
    });
  });
});