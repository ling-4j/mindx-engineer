# 🚀 MindX Engineer Week 1: Full-Stack Azure Deployment

This project demonstrates a production-grade full-stack application deployed to Azure Kubernetes Service (AKS), featuring secure OpenID Connect (OIDC) authentication, automated SSL via Cert-Manager, and proactive security hardening.

## 🏗️ Architecture Overview

- **Frontend**: React-based Single Page Application (SPA).
- **Backend**: Express.js API handling authentication and data.
- **Infrastructure**: Azure Kubernetes Service (AKS).
- **Security**: OIDC via `id-dev.mindx.edu.vn`, HTTPS via Let's Encrypt (Cert-Manager).

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
OIDC_ISSUER=https://id-dev.mindx.edu.vn
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_REDIRECT_URI=http://localhost:3000/auth/callback
SESSION_SECRET=a-very-secure-random-string
FRONTEND_URL=http://localhost:5173
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

## 🔐 Authentication Flow

The project implements a secure **Authorization Code Flow** using OIDC:

1. **Login**: User clicks "Login", redirected to `id-dev.mindx.edu.vn`.
2. **Callback**: After login, the provider redirects to `/api/auth/callback` with a code.
3. **Session**: The backend exchanges the code for tokens and creates a secure, **HttpOnly** session cookie.
4. **Data Sanitization**: To prevent **Data Over-exposure**, the backend filters the OIDC user object.
   - 🛡️ **Hardening**: Only essential fields (`id`, `email`) are returned to the frontend.
   - 🛡️ **Leak Fix**: Sensitive identifiers like `sessionID` are explicitly removed from public endpoints.

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
- **Week 1 Log**: Comprehensive implementation details can be found in [WEEK-1-LOG.md](WEEK-1-LOG.md).
- **Week 1 Summary**: A overview of all implemented steps for mentor review can be found in [WEEK-1-SUMMARY.md](WEEK-1-SUMMARY.md).

---
