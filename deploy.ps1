# ================================
# Week 1 Production Deployment Script for Azure AKS
# Uses Environment Variables ONLY
# Usage: ./deploy.ps1
# ================================

# ---- Load env vars ----
$AcrName        = $env:ACR_NAME
$ResourceGroup = $env:RESOURCE_GROUP
$AksCluster    = $env:AKS_CLUSTER
$Namespace     = $env:NAMESPACE
$AcrPassword   = $env:ACR_PASSWORD

if (-not $AcrName -or -not $ResourceGroup -or -not $AksCluster -or -not $Namespace -or -not $AcrPassword) {
    Write-Host "ERROR: Missing environment variables." -ForegroundColor Red
    Write-Host "Required: ACR_NAME, RESOURCE_GROUP, AKS_CLUSTER, NAMESPACE, ACR_PASSWORD" -ForegroundColor Yellow
    exit 1
}

$AcrLoginServer = "$AcrName.azurecr.io"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Azure AKS Production Deployment" -ForegroundColor Cyan
Write-Host "ACR:        $AcrLoginServer" -ForegroundColor Yellow
Write-Host "AKS:        $AksCluster" -ForegroundColor Yellow
Write-Host "Namespace:  $Namespace" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# ---- Check project structure ----
if (-not (Test-Path "apps/api") -or -not (Test-Path "apps/web")) {
    Write-Host "ERROR: Run script from project root (apps/api, apps/web missing)" -ForegroundColor Red
    exit 1
}

# ---- Check Docker ----
Write-Host "[1/7] Checking Docker..." -ForegroundColor Yellow
docker --version | Out-Null

# ---- Check Azure CLI ----
Write-Host "[2/7] Checking Azure login..." -ForegroundColor Yellow
try {
    az account show | Out-Null
} catch {
    az login
}

# ---- Login ACR ----
Write-Host "[3/7] Logging into ACR..." -ForegroundColor Yellow
az acr login --name $AcrName

# ---- Build images ----
Write-Host "[4/7] Building Docker images..." -ForegroundColor Yellow

# Get App Insights connection string for frontend build
$AppInsightsCS = ""
if (Test-Path "apps/api/.env") {
    $line = Get-Content "apps/api/.env" | Where-Object { $_ -match "^APPLICATIONINSIGHTS_CONNECTION_STRING=" }
    if ($line) {
        $AppInsightsCS = $line.Split("=", 2)[1].Trim().Trim('"').Trim("'")
    }
}

docker build -t "$AcrLoginServer/backend-api:v1" apps/api
if ($LASTEXITCODE -ne 0) { exit 1 }

docker build -t "$AcrLoginServer/mindx/web:latest" `
    --build-arg "VITE_APPLICATIONINSIGHTS_CONNECTION_STRING=$AppInsightsCS" `
    apps/web
if ($LASTEXITCODE -ne 0) { exit 1 }

# ---- Push images ----
Write-Host "[5/7] Pushing images to ACR..." -ForegroundColor Yellow
docker push "$AcrLoginServer/backend-api:v1"
if ($LASTEXITCODE -ne 0) { exit 1 }

docker push "$AcrLoginServer/mindx/web:latest"
if ($LASTEXITCODE -ne 0) { exit 1 }

# ---- AKS credentials ----
Write-Host "[6/7] Configuring kubectl..." -ForegroundColor Yellow
az aks get-credentials `
  --resource-group $ResourceGroup `
  --name $AksCluster `
  --overwrite-existing

kubectl cluster-info | Out-Null

# ---- Deploy ----
Write-Host "[7/7] Deploying to AKS..." -ForegroundColor Yellow

kubectl create namespace $Namespace --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret docker-registry acr-secret `
  --docker-server="$AcrLoginServer" `
  --docker-username="$AcrName" `
  --docker-password="$AcrPassword" `
  --docker-email="user@example.com" `
  -n $Namespace `
  --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f k8s/prod/auth-secrets.yaml
kubectl apply -f k8s/prod/cluster-issuer.yaml
kubectl apply -f k8s/prod/api-deployment.yaml
kubectl apply -f k8s/prod/api-service.yaml
kubectl apply -f k8s/prod/web-deployment.yaml
kubectl apply -f k8s/prod/web-service.yaml
kubectl apply -f k8s/prod/ingress.yaml

# fix on mobile pull latest image
Write-Host "Forcing pod restart to pull latest images..." -ForegroundColor Yellow
kubectl rollout restart deployment/api-deployment -n $Namespace
kubectl rollout restart deployment/web-deployment -n $Namespace

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "DEPLOYMENT SUCCESSFUL" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

kubectl get pods -n $Namespace
kubectl get svc -n $Namespace
kubectl get ingress -n $Namespace
