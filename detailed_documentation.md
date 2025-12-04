# Coding Interview Platform - Detailed Documentation

## 1. Project Overview

The **Coding Interview Platform** is a real-time collaborative environment designed for technical interviews. It allows interviewers and candidates to write, execute, and debug code together in real-time, supporting multiple programming languages.

### Key Features
- **Real-time Collaboration**: Code changes are synced instantly between all participants.
- **Live Code Execution**: Execute code in 5 languages - JavaScript, Python, Java, C++, and Go.
- **Persistent Storage**: Interview sessions and code history are saved to MongoDB.
- **Multi-language Support**: Client-side execution for JS/Python, backend execution for Java/C++/Go.
- **Session Management**: Create, join, and review past interview sessions.
- **Docker Support**: Production-ready containerization with all compilers included.

---

## 2. Architecture

The application follows a modern client-server architecture with real-time bidirectional communication.

```mermaid
graph TD
    Client[Frontend (React + Vite)] <-->|WebSocket (Socket.IO)| Server[Backend (Node.js + Express)]
    Client <-->|REST API (HTTP)| Server
    Server <-->|Mongoose| DB[(MongoDB Atlas)]
    Client -->|Pyodide (WASM)| PythonExec[Python Execution]
    Client -->|Eval| JSExec[JavaScript Execution]
    Server -->|child_process| Compilers[Java/C++/Go Compilers]
```

### Components

