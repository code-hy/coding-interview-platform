import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [candidateName, setCandidateName] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState('Checking...');
  const navigate = useNavigate();

  // Get backend URL from environment variable with fallback
  // In production (Docker), frontend and backend are on same origin
  // We use import.meta.env.PROD to detect production build
  const API_URL = import.meta.env.PROD
    ? window.location.origin
    : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');

  useEffect(() => {
    // Check backend health on mount
    fetch(`${API_URL}/api/health`)
      .then(res => res.json())
      .then(data => setHealthStatus(`Connected: ${data.status}`))
      .catch(err => setHealthStatus(`Error: ${err.message}`));
  }, [API_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Creating interview with API URL:', API_URL);
      const response = await fetch(`${API_URL}/api/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateName, language })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Interview created:', data);
      navigate(`/interview/${data.id}`);
    } catch (error) {
      console.error('Failed to create interview:', error);
      alert(`Failed to create interview: ${error.message}. Check console for details.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">
        Coding Interview Platform
      </h1>

      {/* Debug Info */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-xs font-mono border border-gray-300">
        <p><strong>Debug Info:</strong></p>
        <p>API URL: {API_URL}</p>
        <p>Backend Status: {healthStatus}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Candidate Name
          </label>
          <input
            type="text"
            required
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter candidate name"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Programming Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="go">Go</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Creating...' : 'Create Interview'}
        </button>
      </form>
    </div>
  );
}

export default Home;