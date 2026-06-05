# ARGENT Install Script for Windows
# Run in PowerShell: irm https://raw.githubusercontent.com/DNDED/argent/master/scripts/install.ps1 | iex

$ErrorActionPreference = "Stop"

$ARGENT_VERSION = "latest"
$ARGENT_INSTALL_DIR = "$env:LOCALAPPDATA\argent\bin"
$ARGENT_REPO = "DNDED/argent"

Write-Host ""
Write-Host "╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                      ║" -ForegroundColor Cyan
Write-Host "║  ⬡  A  R  G  E  N  T               ║" -ForegroundColor Cyan
Write-Host "║                                      ║" -ForegroundColor Cyan
Write-Host "║  The Universal AI Coding Harness     ║" -ForegroundColor White
Write-Host "║                                      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Detect architecture
$ARCH = if ([System.Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
Write-Host "Detected: windows/$ARCH" -ForegroundColor DarkGray

# Create install directory
if (!(Test-Path $ARGENT_INSTALL_DIR)) {
    New-Item -ItemType Directory -Path $ARGENT_INSTALL_DIR -Force | Out-Null
}

# Download binary
$BINARY_NAME = "argent-windows-$ARCH.exe"
if ($ARGENT_VERSION -eq "latest") {
    $DOWNLOAD_URL = "https://github.com/$ARGENT_REPO/releases/latest/download/$BINARY_NAME"
} else {
    $DOWNLOAD_URL = "https://github.com/$ARGENT_REPO/releases/download/v$ARGENT_VERSION/$BINARY_NAME"
}

Write-Host "Downloading ARGENT v$ARGENT_VERSION..." -ForegroundColor DarkGray

try {
    Invoke-WebRequest -Uri $DOWNLOAD_URL -OutFile "$ARGENT_INSTALL_DIR\argent.exe" -UseBasicParsing
} catch {
    Write-Host "Error: Failed to download ARGENT" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Add to PATH
$CURRENT_PATH = [System.Environment]::GetEnvironmentVariable("Path", "User")
if ($CURRENT_PATH -notlike "*$ARGENT_INSTALL_DIR*") {
    [System.Environment]::SetEnvironmentVariable("Path", "$ARGENT_INSTALL_DIR;$CURRENT_PATH", "User")
    Write-Host "✓ Added to PATH" -ForegroundColor Green
    Write-Host "  Restart your terminal for PATH changes to take effect." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "✓ ARGENT installed successfully!" -ForegroundColor Green -NoNewline
Write-Host ""
Write-Host ""
Write-Host "  argent" -ForegroundColor Cyan -NoNewline
Write-Host "  # Start the coding harness" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Quick setup:" -ForegroundColor DarkGray
Write-Host '  $env:ANTHROPIC_API_KEY="your-key"' -ForegroundColor Cyan
Write-Host '  $env:OPENAI_API_KEY="your-key"' -ForegroundColor Cyan
Write-Host "  argent" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or use OAuth (no API key needed):" -ForegroundColor DarkGray
Write-Host "  argent" -ForegroundColor Cyan
Write-Host "  > Choose [3] Codex OAuth for free browser login" -ForegroundColor DarkGray
Write-Host ""
