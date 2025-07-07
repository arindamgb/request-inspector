import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiCopy, FiMaximize, FiX } from 'react-icons/fi';
import './RequestCard.css';


// Changing .env file and restarting the frontend container will not reflect the new value unless the React app is rebuilt.
// Below line Processes the environment variable at build time only.
// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// This loads the environment variable from the global window object dynamically at runtime.
// Given that you have a script that sets window.__env.BACKEND_URL before the app loads.
// A script tag can be used in the HTML(index.html) to set this variable by including a script like this:
// <script src="%PUBLIC_URL%/assets/env.js"></script>
// This env.js should define window.__env.BACKEND_URL = "http://your-server-ip:5000";
// Again, this value in env.js is determined from the environment variable(.env) using a bash script set at docker entrypoint.
// The bash script(env.sh) generates the env.js from a predefined template(env.template.js) at first run of the container.
// Changing the value in .env file and recreting the container will essentially change the value of window.__env.BACKEND_URL, thus making it dynamic.
// Beware, environment variables injected this way are publicly visible in the browser.
const BACKEND_URL = window.__env?.BACKEND_URL || "http://localhost:5000";

function JSONBlock({ label, content }) {
  const [copied, setCopied] = useState(false);

  const isValid =
    content !== null &&
    content !== undefined &&
    (typeof content === 'string'
      ? content.trim().length > 0
      : typeof content === 'object' && Object.keys(content).length > 0);

  if (!isValid) return null;

  const text =
    typeof content === 'string'
      ? content
      : JSON.stringify(content, null, 2);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <span className="field-label">{label}</span>
      <div className="json-container">
        <div className="json-block-wrapper">
          <CopyToClipboard text={text} onCopy={handleCopy}>
            <button className="copy-btn-embedded" title="Copy JSON">
              <FiCopy size={16} />
            </button>
          </CopyToClipboard>

          {copied && <div className="copy-tooltip">Copied!</div>}

          <SyntaxHighlighter
            language="json"
            style={vscDarkPlus}
            wrapLongLines
            customStyle={{
              borderRadius: '6px',
              padding: '10px',
              fontSize: '13px',
              fontFamily: "'IBM Plex Mono', monospace",
              background: '#2d2d2d',
              border: '1px solid #444',
              marginTop: '4px',
              position: 'relative',
              color: '#eee'
            }}
          >
            {text}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}

function RequestCard({ req }) {
  return (
    <div className="request-card">
      <div className="request-title">📦 {req.method} {req.path}</div>

      <div><span className="field-label">🕒 Timestamp:</span><span className="field-value">{req.timestamp}</span></div>
      <div><span className="field-label">🔗 Scheme:</span><span className="field-value">{req.scheme}</span></div>
      <div><span className="field-label">🌐 Full URL:</span><span className="field-value">{req.full_url}</span></div>
      <div><span className="field-label">🏠 Host:</span><span className="field-value">{req.host}</span></div>
      <div><span className="field-label">📎 Host Header:</span><span className="field-value">{req.Host_header}</span></div>
      <div><span className="field-label">🌍 Origin:</span><span className="field-value">{req.origin}</span></div>
      <div><span className="field-label">📍 Client IP:</span><span className="field-value">{req['client-ip']}</span></div>

      <JSONBlock label="🛂 Authorization:" content={req.authorization} />
      <JSONBlock label="🍪 Cookies:" content={req.cookies} />
      <JSONBlock label="📎 Query Params:" content={req.args} />
      <JSONBlock label="🧾 JSON Payload:" content={req['json-data']} />
      <JSONBlock label="📮 Form Data:" content={req['form-data']} />
      <JSONBlock label="📃 Raw Body:" content={req['raw-data']} />
      <JSONBlock label="📄 Headers:" content={req.headers} />
    </div>
  );
}

function App() {
  const [requests, setRequests] = useState([]);
  const [fullscreenIndex, setFullscreenIndex] = useState(null);
  const fullscreenRef = useRef(null);

  useEffect(() => {
    const socket = io(BACKEND_URL);
    socket.on('new_request', (data) => {
      setRequests(prev => [data, ...prev]);
    });

    fetch(`${BACKEND_URL}/requests`)
      .then(res => res.json())
      .then(data => setRequests(data));

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        // Let fullscreenchange handle it
        return;
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenIndex(null);
      }
    };

    document.addEventListener('keydown', handleKey);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const enterFullscreen = (index) => {
    setFullscreenIndex(index);
    setTimeout(() => {
      if (fullscreenRef.current?.requestFullscreen) {
        fullscreenRef.current.requestFullscreen();
      }
    }, 0);
  };

  const exitFullscreen = () => {
    setFullscreenIndex(null);
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  return (
    <div style={{ padding: '24px', paddingBottom: "90px", backgroundColor: '#121212', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1250px', margin: '0 auto' }}>
      
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '24px',
          gap: '12px'
        }}>
          <img src="/logo.png" alt="Logo" style={{ height: '48px' }} />
          <h2 style={{
            color: '#00A861',
            fontSize: '2rem',
            fontWeight: 'bold',
            margin: 0
          }}>
            Request Inspector
          </h2>
        </div>

        {requests.map((req, index) => (
          <div key={index}>
            {fullscreenIndex === index ? (
              <div className="fullscreen-overlay" ref={fullscreenRef}>
                <RequestCard req={req} />
                <button className="close-btn" onClick={exitFullscreen} title="Exit Fullscreen">
                  <FiX size={20} />
                </button>
              </div>
            ) : (
              <div className="card-wrapper">
                <RequestCard req={req} />
                <button
                  className="fullscreen-btn"
                  onClick={() => enterFullscreen(index)}
                  title="View Fullscreen"
                >
                  <FiMaximize size={20} />
                </button>
              </div>
            )}
          </div>
        ))}


        <footer style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999,
          width: '100%',
          maxWidth: '1250px',
        }}>
          <div style={{
            backgroundColor: '#1c1c1c',
            color: '#ccc',
            padding: '12px 24px',
            fontSize: '14px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
          }}>
            <div>
              Made with ❤️ for the community by&nbsp;
              <a href="https://www.linkedin.com/in/arindamgb/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#00A861', textDecoration: 'underline' }}>
                Arindam Gustavo Biswas
              </a>
            </div>
            <div>
              <a href="https://github.com/arindamgb/request-inspector"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#00A861', textDecoration: 'underline' }}>
                GitHub Repo
              </a> &nbsp;·&nbsp;
              Logo by&nbsp;
              <a href="https://www.flaticon.com/free-icon/shield_1161388?term=tech&page=6&position=27&origin=search&related_id=1161388"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#00A861', textDecoration: 'underline' }}>
                Flaticon
              </a> &nbsp;· 2025
            </div>
          </div>
        </footer>
      </div> {/* Close centered container */}
    </div>
  );
}

export default App;
