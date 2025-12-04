import { rooms } from './server.js';
import Session from './models/Session.js';

// Debounce helper to avoid too many DB writes
const debounceTimers = new Map();

function debounce(key, fn, delay = 2000) {
  if (debounceTimers.has(key)) {
    clearTimeout(debounceTimers.get(key));
  }

  const timer = setTimeout(() => {
    fn();
    debounceTimers.delete(key);
  }, delay);

  debounceTimers.set(key, timer);
}

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', async (roomId, userName) => {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }

      socket.join(roomId);
      room.users.add(socket.id);

      // Update participants in database
      try {
        await Session.findOneAndUpdate(
          { sessionId: roomId },
          {
            $addToSet: { participants: socket.id },
            isActive: true
          }
        );
      } catch (error) {
        console.warn('Failed to update session participants:', error.message);
      }

      // Send current state to new user
      socket.emit('room-state', {
        language: room.language,
        code: room.code,
        userCount: room.users.size
      });

      // Notify others
      socket.to(roomId).emit('user-joined', {
        userName,
        userCount: room.users.size
      });

      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('code-change', (roomId, code) => {
      const room = rooms.get(roomId);
      if (room) {
        room.code = code;
        socket.to(roomId).emit('code-update', code);

        // Debounced database update to avoid too many writes
        debounce(`code-${roomId}`, async () => {
          try {
            const session = await Session.findOne({ sessionId: roomId });
            if (session) {
              session.code = code;
              session.codeHistory.push({
                timestamp: new Date(),
                code: code
              });
              // Keep only last 50 entries
              if (session.codeHistory.length > 50) {
                session.codeHistory = session.codeHistory.slice(-50);
              }
              await session.save();
            }
          } catch (error) {
            console.warn('Failed to save code to database:', error.message);
          }
        });
      }
    });

    socket.on('language-change', async (roomId, language) => {
      const room = rooms.get(roomId);
      if (room) {
        room.language = language;
        io.to(roomId).emit('language-update', language);

        // Update language in database
        try {
          await Session.findOneAndUpdate(
            { sessionId: roomId },
            { language: language }
          );
        } catch (error) {
          console.warn('Failed to update language in database:', error.message);
        }
      }
    });

    socket.on('disconnect', async () => {
      rooms.forEach(async (room, roomId) => {
        if (room.users.has(socket.id)) {
          room.users.delete(socket.id);
          socket.to(roomId).emit('user-left', {
            userCount: room.users.size
          });

          // If room is now empty, mark session as ended
          if (room.users.size === 0) {
            try {
              const session = await Session.findOne({ sessionId: roomId });
              if (session) {
                await session.endSession();
                console.log(`Session ${roomId} marked as ended`);
              }
              // Remove from memory after a delay to allow reconnections
              setTimeout(() => {
                if (rooms.has(roomId) && rooms.get(roomId).users.size === 0) {
                  rooms.delete(roomId);
                  console.log(`Room ${roomId} removed from memory`);
                }
              }, 60000); // 1 minute grace period
            } catch (error) {
              console.warn('Failed to end session in database:', error.message);
            }
          }
        }
      });
      console.log('User disconnected:', socket.id);
    });
  });
}