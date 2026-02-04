import { useState, useEffect } from 'react'
import { trackEvent, trackException } from './metrics'

interface User {
  sub: string;
  email?: string;
  [key: string]: any;
}

function App() {
  const [apiMessage, setApiMessage] = useState<string>('');
  const [user, setUser] = useState<User | null>(null)
  const [secureData, setSecureData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null)
  
  // New state for generic endpoint testing
  const [testEndpointData, setTestEndpointData] = useState<{ path: string, data: any } | null>(null);
  const [testEndpointLoading, setTestEndpointLoading] = useState(false);

  const fetchTestEndpoint = async (path: string) => {
    setTestEndpointLoading(true);
    setTestEndpointData({ path, data: null }); // Clear previous data but set path
    trackEvent('test_endpoint_click', { path });
    
    try {
      const startTime = performance.now();
      const res = await fetch(path);
      const duration = performance.now() - startTime;
      
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        data = await res.text();
      }
      
      setTestEndpointData({ path, data });
      trackEvent('test_endpoint_success', { path, status: res.status, duration });
    } catch (err) {
      console.error(`Failed to fetch ${path}`, err);
      setTestEndpointData({ path, data: { error: (err as Error).message } });
      trackEvent('test_endpoint_error', { path, error: (err as Error).message });
    } finally {
      setTestEndpointLoading(false);
    }
  }

  const fetchUser = async () => {
    try {
      const startTime = performance.now();
      const res = await fetch('/api/auth/me');
      const duration = performance.now() - startTime;
      
      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user);
        trackEvent('login_success', { email: data.user.email, duration });
        // If authenticated, also try to fetch secure data
        fetchSecureData();
      } else {
        trackEvent('auth_check_unauthenticated', { duration });
      }
    } catch (err) {
      console.error('Failed to fetch user', err);
      trackException(err as Error);
    } finally {
      setLoading(false);
    }
  }

  const fetchApiHello = async () => {
    try {
      const startTime = performance.now();
      const res = await fetch('/api/hello');
      const duration = performance.now() - startTime;
      
      const data = await res.json();
      setApiMessage(data.message);
      trackEvent('api_hello_success', { duration });
    } catch (err) {
      console.error('Failed to fetch API hello', err);
      trackEvent('api_hello_error', { error: (err as Error).message });
      trackException(err as Error);
      setError('Failed to connect to API');
    }
  }

  const fetchSecureData = async () => {
    trackEvent('fetch_secure_data_attempt');
    try {
      const startTime = performance.now();
      const res = await fetch('/api/secure-data');
      const duration = performance.now() - startTime;
      
      if (res.ok) {
        const data = await res.json();
        setSecureData(data);
        trackEvent('fetch_secure_data_success', { duration });
      } else {
        const errData = await res.json();
        setSecureData(errData);
        trackEvent('fetch_secure_data_denied', { status: res.status, duration });
      }
    } catch (err) {
      console.error('Failed to fetch secure data', err);
      trackException(err as Error);
    }
  }

  useEffect(() => {
    fetchUser();
    fetchApiHello();
    trackEvent('app_load');
  }, [])

  return (
    <div className="app">
      <header className="header">
        <h1>🚀 MindX Engineer 🚀</h1>
        <p>Full-Stack Application</p>
        <div className="auth-status">
           {user ? (
             <div className="logged-in">
               <span>👋 Hi, <strong>{user.given_name || user.email} &nbsp;</strong></span>
               <a href="/api/auth/logout" className="btn-logout" onClick={() => trackEvent('logout_click')}>Logout</a>
             </div>
           ) : (
             <a href="/api/auth/login" className="btn-login" onClick={() => trackEvent('login_click')}>Login with MindX ID</a>
           )}
        </div>
      </header>

      <main className="main">
        {/* <section className="welcome">
          <h2>Welcome to Frontend</h2>
          <p>This React app is currently running locally for verification.</p>
        </section> */}

        <section className="api-section">
          <h2>API Security Test</h2>
          
          {loading && <div className="status loading">Loading...</div>}
          
          {error && (
            <div className="status error">
              <p>❌ Error: {error}</p>
              <button onClick={() => {
                trackEvent('retry_public_api_click');
                fetchApiHello();
              }}>Retry Public API</button>
            </div>
          )}
          
          <div className="status success">
            {apiMessage && (
              <div className="card">
            <h3>API Check</h3>
            <p className="api-message">{apiMessage}</p>
            <button onClick={fetchApiHello} className="secondary-button">Refresh API</button>
          </div>
            )}

            {user && (
              <div className="api-response secure active" style={{ marginTop: '20px', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
                <h4>🔒 Secure API Data (Authenticated Only):</h4>
                {secureData ? (
                  <pre>{JSON.stringify(secureData, null, 2)}</pre>
                ) : (
                  <p>Loading secure data...</p>
                )}
                <button className="btn-refresh" onClick={() => {
                  trackEvent('refresh_secure_api_click');
                  fetchSecureData();
                }}>Refresh Secure</button>
              </div>
            )}

            {!user && (
              <div className="api-response unauthorized" style={{ marginTop: '20px', color: '#a03737ff' }}>
                <p>🔒 Login to access the <strong>Secure API endpoint</strong>.</p>
              </div>
            )}
            <div className="test-endpoints-container">
              <div className="test-endpoints-list">
                <span className="test-endpoints-label">Test Endpoints:</span>
                {['/health', '/api/info', '/api/hello', '/auth/me', '/api/secure-data'].map(path => (
                  <button 
                    key={path}
                    onClick={() => fetchTestEndpoint(path)}
                    className="test-endpoint-btn"
                    style={{ cursor: 'pointer' }} 
                  >
                    {path}
                  </button>
                ))}
              </div>
              
              {testEndpointData && (
                <div className="api-response active" style={{ marginTop: '15px', borderTop: '1px dashed #eee', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <h4>Result for <code>{testEndpointData.path}</code>:</h4>
                    <button 
                      onClick={() => setTestEndpointData(null)}
                      style={{ fontSize: '0.7rem', padding: '2px 6px', marginTop: 0, background: '#eee', color: '#666' }}
                    >
                      Clear
                    </button>
                  </div>
                  {testEndpointLoading ? (
                    <div className="status loading" style={{ padding: '10px', fontSize: '0.9em' }}>Fetching...</div>
                  ) : (
                    <pre style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {JSON.stringify(testEndpointData.data, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>

        </section>
      </main>

      <footer className="footer">
        <p>Week 1: API Security ✓</p>
        <p>Week 2: Metrics Implementation ✓</p>
      </footer>
    </div>
  )
}

export default App
