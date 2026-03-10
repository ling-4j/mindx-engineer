# Week 1 Implementation Log - MindX Onboarding

**Author:** LING
**Status:** All Week 1 Tasks Completed & Verified
**Date:** 2026-01-31

## 🎯 Project Overview
Successfully built, secured, and deployed a production-grade full-stack application (React + Node.js) on Azure Kubernetes Service (AKS) with automated SSL and OpenID Connect (OIDC) authentication.

---

## ☁️ Infrastructure Provisioning (Azure Portal)

The primary infrastructure was provisioned directly via the **Azure Portal (GUI)**. Below are the finalized resource details and equivalent CLI commands for reference:

### 1. Project Context
- **Subscription**: MindX Develop Azure Subscription (`f244cdf7-5150-4b10-b3f2-d4bff23c5f45`)
- **Resource Group**: `mindx-intern-07-rg`
- **Location**: `southeastasia`

### 2. Azure Container Registry (ACR)
- **Name**: `mindxacrlinh`
- **Login Server**: `mindxacrlinh.azurecr.io`
- **SKU**: `Basic`

### 3. AKS Cluster Setup
- **Name**: `mindx-aks-cluster`
- **Kubernetes Version**: `1.30.5`
- **Node Size**: `Standard_DS2_v2`
- **Network Type**: `Azure CNI Overlay`

Equivalent Provisioning Commands (for reference):
```powershell
# ACR Provisioning
az acr create --resource-group mindx-intern-07-rg --name mindxacrlinh --sku Basic

# AKS Provisioning (with ACR attachment)
az aks create `
  --resource-group mindx-intern-07-rg `
  --name mindx-aks-cluster `
  --node-count 1 `
  --node-vm-size Standard_DS2_v2 `
  --network-plugin azure `
  --network-plugin-mode overlay `
  --attach-acr mindxacrlinh
```

### 4. Cluster Connection
Post-provisioning steps performed via terminal:
```powershell
# Fetch credentials for kubectl
az aks get-credentials --resource-group mindx-intern-07-rg --name mindx-aks-cluster

# Create application namespace
kubectl create namespace week1
```

---

## 🏗️ Step-by-Step Implementation

### Step 1: Repository Setup & Containerization
- **Backend API**: Developed a Node.js/TypeScript Express server with health checks, logging, and environment-based configuration.
- **Containerization**: Authored optimized multi-stage Dockerfiles to minimize image size and maximize security.
- **Azure Container Registry (ACR)**: Provisioned `mindxacrlinh.azurecr.io` to manage container images.

### Step 2: AKS Deployment
- **Orchestration**: Provisioned an **Azure Kubernetes Service (AKS)** cluster and configured `kubectl` for secure access.
- **Manifests**: Created Deployment and ClusterIP Service YAMLs for the API, implementing resource limits and health probes.
- **Deployment**: Verified successful deployment and internal cluster communication.

### Step 3: Ingress Configuration
- **External Routing**: Installed the **Nginx Ingress Controller** to manage public traffic.
- **Load Balancing**: Configured an Ingress resource to route traffic to the backend services via a public LoadBalancer IP.

### Step 4: Full-Stack Integration
- **Frontend App**: Developed a React/TypeScript application using Vite.
- **Microservice Routing**: Updated Ingress to support hybrid path-based routing:
    - `/` -> Frontend (React)
    - `/api/` -> Backend (Express)
- **Verified Communication**: Confirmed seamless frontend-to-backend communication via the Ingress endpoint.

### Step 5: Secure Authentication (OIDC)
- **MindX ID Provider**: Integrated OIDC via `id-dev.mindx.edu.vn` using the Authorization Code Flow.
- **Session Management**: Implemented `express-session` with `httpOnly` cookies for stateful authentication.
- **Security Logic**: Created `isAuthenticated` middleware and handled OIDC claim mapping for user context.

### Step 6: HTTPS & SSL Automation
- **Custom Domain**: Integrated the `.nip.io` dynamic DNS for dynamic LoadBalancer IP resolution.
- **Cert-Manager**: Deployed `cert-manager` and configured a `letsencrypt-prod` ClusterIssuer.
- **SSL Enforcement**: Automated certificate issuance via Let's Encrypt and enforced TLS/HTTPS for all endpoints.

---

## 🛡️ Security Hardening & Production Readiness
Beyond the basic requirements, the following proactive hardening was implemented:
- **Data Sanitization**: Filtered `/auth/me` and `/api/secure-data` to prevent leaking internal OIDC metadata.
- **Cookie Hardening**: Enforced `Secure` and `HttpOnly` flags to mitigate XSS and Session Hijacking.

## 🚀 Issues & Resolutions
| Issue | Root Cause | Resolution |
| :--- | :--- | :--- |
| **OIDC Login Crash** | Missing `sub` claim | Added try/catch to map metadata from `firebaseId`. |
| **Prod Session Lost** | Load balancing across 3 pods | Added **Nginx Session Affinity** (Sticky Sessions) to Ingress. |
| **Cookie Not Set** | Proxy trust issue for HTTPS cookies | Added `app.set('trust proxy', 1)` to Express configuration. |

---
