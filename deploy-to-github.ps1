# ============================================================
# EatClub App — GitHub Deployment Script
# ============================================================
# INSTRUCTIONS:
#   1. Generate a Personal Access Token at:
#      https://github.com/settings/tokens/new
#      (tick the 'repo' scope, any expiry is fine)
#   2. Fill in YOUR_GITHUB_TOKEN and YOUR_GITHUB_USERNAME below
#   3. Right-click this file → "Run with PowerShell"
#      OR open PowerShell and run:  .\deploy-to-github.ps1
# ============================================================

$TOKEN = "YOUR_GITHUB_TOKEN"       # paste your PAT here
$USERNAME = "YOUR_GITHUB_USERNAME"    # e.g. "johndoe"
$REPO = "eatclub-app"
$BRANCH = "main"

# ---- safety check ----
if ($TOKEN -eq "YOUR_GITHUB_TOKEN" -or $USERNAME -eq "YOUR_GITHUB_USERNAME") {
    Write-Host "❌  Please edit the script and fill in your TOKEN and USERNAME first." -ForegroundColor Red
    pause
    exit 1
}

$headers = @{
    Authorization = "token $TOKEN"
    Accept        = "application/vnd.github+json"
    "User-Agent"  = "EatClubDeploy"
}

$appDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# ---- 1. Create the repository ----
Write-Host "`n🚀  Creating repository '$REPO'..." -ForegroundColor Cyan
$body = @{
    name        = $REPO
    description = "EatClub-style food ordering app with customer + admin CRM"
    private     = $false
    auto_init   = $false
} | ConvertTo-Json

try {
    $repo = Invoke-RestMethod -Uri "https://api.github.com/user/repos" `
        -Method POST -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "✅  Repo created: $($repo.html_url)" -ForegroundColor Green
}
catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($err.message -like "*already exists*") {
        Write-Host "ℹ️   Repo already exists — will update files." -ForegroundColor Yellow
    }
    else {
        Write-Host "❌  Failed to create repo: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host $_.ErrorDetails.Message
        pause; exit 1
    }
}

# ---- 2. Upload each file ----
$files = @("index.html", "style.css", "data.js", "state.js", "components.js", "pages.js", "app.js", "firebase-config.js")

foreach ($file in $files) {
    $filePath = Join-Path $appDir $file
    if (-not (Test-Path $filePath)) {
        Write-Host "⚠️   Skipping $file (not found)" -ForegroundColor Yellow
        continue
    }

    $content = [System.IO.File]::ReadAllBytes($filePath)
    $b64 = [Convert]::ToBase64String($content)

    # Check if file already exists (to get its SHA for updates)
    $sha = $null
    try {
        $existing = Invoke-RestMethod -Uri "https://api.github.com/repos/$USERNAME/$REPO/contents/$file" `
            -Method GET -Headers $headers -ErrorAction Stop
        $sha = $existing.sha
    }
    catch { }

    $putBody = @{ message = "Add $file"; content = $b64; branch = $BRANCH }
    if ($sha) { $putBody.sha = $sha }

    try {
        Invoke-RestMethod -Uri "https://api.github.com/repos/$USERNAME/$REPO/contents/$file" `
            -Method PUT -Headers $headers -Body ($putBody | ConvertTo-Json) -ContentType "application/json" | Out-Null
        Write-Host "✅  Uploaded: $file" -ForegroundColor Green
    }
    catch {
        Write-Host "❌  Failed to upload $file`: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host $_.ErrorDetails.Message
    }
}

# ---- 3. Enable GitHub Pages ----
Write-Host "`n🌐  Enabling GitHub Pages (branch: $BRANCH, path: /)..." -ForegroundColor Cyan
$pagesBody = @{ source = @{ branch = $BRANCH; path = "/" } } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "https://api.github.com/repos/$USERNAME/$REPO/pages" `
        -Method POST -Headers $headers -Body $pagesBody -ContentType "application/json" | Out-Null
    Write-Host "✅  GitHub Pages enabled!" -ForegroundColor Green
}
catch {
    # May already be enabled
    Write-Host "ℹ️   GitHub Pages may already be enabled." -ForegroundColor Yellow
}

# ---- Done ----
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "🎉  Deployment complete!" -ForegroundColor Green
Write-Host "Repo:        https://github.com/$USERNAME/$REPO" -ForegroundColor White
Write-Host "Live site:   https://$USERNAME.github.io/$REPO" -ForegroundColor White
Write-Host "(GitHub Pages may take 1-2 minutes to go live)" -ForegroundColor Yellow
Write-Host "============================================`n" -ForegroundColor Cyan

Start-Process "https://github.com/$USERNAME/$REPO"
pause
