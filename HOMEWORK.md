# Homework Submission - Coding Interview Platform

## Project Overview

This is a real-time collaborative coding interview platform that supports multiple programming languages with live code execution.

**Repository:** [Your GitHub URL here]

---

## Question 1: Initial Implementation

**Initial Prompt:**

```
Create a real-time collaborative coding interview platform with the following features:

Frontend (React + Vite):
- Home page with form to create interview session (candidate name, language selection)
- Interview page with Monaco code editor
- Real-time code synchronization between users
- Support for JavaScript and Python syntax highlighting
- Code execution panel

Backend (Node.js + Express):
- REST API to create interview sessions
- Socket.IO for real-time collaboration
- In-memory storage for active sessions
- Support for multiple users in same room

Requirements:
- Use Socket.IO for WebSocket communication
- Use Monaco Editor for code editing
- Generate unique room IDs
- Broadcast code changes to all connected users
- Show participant count
```

**Alternative 3-Step Approach:**
1. First prompt: "Create React + Vite frontend with Monaco editor and Socket.IO client"
2. Second prompt: "Create OpenAPI specification for interview session API"
3. Third prompt: "Implement Express backend with Socket.IO server based on the spec"

---

## Question 2: Integration Tests

**Test Command:**
```bash
npm run test
```

**Test Configuration:**
- Framework: Jest
- Test file: `tests/integration.test.js`
- Features tested:
  - REST API endpoints (POST /api/interviews, GET /api/interviews/:id)
  - WebSocket events (join-room, code-change, language-change)
  - Real-time broadcasting
  - User connection/disconnection

**README.md:** ✅ Created (see `detailed_documentation.md`)

---

## Question 3: Running Both Client and Server

**Command in `package.json`:**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev --workspace=backend\" \"npm run dev --workspace=frontend\""
  }
}
```

**Usage:**
```bash
npm run dev
```

This starts:
- Backend server on `http://localhost:5000`
- Frontend dev server on `http://localhost:5173`

---

## Question 4: Syntax Highlighting

**Library Used:** `@monaco-editor/react`

**Reason:** Monaco Editor is the same editor that powers VS Code, providing:
- Professional syntax highlighting
- IntelliSense support
- Multiple language support (JavaScript, Python, Java, C++, Go)
- Customizable themes
- Built-in code formatting

**Implementation:**
```jsx
import Editor from '@monaco-editor/react';

<Editor
  height="70%"
  language={language}
  value={code}
  onChange={handleCodeChange}
  theme="vs-dark"
/>
```

---

## Question 5: Code Execution

**Library Used:** `Pyodide`

**Details:**
- **Pyodide** is a WebAssembly (WASM) port of CPython
- Runs Python entirely in the browser
- No server-side execution needed (security benefit)
- Loaded from CDN: `https://cdn.jsdelivr.net/pyodide/v0.25.0/full/`

**Implementation:**
```javascript
// Load Pyodide from CDN
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';

// Execute Python code
const pyodide = await window.loadPyodide();
await pyodide.runPythonAsync(code);
```

**JavaScript Execution:**
- Uses native `eval()` with console output capture
- Runs directly in browser (no WASM needed)

**Additional Languages (Java, C++, Go):**
- Backend execution using `child_process`
- Compilers installed in Docker container
- 5-second timeout for security

---

## Question 6: Containerization

**Base Image:** `node:20-alpine`

**Dockerfile Location:** `./Dockerfile`

**Key Features:**
```dockerfile
FROM node:20-alpine AS base

# Install compilers
RUN apk add --no-cache python3 py3-pip openjdk17 build-base go curl

# Install dependencies
RUN npm ci

# Build frontend
RUN npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
```

**Why Alpine?**
- Smaller image size (~150MB vs ~1GB for standard Node)
- Faster builds and deployments
- Security-focused minimal base

**Build Command:**
```bash
docker build -t coding-interview-platform .
```

**Run Command:**
```bash
docker-compose up --build
```

---

## Question 7: Deployment

**Service Used:** Render.com (Recommended)

**Alternative Options:**
- Railway.app
- Heroku
- AWS ECS
- Google Cloud Run
- Azure Container Instances

**Deployment Steps (Render):**
1. Connect GitHub repository
2. Create new Web Service
3. Render auto-detects Dockerfile
4. Add environment variables:
   - `MONGODB_URI`
   - `FRONTEND_URL`
   - `PORT`
