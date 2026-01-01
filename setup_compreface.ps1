# CompreFace Setup Script for SPi CCTV Monitoring (PowerShell)
# This script sets up and starts CompreFace service for optimal CCTV video processing

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     CompreFace Setup for SPi CCTV Monitoring System (Windows)  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$compreface_dir = Join-Path $scriptDir "CompreFace-master"

# Check if Docker is installed
Write-Host ""
Write-Host "Checking Docker installation..." -ForegroundColor Yellow

$docker_installed = $null -ne (Get-Command docker -ErrorAction SilentlyContinue)
if (-not $docker_installed) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop:" -ForegroundColor Red
    Write-Host "   https://docs.docker.com/desktop/install/windows-install/"
    exit 1
}
Write-Host "✅ Docker Desktop is installed" -ForegroundColor Green

# Check if Docker Compose is available
$docker_compose_installed = $null -ne (Get-Command docker-compose -ErrorAction SilentlyContinue)
if (-not $docker_compose_installed) {
    Write-Host "⚠️  Docker Compose not found, trying 'docker compose'..." -ForegroundColor Yellow
    $docker_compose_installed = $null -ne (Get-Command docker -ErrorAction SilentlyContinue)
}

if ($docker_compose_installed) {
    Write-Host "✅ Docker Compose is available" -ForegroundColor Green
} else {
    Write-Host "❌ Docker Compose is not available" -ForegroundColor Red
    exit 1
}

# Navigate to CompreFace directory
Set-Location $compreface_dir

Write-Host ""
Write-Host "📋 Step 1: Configuring environment..." -ForegroundColor Yellow

# Create .env file if it doesn't exist
$env_file = ".env"
if (-not (Test-Path $env_file)) {
    Write-Host "Creating .env file..." -ForegroundColor Gray
    
    $env_content = @"
# CompreFace Environment Configuration
POSTGRES_VERSION=14.5
ADMIN_VERSION=latest
API_VERSION=latest
registry=

postgres_username=postgres
postgres_password=secure_compreface_password
postgres_db=compreface
postgres_domain=compreface-postgres-db
postgres_port=5432

enable_email_server=false
email_host=smtp.gmail.com
email_username=your_email@gmail.com
email_from=noreply@compreface.com
email_password=your_app_password

compreface_admin_java_options=-Xmx1024m
compreface_api_java_options=-Xmx2048m

max_file_size=33554432
"@
    
    Set-Content -Path $env_file -Value $env_content
    Write-Host "✅ .env file created" -ForegroundColor Green
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Step 2: Starting CompreFace services..." -ForegroundColor Yellow
Write-Host "This may take 2-3 minutes on first run..." -ForegroundColor Gray

# Start CompreFace
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    docker-compose up -d
} else {
    docker compose up -d
}

# Wait for services to be ready
Write-Host ""
Write-Host "⏳ Waiting for CompreFace to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check if services are running
Write-Host ""
Write-Host "🔍 Checking services..." -ForegroundColor Yellow
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    docker-compose ps
} else {
    docker compose ps
}

Write-Host ""
Write-Host "📋 Step 3: Verifying CompreFace API..." -ForegroundColor Yellow

$maxAttempts = 30
$attempt = 0
$apiReady = $false

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $apiReady = $true
            Write-Host "✅ CompreFace API is responding" -ForegroundColor Green
            break
        }
    } catch {
        # API not ready yet
    }
    
    $attempt++
    if ($attempt -eq $maxAttempts) {
        Write-Host "❌ CompreFace API did not start within timeout" -ForegroundColor Red
        Write-Host "Check logs with: docker compose logs -f" -ForegroundColor Gray
        exit 1
    }
    
    Write-Host "⏳ Attempt $attempt/$maxAttempts... waiting for API" -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          CompreFace Setup Complete! ✅                         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host ""
Write-Host "📌 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Access CompreFace UI:"
Write-Host "   🌐 http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Access CompreFace API:"
Write-Host "   🔌 http://localhost:8000" -ForegroundColor Cyan
Write-Host "   📚 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Start SPi Backend (in new PowerShell):" -ForegroundColor Cyan
Write-Host "   cd '$scriptDir'" -ForegroundColor Gray
Write-Host "   python -m uvicorn backend.app:app --reload" -ForegroundColor Gray
Write-Host ""
Write-Host "4. In separate terminal, start SPi Frontend:" -ForegroundColor Cyan
Write-Host "   cd '$scriptDir'" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Upload CCTV Videos:" -ForegroundColor Cyan
Write-Host "   Go to DataInput tab in SPi application" -ForegroundColor Gray
Write-Host "   Upload video for CompreFace analysis" -ForegroundColor Gray
Write-Host ""
Write-Host "⚙️  Useful Commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   View logs:" -ForegroundColor Gray
Write-Host "   docker compose logs -f" -ForegroundColor Magenta
Write-Host ""
Write-Host "   Stop services:" -ForegroundColor Gray
Write-Host "   docker compose down" -ForegroundColor Magenta
Write-Host ""
Write-Host "   Stop and remove data:" -ForegroundColor Gray
Write-Host "   docker compose down -v" -ForegroundColor Magenta
Write-Host ""
Write-Host "   Restart services:" -ForegroundColor Gray
Write-Host "   docker compose restart" -ForegroundColor Magenta
Write-Host ""
Write-Host "📖 Documentation:" -ForegroundColor Yellow
Write-Host "   CompreFace Installation: $compreface_dir\docs\Installation-options.md" -ForegroundColor Gray
Write-Host "   SPi CompreFace Integration: $scriptDir\COMPREFACE_INTEGRATION_GUIDE.md" -ForegroundColor Gray
Write-Host ""
