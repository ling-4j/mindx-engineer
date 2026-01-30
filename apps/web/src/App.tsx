import { useState, useEffect } from 'react'

function App() {
  const [apiResponse, setApiResponse] = useState<{ message?: string; error?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchApiHello = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/hello')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      setApiResponse(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      setApiResponse(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApiHello()
  }, [])

  return (
    <div className="app">
      <header className="header">
        <h1>🚀 MindX Engineer Week 1</h1>
        <p>Full-Stack Application on Azure Kubernetes</p>
      </header>

      <main className="main">
        <section className="welcome">
          <h2>Welcome to Frontend</h2>
          <p>This React app is running in Azure Kubernetes Service (AKS).</p>
        </section>

        <section className="api-section">
          <h2>API Integration Test</h2>
          
          {loading && <div className="status loading">Loading...</div>}
          
          {error && (
            <div className="status error">
              <p>❌ Error: {error}</p>
              <button onClick={fetchApiHello}>Retry</button>
            </div>
          )}
          
          {apiResponse && (
            <div className="status success">
              <p>✅ API Response:</p>
              <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
              <button onClick={fetchApiHello}>Refresh</button>
            </div>
          )}
        </section>

        <section className="info">
          <h2>Architecture</h2>
          <ul>
            <li><strong>Frontend:</strong> React + TypeScript (Vite)</li>
            <li><strong>Backend:</strong> Node.js + Express + TypeScript</li>
            <li><strong>Infrastructure:</strong> Azure Kubernetes Service (AKS)</li>
            <li><strong>Container Registry:</strong> Azure Container Registry (ACR)</li>
            <li><strong>Ingress:</strong> nginx-ingress</li>
          </ul>
        </section>

        <section className="endpoints">
          <h2>API Endpoints</h2>
          <ul>
            <li><code>GET /health</code> - Health check</li>
            <li><code>GET /hello</code> - Hello endpoint</li>
            <li><code>GET /api/info</code> - API information</li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <p>Week 1: Foundation - API & Frontend on AKS ✓</p>
      </footer>
    </div>
  )
}

export default App
