# 🚀 MindX Engineer: Full-Stack Azure Deployment & Monitoring

This project demonstrates a production-grade full-stack application deployed to Azure Kubernetes Service (AKS), featuring secure OpenID Connect (OIDC) authentication **(Week 1)** and comprehensive observability with Azure Application Insights & Google Analytics **(Week 2)**.

## 🏗️ Architecture Overview

- **Frontend**: React-based Single Page Application (SPA).
- **Backend**: Express.js API handling authentication and business logic.
- **Infrastructure**: Azure Kubernetes Service (AKS) with automated SSL.
- **Observability**: 
    - **Technical**: Azure Application Insights (Distributed Tracing, Logs).
    - **Product**: Google Analytics 4 (User Behavior).

---

## 🛠️ Local Setup

### Prerequisites
- Node.js (v18+)
- Docker Desktop
- Git

### Installation
1. Clone the repository and navigate to the project root.
2. Install dependencies for all apps:
   ```bash
   npm install
   ```

### Configuration
Create an `.env` file in `apps/api` with the following:
```env
# Authentication (Week 1)
OIDC_ISSUER=https://id-dev.mindx.edu.vn
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_REDIRECT_URI=http://localhost:3000/auth/callback
SESSION_SECRET=a-very-secure-random-string
FRONTEND_URL=http://localhost:5173

# Monitoring (Week 2)
APPLICATIONINSIGHTS_CONNECTION_STRING=your-azure-connection-string
```

### Running Locally
1. Start the backend:
   ```bash
   cd apps/api
   npm run dev
   ```
2. Start the frontend:
   ```bash
   cd apps/web
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## 🔐 Week 1: Authentication & Security

The project implements a secure **Authorization Code Flow** using OIDC:

1. **Login**: User clicks "Login", redirected to `id-dev.mindx.edu.vn`.
2. **Callback**: After login, the provider redirects to `/api/auth/callback` with a code.
3. **Session**: The backend exchanges the code for tokens and creates a secure, **HttpOnly** session cookie.
4. **Data Sanitization**: To prevent **Data Over-exposure**, the backend filters the OIDC user object.
   - 🛡️ **Hardening**: Only essential fields (`id`, `email`) are returned to the frontend.
   - 🛡️ **Leak Fix**: Sensitive identifiers like `sessionID` are explicitly removed from public endpoints.

---

## 📊 Week 2: Metrics & Monitoring

A complete observability layer was added to track both system performance and user behavior.

### 1. Production Metrics (Azure Application Insights)
- **Distributed Tracing**: Correlates frontend user actions to backend API requests
- **Exception Tracking**: Captures both client-side (JS/React) crashes and backend errors
- **Infrastructure Health**: Monitors Node.js resource usage on AKS
- **Request Telemetry**: Fixed via instrumentation refactoring (SDK initialized before Express)

### 2. Product Metrics (Google Analytics 4)
- **Behavioral Events**: Tracks "Login Success", "Public vs Secure API" usage
- **Performance Events**: Tracks "API Latency" to measure end-user wait times

### 3. Alert Testing Infrastructure
- **Test Endpoint**: `/api/test-alerts` supports `type=error` and `type=latency` modes
- **Automation Script**: `scripts/trigger-alerts.ps1` for automated alert verification
- **Documentation**: Comprehensive [METRICS-GUIDE.md](METRICS-GUIDE.md) with step-by-step procedures

### 4. Critical Fix: Instrumentation Architecture
To ensure proper Request telemetry capture, Application Insights initialization was refactored:
- **New File**: `apps/api/src/instrumentation.ts` (imported first in `index.ts`)
- **Impact**: Fixed missing HTTP Request logs (only Traces were visible before)
- **Pattern**: SDK must initialize **before** Express to hook into HTTP layer

---

## 📋 Week 3: Ticket Handling & Professional Communication

Practice-based training for support ticket workflow using MindX's 7-step process and Class of Service framework.

### 1. MindX 7-Step Process
1. **Reception** - Log ticket (<15 min)
2. **Initial Response** - Acknowledge (<30 min for Standard, <15 min for Priority, <5 min for Expedite)
3. **Diagnosis** - Investigate systematically
4. **Resolution** - Fix or escalate
5. **Communication** - Update regularly
6. **Follow-up** - Confirm resolution
7. **Documentation** - Record for trend analysis

### 2. Class of Service Framework
- **Standard** (<5 users) - Normal priority
- **Priority** (5-25 users) - Expedited handling
- **Expedite** (>25 users) - Emergency response
- **Fixed Deadline** (time-driven) - Deadline-based

### 3. Practice Scenarios Completed
- **Scenario 1:** Login Issue (Standard) - Basic workflow
- **Scenario 2:** Performance Problem (Priority) - Investigation & escalation
- **Scenario 3:** Critical Bug (Expedite) - Emergency coordination
- **Scenario 4:** Feature Request (Standard) - Expectation management
- **Scenario 5:** Multi-User Issue (Priority) - Coordinated communication
- **Scenario 6:** Deadline Request (Fixed Deadline) - Timeline negotiation

### 4. Skills Developed
- Professional email communication
- Ticket classification and prioritization
- Escalation decision-making
- Stakeholder management
- Documentation practices

---

## 🚀 Deployment (Production)

### CI/CD Workflow
The deployment is automated via `deploy.ps1`. It performs the following:
1. **Build**: Creates Docker images for `api` and `web`.
2. **Push**: Uploads images to Azure Container Registry (ACR).
3. **Deploy**: Updates Kubernetes manifests and restarts deployments on AKS.

### Kubernetes Infrastructure
- **Ingress**: Nginx Ingress Controller routes `/api/*` to the backend and `/` to the frontend.
- **SSL**: `letsencrypt-prod` (ACRE) automatically issues certificates for `*.nip.io` domains.
- **Secrets**: Managed via `k8s/prod/auth-secrets.yaml`.

### Manual Deployment Command
```powershell
./deploy.ps1
```

---

## 📝 Document History

### Week 1: Deployment & Security
- [WEEK-1-LOG.md](WEEK-1-LOG.md): Detailed technical implementation.
- [WEEK-1-SUMMARY.md](WEEK-1-SUMMARY.md): Mentor review summary.

### Week 2: Observability
- [WEEK-2-LOG.md](WEEK-2-LOG.md): Complete implementation log including instrumentation refactoring
- [WEEK-2-SUMMARY.md](WEEK-2-SUMMARY.md): Final achievements and technical insights
- [METRICS-GUIDE.md](METRICS-GUIDE.md): Step-by-step alert testing and troubleshooting guide

---
