import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import CodeExecutor from '../components/CodeExecutor';

function Interview() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef();
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [userCount, setUserCount] = useState(1);
  const [candidateName, setCandidateName] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Get backend URL from environment variable with fallback
  // In production (Docker), frontend and backend are on same origin
  // We use import.meta.env.PROD to detect production build
  const API_URL = import.meta.env.PROD
    ? window.location.origin
    : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');

  useEffect(() => {
    // Initialize socket with environment variable
    socketRef.current = io(API_URL);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current.emit('join-room', roomId, 'Interviewer');
    });

    socketRef.current.on('room-state', (state) => {
      setLanguage(state.language);
      setCode(state.code);
      setUserCount(state.userCount);
    });

    socketRef.current.on('code-update', (newCode) => {
      setCode(newCode);
    });

    socketRef.current.on('language-update', (newLanguage) => {
      setLanguage(newLanguage);
    });

    socketRef.current.on('user-joined', (data) => {
      setUserCount(data.userCount);
    });

    socketRef.current.on('user-left', (data) => {
      setUserCount(data.userCount);
    });

    socketRef.current.on('error', (error) => {
      alert(error);
      navigate('/');
    });

    // Fetch initial room data using environment variable
    fetch(`${API_URL}/api/interviews/${roomId}`)
      .then(res => res.json())
      .then(data => {
        setCandidateName(data.candidateName);
        setLanguage(data.language);
        setCode(data.code);
      })
      .catch(() => navigate('/'));

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId, navigate, API_URL]);

  const handleCodeChange = (value) => {
    setCode(value);
    socketRef.current.emit('code-change', roomId, value);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    socketRef.current.emit('language-change', roomId, newLanguage);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              Interview: {candidateName || 'Loading...'}
            </h1>
            <p className="text-sm text-gray-600">
              Room ID: {roomId} | Users: {userCount}
            </p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Copy Link
          </button>
        </div>
      </header>

      {/* Language Selector */}
      <div className="bg-gray-100 px-6 py-2">
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="go">Go</option>
        </select>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Code Editor Container */}
        <div className="flex-1 flex flex-col">
          <Editor
            height="70%"
            language={language}
            value={code}
            onChange={handleCodeChange}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />

          {/* Code Executor */}
          <div className="h-30 border-t border-gray-200">
            <CodeExecutor language={language} code={code} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Interview;