# start_dependencies.ps1
# This script starts the local portable PostgreSQL and Redis instances, then applies Prisma migrations.

$ErrorActionPreference = "Stop"

$workspaceDir = "f:\Github\All-In-One-Discord-Bot"
$localServicesDir = "$workspaceDir\.local_services"
$pgBinDir = "$localServicesDir\pgsql\bin"
$pgDataDir = "$localServicesDir\data"
$redisBinDir = "$localServicesDir\redis"

# Ensure directories exist
if (-not (Test-Path $pgBinDir)) {
    Write-Error "PostgreSQL binaries not found at '$pgBinDir'. Please wait for the download/extraction task to complete."
}
if (-not (Test-Path $redisBinDir)) {
    Write-Error "Redis binaries not found at '$redisBinDir'."
}

# 1. Initialize PostgreSQL Data Directory if it does not exist
if (-not (Test-Path $pgDataDir)) {
    Write-Host "Initializing PostgreSQL database directory..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path $pgDataDir | Out-Null
    & "$pgBinDir\initdb.exe" -D $pgDataDir -U postgres -A trust
    Write-Host "PostgreSQL database initialized successfully." -ForegroundColor Green
}

# 2. Start PostgreSQL if not already running on port 5432
$pgRunning = $false
try {
    $conn = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 5432)
    $conn.Close()
    $pgRunning = $true
    Write-Host "PostgreSQL is already running on port 5432." -ForegroundColor Yellow
} catch {
    # Port is free, start Postgres
}

if (-not $pgRunning) {
    Write-Host "Starting PostgreSQL on port 5432..." -ForegroundColor Cyan
    & "$pgBinDir\pg_ctl.exe" start -D $pgDataDir -o "-p 5432"
    
    # Wait for Postgres to be ready
    Write-Host "Waiting for PostgreSQL to start..." -ForegroundColor Cyan
    $retries = 10
    while ($retries -gt 0) {
        try {
            $conn = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 5432)
            $conn.Close()
            Write-Host "PostgreSQL is ready!" -ForegroundColor Green
            break
        } catch {
            Start-Sleep -Seconds 1
            $retries--
        }
    }
    if ($retries -eq 0) {
        Write-Error "PostgreSQL failed to start or respond on port 5432."
    }
}

# 3. Start Redis if not already running on port 6379
$redisRunning = $false
try {
    $conn = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 6379)
    $conn.Close()
    $redisRunning = $true
    Write-Host "Redis is already running on port 6379." -ForegroundColor Yellow
} catch {
    # Port is free, start Redis
}

if (-not $redisRunning) {
    Write-Host "Starting Redis on port 6379..." -ForegroundColor Cyan
    Start-Process -FilePath "$redisBinDir\redis-server.exe" -ArgumentList "--port 6379" -WindowStyle Hidden
    
    # Wait for Redis to be ready
    Write-Host "Waiting for Redis to start..." -ForegroundColor Cyan
    $retries = 10
    while ($retries -gt 0) {
        try {
            $conn = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 6379)
            $conn.Close()
            Write-Host "Redis is ready!" -ForegroundColor Green
            break
        } catch {
            Start-Sleep -Seconds 1
            $retries--
        }
    }
    if ($retries -eq 0) {
        Write-Error "Redis failed to start or respond on port 6379."
    }
}

# 4. Run Prisma database migrations/synchronization
Write-Host "Running Prisma generate and db push..." -ForegroundColor Cyan
& npx prisma generate
& npx prisma db push

Write-Host "`nAll local dependencies started and migrations applied successfully! You can now start the bot using 'npm run dev:bot'." -ForegroundColor Green
