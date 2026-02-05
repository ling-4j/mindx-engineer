# Trigger alerts for testing
param (
    [string]$Type = "error",
    [int]$Count = 20,
    [string]$Url = "https://20.184.61.48.nip.io"
)

Write-Host "Triggering $Count requests of type '$Type' to $Url..." -ForegroundColor Cyan

$Endpoint = "$Url/api/test-alerts?type=$Type"

for ($i = 1; $i -le $Count; $i++) {
    try {
        if ($Type -eq "latency") {
            Write-Host "[$i/$Count] Sending slow request..." -NoNewline
            $response = Invoke-RestMethod -Uri "$Endpoint&duration=2500" -Method Get -TimeoutSec 10
            Write-Host " Done." -ForegroundColor Green
        }
        else {
            Write-Host "[$i/$Count] Sending error request..." -NoNewline
            try {
                Invoke-RestMethod -Uri $Endpoint -Method Get | Out-Null
            } catch {
                # expect 500
                Write-Host " 500 OK (Expected)" -ForegroundColor Yellow
            }
        }
    }
    catch {
        Write-Host " Request failed completely: $_" -ForegroundColor Red
    }
    
    # Small delay 100ms
    Start-Sleep -Milliseconds 100
}

Write-Host "`nTest complete!" -ForegroundColor Cyan
Write-Host "Please wait ~5 minutes for Azure Application Insights to aggregate metrics." -ForegroundColor White