1.  **Frontend (Client)**
    -   Built with **React** for a dynamic UI.
    -   Uses **Monaco Editor** (VS Code's editor) for a premium coding experience.
    -   Handles JavaScript and Python execution locally (client-side) for speed.
    -   Sends Java, C++, and Go code to backend for execution.
    -   Communicates with the backend via **Socket.IO** for real-time updates.

2.  **Backend (Server)**
    -   Built with **Node.js** and **Express**.
    -   Manages interview rooms and user connections.
    -   Uses **Socket.IO** to broadcast code changes and user events.
    -   Executes Java, C++, and Go code using `child_process`.
    -   Handles data persistence using **Mongoose**.

3.  **Database**
    -   **MongoDB Atlas** stores session metadata, code history, and participant details.
    -   Uses a **Hybrid Storage Strategy**: Active sessions are cached in-memory for low-latency performance, while data is asynchronously synced to MongoDB for persistence.

---

## 3. Technology Stack

### Frontend
| Technology | Purpose | Reason for Choice |
| :--- | :--- | :--- |
| **React** | UI Framework | Component-based, efficient state management, huge ecosystem. |
| **Vite** | Build Tool | Extremely fast development server and optimized builds. |
| **TailwindCSS** | Styling | Utility-first CSS for rapid, responsive UI development. |
| **Monaco Editor** | Code Editor | Provides a professional, IDE-like experience (syntax highlighting, intellisense). |
| **Socket.IO Client** | Real-time Comm | Robust WebSocket wrapper with auto-reconnection and fallback support. |
| **Pyodide** | Python Runtime | Runs Python in the browser via WebAssembly (WASM), avoiding server-side execution risks. |

### Backend
| Technology | Purpose | Reason for Choice |
| :--- | :--- | :--- |
| **Node.js** | Runtime | Non-blocking I/O is ideal for real-time applications. |
| **Express** | Web Framework | Minimalist, flexible, and easy to set up REST APIs. |
| **Socket.IO** | WebSocket Server | Simplifies room-based event broadcasting (e.g., `socket.to(roomId).emit(...)`). |
| **Mongoose** | ODM | Provides schema validation and easy interaction with MongoDB. |
| **child_process** | Code Execution | Spawns processes to compile and run Java, C++, and Go code. |

### Compilers (Docker)
| Technology | Purpose | Reason for Choice |
| :--- | :--- | :--- |
| **OpenJDK 17** | Java Compiler | Industry-standard Java runtime and compiler. |
| **GCC/G++** | C++ Compiler | Widely-used, standards-compliant C++ compiler. |
| **Go** | Go Compiler | Official Go toolchain for compilation and execution. |

### Database
| Technology | Purpose | Reason for Choice |
| :--- | :--- | :--- |
| **MongoDB Atlas** | Database | NoSQL document model fits the flexible nature of interview sessions (code, history, metadata). Cloud-hosted for easy access. |

---

## 4. Implementation Details

### Real-time Collaboration
-   **Event-Driven**: When a user types, a `code-change` event is emitted to the server.
-   **Broadcasting**: The server receives the event and broadcasts it to all *other* users in the same room (`socket.to(roomId).emit('code-update', code)`).
-   **Debouncing**: Database writes for code changes are debounced (delayed by 2 seconds) to prevent overwhelming the database with every keystroke.

### Code Execution
-   **Hybrid Execution Model**:
    -   **Client-Side (JavaScript & Python)**:
        -   **JavaScript**: Executed using `eval()` with console output capture.
        -   **Python**: Executed using **Pyodide**, a WebAssembly port of CPython.
        -   **Benefit**: Instant execution, no server load.
    -   **Server-Side (Java, C++, Go)**:
        -   Code is sent to `/api/execute` endpoint.
        -   Backend writes code to temporary file, compiles (if needed), and executes.
        -   Uses `child_process` with 5-second timeout.
        -   Temporary files are cleaned up after execution.
        -   **Benefit**: Full compiler support without client-side limitations.
-   **Security**: Client-side execution protects the server. Server-side execution uses timeouts and file cleanup to prevent abuse.

### Data Persistence
-   **Hybrid Approach**:
    1.  **Active Sessions**: Stored in a server-side `Map` for instant access.
    2.  **Persistent Storage**: All sessions are saved to MongoDB.
    3.  **Syncing**: When a session ends (all users leave), the final state is flushed to the database, and the in-memory entry is cleared after a grace period.

---

## 5. Setup & Installation

### Prerequisites
-   **Node.js** (v16 or higher)
-   **npm** (Node Package Manager)
-   **MongoDB Atlas Account** (Free tier is sufficient)
-   **For Local Development** (optional, for Java/C++/Go execution):
    -   Java JDK 17+
    -   GCC/G++ compiler
    -   Go 1.20+
-   **For Docker Deployment**:
    -   Docker Desktop (Windows/Mac) or Docker Engine (Linux)

### Installation Steps

1.  **Clone the repository** (if applicable) or navigate to the project root.

2.  **Install Dependencies**:
    ```bash
    npm install
    ```
    This installs dependencies for both the root, frontend, and backend workspaces.

3.  **Environment Configuration**:
    -   Create a `.env` file in the **root directory**.
    -   Add your MongoDB connection string:
        ```env
        MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
        FRONTEND_URL=http://localhost:5173
        PORT=5000
        ```

---

## 6. How to Run

### Development Mode (Local)

1.  **Start Development Server**:
    ```bash
    npm run dev
    ```
    This will concurrently start:
    -   **Backend Server**: http://localhost:5000
    -   **Frontend App**: http://localhost:5173

2.  **Access the Application**:
    Open your browser and navigate to `http://localhost:5173`.

### Production Mode (Docker)

1.  **Build and Run with Docker Compose**:
    ```bash
    docker-compose up --build
    ```

2.  **Access the Application**:
    Open your browser and navigate to `http://localhost:5000`.

3.  **Stop the Container**:
    ```bash
    docker-compose down
    ```

**For detailed Docker instructions, see [DOCKER.md](DOCKER.md)**

---

## 7. Usage Guide

### Starting an Interview
1.  On the homepage, enter the **Candidate Name**.
2.  Select the **Language** (JavaScript, Python, Java, C++, or Go).
3.  Click **"Start Interview"**.
4.  You will be redirected to a unique room URL (e.g., `/interview/abc-123`).

### Inviting Participants
1.  Copy the URL from your browser's address bar.
2.  Share it with the candidate or interviewer.
3.  When they join, you will see a notification, and the "Participants" count will update.

### Writing & Running Code
1.  Type code in the editor. Changes are synced instantly.
2.  Click the **"Run Code"** button (top right of the editor).
3.  The output will appear in the console panel below the editor.
    -   **Python**: First run may take a few seconds to load the Pyodide runtime.
    -   **Java**: Code is wrapped in a `Main` class automatically if not provided.
    -   **C++/Go**: Standard compilation and execution.
    -   **Note**: Java/C++/Go require backend compilers (installed via Docker or locally).

### Reviewing Past Sessions
1.  (API Feature) You can retrieve past sessions via the backend API:
    -   `GET /api/sessions`: List recent sessions.
    -   `GET /api/sessions/:id/details`: Get full code history for a specific session.

---

## 8. Deployment

### Quick Deploy Options

1.  **Render.com** (Recommended)
    - Connect GitHub repository
    - Render auto-detects Dockerfile
    - Add `MONGODB_URI` environment variable
    - Deploy!

2.  **Railway.app**
    - One-click deploy from GitHub
    - Auto-detects Dockerfile
    - Add environment variables

3.  **Docker on Any Platform**
    - Build: `docker build -t interview-platform .`
    - Run: `docker run -p 5000:5000 -e MONGODB_URI="..." interview-platform`

**For complete deployment guide, see [DOCKER.md](DOCKER.md)**

---

## 9. Troubleshooting

For common issues and solutions, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md):
- EADDRINUSE (Port conflicts)
- Jest async operations
- Mongoose errors
- MongoDB connection issues
- Environment variable problems
