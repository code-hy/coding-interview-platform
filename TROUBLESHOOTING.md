# Troubleshooting Guide

## Common Issues and Solutions

### EADDRINUSE: Port 5000 Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Cause:**
A Node.js process is already running on port 5000, preventing the server from starting.

**Solutions:**

#### Option 1: Kill All Node Processes (Quick Fix)
```powershell
# Windows PowerShell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

```bash
# Linux/Mac
pkill node
# or
killall node
```

#### Option 2: Find and Kill Specific Process
```powershell
# Windows PowerShell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill specific process by PID
taskkill /PID <PID> /F
```

```bash
# Linux/Mac
# Find process using port 5000
lsof -i :5000

# Kill specific process
kill -9 <PID>
```

#### Option 3: Change the Port
Edit your `.env` file:
```env
PORT=5001
```

**Prevention:**
- Always stop the dev server (`Ctrl+C`) before closing the terminal
- Use `npm run dev` instead of running multiple instances
- Check for running processes before starting: `Get-Process -Name node`

---

### Jest Tests Not Exiting / Async Operations Warning

**Error Message:**
```
Jest did not exit one second after the test run has completed.
This usually means that there are asynchronous operations that weren't stopped in your tests.
```

**Cause:**
- Database connections not closed
- Timers (setTimeout/setInterval) still running
- Socket connections not properly cleaned up

**Solutions:**

1. **Ensure proper cleanup in `afterAll`:**
```javascript
afterAll(async () => {
  // Close socket connections
  if (clientSocket?.connected) {
    clientSocket.disconnect();
  }
  
  // Close Socket.IO server
  if (io) {
    io.close();
  }
  
  // Close HTTP server
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
  
  // Close database connection
  await mongoose.connection.close();
});
```

2. **Clear all timers:**
```javascript
afterEach(() => {
  jest.clearAllTimers();
});
```

3. **Run with detection:**
```bash
npm run test -- --detectOpenHandles
```

---

### Mongoose Schema Errors

**Error Message:**
```
MongooseDocumentArray is not a constructor
```

**Cause:**
Incorrect usage of `$push` with `$each` and `$slice` modifiers in Mongoose updates.

**Solution:**
Use the find-modify-save pattern instead:
```javascript
// ❌ Don't do this
await Session.findOneAndUpdate(
  { sessionId: roomId },
  {
    $push: {
      codeHistory: {
        $each: [{ timestamp: new Date(), code: code }],
        $slice: -50
      }
    }
  }
);

// ✅ Do this instead
const session = await Session.findOne({ sessionId: roomId });
if (session) {
  session.codeHistory.push({ timestamp: new Date(), code: code });
  if (session.codeHistory.length > 50) {
    session.codeHistory = session.codeHistory.slice(-50);
  }
  await session.save();
}
```

---

### MongoDB Connection Issues

**Error Message:**
```
MongooseError: Operation `sessions.findOne()` buffering timed out
```

**Cause:**
- Invalid `MONGODB_URI` in `.env`
- Network connectivity issues
- MongoDB Atlas IP whitelist restrictions

**Solutions:**

1. **Verify `.env` configuration:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
```

2. **Check MongoDB Atlas:**
   - Ensure your IP is whitelisted (or use `0.0.0.0/0` for development)
   - Verify database user credentials
   - Check cluster is running

3. **Test connection:**
```javascript
import mongoose from 'mongoose';
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected'))
  .catch(err => console.error('❌ Error:', err));
```

---

### Environment Variables Not Loading

**Symptom:**
`process.env.MONGODB_URI` is `undefined`

**Cause:**
- `.env` file not in the correct location
- `dotenv` not configured correctly for subdirectory execution

**Solution:**
Ensure `dotenv` loads from the project root:
```javascript
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (two levels up from backend/src)
dotenv.config({ path: path.join(__dirname, '../../.env') });
```

---

## Quick Reference Commands

### Development
```bash
# Start dev server
npm run dev

# Stop all Node processes (if port conflict)
Get-Process -Name node | Stop-Process -Force

# Check running Node processes
Get-Process -Name node
```

### Testing
```bash
# Run tests
npm run test

# Run tests with open handle detection
npm run test -- --detectOpenHandles

# Run specific test file
npm run test -- integration.test.js
```

### Database
```bash
# Check MongoDB connection
# Add this temporarily to server.js:
mongoose.connection.on('connected', () => console.log('✅ DB Connected'));
mongoose.connection.on('error', (err) => console.log('❌ DB Error:', err));
```
