import { useState, useEffect } from 'react'

interface User {
  sub: string;
  name?: string;
  given_name?: string;
  email?: string;
  [key: string]: any;
}

function App() {
  const [apiData, setApiData] = useState<any>(null)
  const [user, setUser] = useState<User | null>(null)
  const [secureData, setSecureData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null)

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user);
        // If authenticated, also try to fetch secure data
        fetchSecureData();
      }
    } catch (err) {
      console.error('Failed to fetch user', err);
    } finally {
      setLoading(false);
    }
  }

  const fetchApiHello = async () => {
    try {
      const res = await fetch('/api/hello');
      const data = await res.json();
      setApiData(data);
    } catch (err) {
      console.error('Failed to fetch API hello', err);
      setError('Failed to connect to API');
    }
  }

  const fetchSecureData = async () => {
    try {
      const res = await fetch('/api/secure-data');
      if (res.ok) {
        const data = await res.json();
        setSecureData(data);
      } else {
        const errData = await res.json();
        setSecureData(errData);
      }
    } catch (err) {
      console.error('Failed to fetch secure data', err);
    }
  }

  useEffect(() => {
    fetchUser();
    fetchApiHello();
  }, [])

  return (
    <div className="app">
      <header className="header">
        <h1>🚀 MindX Engineer Week 1</h1>
        <p>Full-Stack Application with Secure OIDC</p>
        <div className="auth-status">
           {user ? (
             <div className="logged-in">
               <span>👋 Hi, <strong>{user.given_name || user.email}</strong></span>
               <a href="/api/auth/logout" className="btn-logout">Logout</a>
             </div>
           ) : (
             <a href="/api/auth/login" className="btn-login">Login with MindX ID</a>
           )}
        </div>
      </header>

      <main className="main">
        <section className="welcome">
          <h2>Welcome to Frontend</h2>
          <p>This React app is currently running locally for verification.</p>
        </section>

        <section className="api-section">
          <h2>API Security Test</h2>
          
          {loading && <div className="status loading">Loading...</div>}
          
          {error && (
            <div className="status error">
              <p>❌ Error: {error}</p>
              <button onClick={fetchApiHello}>Retry Public API</button>
            </div>
          )}
          
          <div className="status success">
            {apiData && (
              <div className="api-response active">
                <h4>Public API Check:</h4>
                <pre>{JSON.stringify(apiData, null, 2)}</pre>
                <button className="btn-refresh" onClick={fetchApiHello}>Refresh Public</button>
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
                <button className="btn-refresh" onClick={fetchSecureData}>Refresh Secure</button>
              </div>
            )}

            {!user && (
              <div className="api-response unauthorized" style={{ marginTop: '20px', color: '#666' }}>
                <p>🔒 Login to access the <strong>Secure API endpoint</strong>.</p>
              </div>
            )}
          </div>
        </section>

        <section className="info">
          <h2>Week 1 Status</h2>
          <ul>
            <li><strong>Task 5:</strong> Authentication & Middleware ✓</li>
            <li><strong>OIDC Provider:</strong> id-dev.mindx.edu.vn ✓</li>
            <li><strong>Security:</strong> HttpOnly Session Cookies ✓</li>
            <li><strong>Route Protection:</strong> Server-side `isAuthenticated` ✓</li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <p>Week 1: Finalizing Local Implementation ✓</p>
      </footer>
    </div>
  )
}

export default App
