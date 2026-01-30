import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
function App() {
    const [apiResponse, setApiResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchApiHello = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/hello');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            setApiResponse(data);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            setApiResponse(null);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchApiHello();
    }, []);
    return (_jsxs("div", { className: "app", children: [_jsxs("header", { className: "header", children: [_jsx("h1", { children: "\uD83D\uDE80 MindX Engineer Week 1" }), _jsx("p", { children: "Full-Stack Application on Azure Kubernetes" })] }), _jsxs("main", { className: "main", children: [_jsxs("section", { className: "welcome", children: [_jsx("h2", { children: "Welcome to Frontend" }), _jsx("p", { children: "This React app is running in Azure Kubernetes Service (AKS)." })] }), _jsxs("section", { className: "api-section", children: [_jsx("h2", { children: "API Integration Test" }), loading && _jsx("div", { className: "status loading", children: "Loading..." }), error && (_jsxs("div", { className: "status error", children: [_jsxs("p", { children: ["\u274C Error: ", error] }), _jsx("button", { onClick: fetchApiHello, children: "Retry" })] })), apiResponse && (_jsxs("div", { className: "status success", children: [_jsx("p", { children: "\u2705 API Response:" }), _jsx("pre", { children: JSON.stringify(apiResponse, null, 2) }), _jsx("button", { onClick: fetchApiHello, children: "Refresh" })] }))] }), _jsxs("section", { className: "info", children: [_jsx("h2", { children: "Architecture" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("strong", { children: "Frontend:" }), " React + TypeScript (Vite)"] }), _jsxs("li", { children: [_jsx("strong", { children: "Backend:" }), " Node.js + Express + TypeScript"] }), _jsxs("li", { children: [_jsx("strong", { children: "Infrastructure:" }), " Azure Kubernetes Service (AKS)"] }), _jsxs("li", { children: [_jsx("strong", { children: "Container Registry:" }), " Azure Container Registry (ACR)"] }), _jsxs("li", { children: [_jsx("strong", { children: "Ingress:" }), " nginx-ingress"] })] })] }), _jsxs("section", { className: "endpoints", children: [_jsx("h2", { children: "API Endpoints" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("code", { children: "GET /health" }), " - Health check"] }), _jsxs("li", { children: [_jsx("code", { children: "GET /hello" }), " - Hello endpoint"] }), _jsxs("li", { children: [_jsx("code", { children: "GET /api/info" }), " - API information"] })] })] })] }), _jsx("footer", { className: "footer", children: _jsx("p", { children: "Week 1: Foundation - API & Frontend on AKS \u2713" }) })] }));
}
export default App;
