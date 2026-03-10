# Week 2 Implementation Log - Metrics & Monitoring

**Author:** LING  
**Status:** All Week 2 Tasks Completed & Verified  
**Date:** 2026-02-05

## 🎯 Week 2 Objectives
Implement comprehensive production and product metrics for the full-stack application, ensuring visibility into application health, performance, and user behavior.

---

## 📊 Metrics Ecosystem

### 1. Production Metrics (Azure Application Insights)
- **Backend (API)**: Server-side performance, exceptions, and dependency tracking
- **Frontend (Web)**: Client-side page views, browser exceptions, and interaction events
- **Integration**: All technical logs centralized in `week2-app-insights` resource

### 2. Product Metrics (Google Analytics 4)
- **Scope**: Frontend-only tracking
- **Purpose**: User engagement and business event tracking (Logins, API interactions)
- **Property ID**: `G-F1J5VBKY08`

---

## 🏗️ Step-by-Step Implementation

### Step 1: SDK Integration & Backend Hardening
- **API Setup**: Integrated `applicationinsights` SDK in Express server
- **Auth Tracking**: Enhanced `auth.ts` to track granular authentication states:
    - `login_attempt`, `login_success`, `login_failure`, and `logout`

### Step 2: Unified Frontend Metrics Utility
- **Implementation**: Created `apps/web/src/metrics.ts` as wrapper for both App Insights and GA4
- **Feature**: Auto-tracks page views and provides simple `trackEvent` function
- **Initialization**: Integrated into `main.tsx` for immediate tracking on app load

### Step 3: Granular Event Tracking
- **Interaction Logging**: Updated `App.tsx` to track user clicks (Login, Logout, Refresh)
- **Performance Profiling**: Implemented latency tracking for API calls using `performance.now()`
- **Error Handling**: Integrated `trackException` to capture and report frontend errors

### Step 4: Infrastructure & Build Fixes
- **Vite Env Injection**: Updated `Dockerfile` to use `ARG` and `ENV` for build-time variables
- **Automated Deployment**: Modified `deploy.ps1` to extract connection string and pass as `--build-arg`

### Step 5: Instrumentation Refactoring (Critical Fix)
- **Problem**: App Insights initialized too late, missing HTTP Request telemetry
- **Solution**: Created `apps/api/src/instrumentation.ts` to initialize SDK before Express
- **Impact**: Fixed missing Request logs in Azure (only Traces were visible before)
- **Files Modified**:
    - Created: `apps/api/src/instrumentation.ts`
    - Updated: `apps/api/src/index.ts` (moved initialization to separate file)

### Step 6: Alert Testing Infrastructure
- **Endpoint**: Added `/api/test-alerts` with `type=error` and `type=latency` modes
- **Script**: Created `scripts/trigger-alerts.ps1` for automated alert verification
- **Purpose**: Enable easy testing of Azure Monitor alerts without manual traffic generation

---

## 🛡️ Monitoring & Maintenance

Created comprehensive [METRICS-GUIDE.md](METRICS-GUIDE.md) with:
- **Step-by-step alert testing procedures**
- **Troubleshooting guide** for common issues
- **Alert configuration reference** (including unit clarifications)
- **Quick reference commands** for daily operations

---

## 🚀 Issues & Resolutions

| Issue | Root Cause | Resolution |
| :--- | :--- | :--- |
| **Missing Frontend Logs** | Vite env vars missing at build time | Updated Dockerfile with `ARG` and modified `deploy.ps1` to inject during CI/CD |
| **Empty Dashboards** | Aggregation latency | Used **Search** for real-time verification (~15 min delay for charts) |
| **Device Inconsistency** | Stale pods running old code | Added `kubectl rollout restart` to `deploy.ps1` to force pod refresh |
| **Live Metrics Error** | `ReferenceError: crypto is not defined` | Added `node:crypto` polyfill to `instrumentation.ts` for Node.js 18 |
| **Missing Request Telemetry** | App Insights initialized after Express | Refactored to `instrumentation.ts` imported first in `index.ts` |

---