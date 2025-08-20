/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, Type } from '@google/genai';
import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// --- TYPE DEFINITIONS ---
interface ResultData {
  overallSQI: number;
  breakdown: {
    topic: string;
    concept: string;
    score: number;
    weight: number;
    explanation: string;
  }[];
}

// --- UI COMPONENTS ---

const Spinner = () => <div className="spinner"></div>;

const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.endsWith('@intucate.com')) {
      setError('Email must be an @intucate.com address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    localStorage.setItem('isLoggedIn', 'true');
    onLogin();
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Diagnostic Agent Login</h1>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-required="true"
            aria-describedby={error ? "error-message" : undefined}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-required="true"
            aria-describedby={error ? "error-message" : undefined}
          />
        </div>
        {error && <p id="error-message" className="error-message" role="alert">{error}</p>}
        <button type="submit" className="button button-primary" style={{ width: '100%' }}>
          Login
        </button>
      </form>
    </div>
  );
};

const AdminConsole = ({ onLogout }: { onLogout: () => void }) => {
  const [prompt, setPrompt] = useState('');
  const [studentData, setStudentData] = useState('');
  const [dataType, setDataType] = useState<'upload' | 'paste'>('upload');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [apiError, setApiError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const savedPrompt = localStorage.getItem('diagnosticPrompt');
    if (savedPrompt) {
      setPrompt(savedPrompt);
    }
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSavePrompt = () => {
    localStorage.setItem('diagnosticPrompt', prompt);
    showToast('Prompt saved!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setStudentData(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleComputeSQI = async () => {
    if (!prompt || !studentData) {
      setApiError('Please provide both a prompt and student data.');
      return;
    }
    setIsLoading(true);
    setApiError('');
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const fullPrompt = `
        Based on the following diagnostic prompt and student attempt data, compute the Student Quality Index (SQI).

        DIAGNOSTIC PROMPT:
        ---
        ${prompt}
        ---

        STUDENT ATTEMPT DATA (JSON):
        ---
        ${studentData}
        ---

        Your task is to:
        1. Calculate an "overallSQI" score between 0 and 1.
        2. Provide a "breakdown" array of topics and concepts from the student data.
        3. For each item in the breakdown, provide a "topic", "concept", "score" (0-1), "weight" (0-1, how important this concept is), and a brief "explanation" for the score ("Why score?").
        4. Return ONLY the JSON object that adheres to the provided schema. Do not include any other text or markdown formatting.
      `;
      
      const responseSchema = {
          type: Type.OBJECT,
          properties: {
            overallSQI: { type: Type.NUMBER, description: "Overall student quality index from 0 to 1." },
            breakdown: {
              type: Type.ARRAY,
              description: "Array of scores for each topic and concept.",
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING, description: "The broader topic area." },
                  concept: { type: Type.STRING, description: "The specific concept evaluated." },
                  score: { type: Type.NUMBER, description: "The student's score for this concept (0-1)." },
                  weight: { type: Type.NUMBER, description: "The importance/weight of this concept (0-1)." },
                  explanation: { type: Type.STRING, description: "A brief rationale for the assigned score." },
                },
                required: ["topic", "concept", "score", "weight", "explanation"]
              },
            },
          },
          required: ["overallSQI", "breakdown"]
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
        },
      });

      const jsonText = response.text.trim();
      const parsedResult: ResultData = JSON.parse(jsonText);
      setResult(parsedResult);

    } catch (error) {
      console.error('API Error:', error);
      setApiError('Failed to compute SQI. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (!result) return;
    const jsonString = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'summary_customizer_input.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!result) return;
    const jsonString = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
        showToast('JSON copied to clipboard!');
    });
  };

  return (
    <div className="container">
      <header>
        <h1>Admin Console</h1>
        <button onClick={onLogout} className="button button-secondary">Logout</button>
      </header>
      <div className="admin-console">
        <div className="card">
          <h2>1. Diagnostic Agent Prompt</h2>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Paste the Diagnostic Agent Prompt here..."
            aria-label="Diagnostic Agent Prompt"
          ></textarea>
          <div className="toast">{toast === 'Prompt saved!' && toast}</div>
          <button onClick={handleSavePrompt} className="button button-secondary">Save Prompt</button>
        </div>

        <div className="card">
          <h2>2. Student Attempt Data</h2>
          <div className="tabs">
            <button className={`tab ${dataType === 'upload' ? 'active' : ''}`} onClick={() => setDataType('upload')} role="tab" aria-selected={dataType === 'upload'}>Upload Data</button>
            <button className={`tab ${dataType === 'paste' ? 'active' : ''}`} onClick={() => setDataType('paste')} role="tab" aria-selected={dataType === 'paste'}>Paste JSON</button>
          </div>
          {dataType === 'upload' ? (
            <label htmlFor="file-upload" className="file-input-label">
                <span>Click to upload CSV/JSON</span>
                {fileName && <p className="file-name">{fileName}</p>}
            </label>
            
          ) : (
            <textarea
              value={studentData}
              onChange={(e) => setStudentData(e.target.value)}
              placeholder='Or paste student attempt JSON data here...'
              aria-label="Student attempt JSON data"
            ></textarea>
          )}
           <input id="file-upload" type="file" accept=".csv,.json" onChange={handleFileChange} />
        </div>

        <div className="card action-card">
          <h2>3. Compute SQI</h2>
          <button onClick={handleComputeSQI} disabled={isLoading || !prompt || !studentData} className="button button-primary">
            {isLoading && <Spinner />}
            <span>Compute SQI</span>
          </button>
          {apiError && <p className="error-message" role="alert">{apiError}</p>}
        </div>

        {result && (
          <div className="card results-container">
            <h2>4. Results</h2>
            <div className="overall-sqi">
                <p>Overall SQI</p>
                <p className="score">{(result.overallSQI * 100).toFixed(1)}</p>
            </div>
            <h3>Topic & Concept Breakdown</h3>
            <table>
                <thead>
                    <tr>
                        <th>Concept</th>
                        <th>Score</th>
                        <th>Weight</th>
                        <th>Explanation</th>
                    </tr>
                </thead>
                <tbody>
                    {result.breakdown.map((item, index) => (
                        <tr key={index}>
                            <td><strong>{item.topic}</strong><br/>{item.concept}</td>
                            <td>{(item.score * 100).toFixed(0)}</td>
                            <td>{(item.weight * 100).toFixed(0)}%</td>
                            <td>{item.explanation}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <h3>Payload for Next Agent</h3>
            <div className="json-output">
                <pre><code>{JSON.stringify(result, null, 2)}</code></pre>
            </div>
            <div className="json-actions">
                <div className="toast" style={{ marginRight: 'auto' }}>{toast === 'JSON copied to clipboard!' && toast}</div>
                <button onClick={handleCopy} className="button button-secondary">Copy JSON</button>
                <button onClick={handleDownload} className="button button-primary">Download JSON</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP ---
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedInStatus = localStorage.getItem('isLoggedIn');
    if (loggedInStatus === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
  }, []);

  return isLoggedIn ? <AdminConsole onLogout={handleLogout} /> : <LoginPage onLogin={handleLogin} />;
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
