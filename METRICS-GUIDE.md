# Metrics and Monitoring Guide

Guide for production/product metrics and alert verification for the MindX Engineer project.

---

## 1. Production Metrics (Azure Application Insights)

### Accessing App Insights
1. Log in to [Azure Portal](https://portal.azure.com)
2. Navigate to Resource Group: `mindx-intern-07-rg`
3. Click on `week2-app-insights`

### Key Views

**Live Metrics** (Real-time, <1s latency)
- Shows incoming requests immediately
- Best for: Verifying telemetry is flowing

**Failures** (5-15 min delay)
- Click "Failures" in left sidebar
- Shows HTTP 500s and exceptions
- Filter by "Server" vs "Browser"

**Performance** (5-15 min delay)
- Click "Performance" in left sidebar
- Shows average response times
- Look for spikes in duration

**Transaction Search** (2-5 min delay)
- Click "Transaction Search" in left sidebar
- Search for specific events (e.g., `test-alerts`)
- Filter by: Request, Trace, Exception, etc.

---

## 2. Product Metrics (Google Analytics)

### Accessing GA4
1. Log in to [Google Analytics](https://analytics.google.com)
2. Select property: `G-F1J5VBKY08`

### Key Events
- `app_load`: Frontend initialized
- `login_click` / `logout_click`: Auth interactions
- `login_success`: Successful authentication
- `api_hello_success` / `fetch_secure_data_success`: API calls 

---
## 3. Alert Configuration Reference

### High Error Rate Alert
```json
{
  "metricName": "requests/failed",
  "operator": "GreaterThan",
  "threshold": 5,
  "timeAggregation": "Count",
  "windowSize": "PT5M"
}
```

---

## 4. Alert Testing

### Step 1: Verify Endpoint
```powershell
curl.exe -I -k https://20.184.61.48.nip.io/api/test-alerts
```
**Expected:** `HTTP/1.1 200 OK`

### Step 2: Test High Error Rate Alert
```powershell
.\scripts\trigger-alerts.ps1 -Type error -Count 30
```
**What happens:**
- Sends 30 requests that return 500 errors
- Takes ~3 seconds to complete

**Verification:**
1. Go to **Live Metrics** → See `Request | 500` sample telemetry
2. Go to **Failures** → Change time range to "Last 30 minutes" → Click Refresh
3. Wait 5-10 minutes → Check **Alerts** page for "HighErrorRate-AppInsights"


### Step 4: Confirm Alert Fired
1. Navigate to **Monitoring** → **Alerts**
2. Change time range to "Last 1 hour"
3. Look for alerts with severity "3 - Informational" or higher
4. Click "View details" to see the triggered alert

---


## 6. Quick Reference Commands

### Trigger Error Alert
```powershell
.\scripts\trigger-alerts.ps1 -Type error -Count 30
```
### Check Endpoint
```powershell
curl.exe https://20.184.61.48.nip.io/api/test-alerts
```

### Redeploy After Changes
```powershell
.\deploy.ps1
```