5. Click "Deploy"

**Live URL:** [Your deployed URL here]

---

## Project Structure

```
coding-interview-platform/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express server + Socket.IO
│   │   ├── socket.js          # WebSocket handlers
│   │   ├── execute.js         # Code execution service
│   │   ├── db.js              # MongoDB connection
│   │   └── models/
│   │       └── Session.js     # Mongoose schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx       # Create interview
│   │   │   └── interview.jsx  # Coding session
│   │   └── components/
│   │       └── CodeExecutor.jsx
│   └── package.json
├── tests/
│   ├── integration.test.js    # Integration tests
│   └── jest.config.js
├── Dockerfile                  # Container definition
├── docker-compose.yml          # Docker orchestration
├── .env.example               # Environment template
├── detailed_documentation.md   # Complete documentation
├── DOCKER.md                  # Docker guide
├── TROUBLESHOOTING.md         # Common issues
└── package.json               # Root workspace config
```

---

## Technologies Used

### Frontend
- React 18
- Vite 7
- Monaco Editor
- Socket.IO Client
- TailwindCSS
- React Router

### Backend
- Node.js 20
- Express 4
- Socket.IO 4
- Mongoose 9
- MongoDB Atlas

### Code Execution
- Pyodide (Python WASM)
- Native eval (JavaScript)
- child_process (Java, C++, Go)

### Testing
- Jest 29
- Supertest
- Socket.IO Client (for WebSocket tests)

### DevOps
- Docker
- Docker Compose
- Concurrently
- Nodemon

---

## Key Features Implemented

✅ Real-time collaboration via WebSocket  
✅ Multi-language support (5 languages)  
✅ Syntax highlighting (Monaco Editor)  
✅ Code execution (client-side + server-side)  
✅ Persistent storage (MongoDB)  
✅ Integration tests  
✅ Docker containerization  
✅ Production-ready deployment  
✅ Comprehensive documentation  
✅ Error handling and troubleshooting guides  

---

## Additional Enhancements

Beyond the homework requirements, we also implemented:

1. **MongoDB Persistence**
   - Session history
   - Code change tracking
   - Participant logging

2. **Multi-Language Backend Execution**
   - Java (OpenJDK 17)
   - C++ (GCC/G++)
   - Go compiler

3. **Production Features**
   - Health checks
   - Graceful shutdown
   - Environment variable management
   - CORS configuration

4. **Developer Experience**
   - Hot reload (Vite + Nodemon)
   - Comprehensive error messages
   - Troubleshooting guide
   - Docker development workflow

---

## Running the Application

### Development
```bash
npm install
npm run dev
```

### Testing
```bash
npm run test
```

### Production (Docker)
```bash
docker-compose up --build
```

### Build Frontend
```bash
npm run build
```

---

## Environment Variables

Required in `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
FRONTEND_URL=http://localhost:5173
PORT=5000
```

---

## Git Commits

All development steps were committed with descriptive messages:
- Initial project setup
- Frontend implementation
- Backend implementation
- Socket.IO integration
- MongoDB integration
- Multi-language support
- Docker configuration
- Documentation

---

## Documentation Files

- `detailed_documentation.md` - Complete technical documentation
- `DOCKER.md` - Docker deployment guide
- `TROUBLESHOOTING.md` - Common issues and solutions
- `README.md` - Quick start guide
- `.env.example` - Environment variable template

---

## Homework Submission Checklist

- [x] Question 1: Initial prompt documented
- [x] Question 2: Test command provided
- [x] Question 3: npm dev command shown
- [x] Question 4: Monaco Editor identified
- [x] Question 5: Pyodide library documented
- [x] Question 6: Base image specified (node:20-alpine)
- [x] Question 7: Deployment service chosen (Render)
- [x] Code committed to GitHub
- [x] All features working
- [x] Documentation complete

---

## GitHub Repository

**URL:** [Insert your GitHub repository URL here]

**Folder:** `02-coding-interview/` (or root of repository)

**Branch:** `main`

---

## Notes

This implementation goes beyond the basic requirements by including:
- Production-grade architecture
- Comprehensive testing
- Full Docker support
- Multi-language execution
- Database persistence
- Professional documentation

The application is fully functional and ready for deployment to any cloud platform.
