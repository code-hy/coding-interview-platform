import { useState, useEffect, useRef } from 'react';

function CodeExecutor({ language, code }) {
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const pyodideRef = useRef(null);
  const [pyodideLoading, setPyodideLoading] = useState(false);

  // Get backend URL from environment variable with fallback
  // In production (Docker), frontend and backend are on same origin
  // We use import.meta.env.PROD to detect production build
  const API_URL = import.meta.env.PROD
    ? window.location.origin
    : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');

  useEffect(() => {
    // Initialize Pyodide for Python execution from CDN
    if (language === 'python' && !pyodideRef.current && !pyodideLoading) {
      setPyodideLoading(true);

      // Check if Pyodide script is already loaded
      if (window.loadPyodide) {
        window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
        }).then(pyodide => {
          pyodideRef.current = pyodide;
          setPyodideLoading(false);
        });
      } else {
        // Load Pyodide script from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
        script.async = true;

        script.onload = async () => {
          const pyodide = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
          });
          pyodideRef.current = pyodide;
          setPyodideLoading(false);
        };

        document.head.appendChild(script);
      }
    }
  }, [language, pyodideLoading]);

  const runJavaScript = () => {
    try {
      // Capture console.log output
      const originalLog = console.log;
      const logs = [];
      console.log = (...args) => logs.push(args.join(' '));

      // Execute code
      const result = eval(code);

      // Restore console.log
      console.log = originalLog;

      // Format output
      const output = logs.join('\n') + (result !== undefined ? `\n${result}` : '');
      setOutput(output || 'Code executed successfully (no output)');
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  const runPython = async () => {
    if (!pyodideRef.current) {
      setOutput('Pyodide is still loading...');
      return;
    }

    try {
      setOutput('Running...');

      // Redirect stdout to capture print output
      await pyodideRef.current.runPythonAsync(`
        import sys
        import io
        sys.stdout = io.StringIO()
      `);

      // Execute user code
      await pyodideRef.current.runPythonAsync(code);

      // Get captured output
      const result = await pyodideRef.current.runPythonAsync('sys.stdout.getvalue()');
      setOutput(result || 'Code executed successfully (no output)');
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  const runBackendCode = async (lang) => {
    try {
      setOutput(`Running on backend: ${API_URL}...`);

      const response = await fetch(`${API_URL}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language: lang, code }),
      });

      const data = await response.json();
      setOutput(data.output || 'Code executed successfully (no output)');
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  const runCode = () => {
    setIsRunning(true);
    setOutput('');

    if (language === 'javascript') {
      runJavaScript();
    } else if (language === 'python') {
      runPython();
    } else if (language === 'java' || language === 'cpp' || language === 'go') {
      runBackendCode(language);
    } else {
      setOutput(`Error: Unsupported language: ${language}`);
    }

    setIsRunning(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white">
        <span className="font-medium">Output</span>
        <button
          onClick={runCode}
          disabled={isRunning}
          className="px-4 py-1 bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-600"
        >
          {isRunning ? 'Running...' : 'Run Code'}
        </button>
      </div>
      <pre className="flex-1 p-4 bg-gray-900 text-green-400 font-mono text-sm overflow-auto">
        {output}
      </pre>
    </div>
  );
}

export default CodeExecutor;