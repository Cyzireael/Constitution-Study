$ErrorActionPreference = 'Stop'
$projectPath = (Get-Location).Path.TrimEnd('\')
$port = 5173
$siteUrl = "http://127.0.0.1:$port/"

function Test-PortOpen {
    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $connect = $client.ConnectAsync('127.0.0.1', $port)
        return $connect.Wait(500) -and $client.Connected
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

function Get-ProjectPage {
    try {
        Invoke-WebRequest -Uri $siteUrl -UseBasicParsing -TimeoutSec 2
    } catch {
        return $null
    }
}

function Test-ProjectPage($response) {
    if (-not $response) { return $false }
    $html = [string]$response.Content
    return $response.StatusCode -eq 200 -and
        $html.Contains('law-study-platform.appearance.theme.v1') -and
        $html.Contains('/src/main.tsx')
}

function Open-ProjectSite {
    Start-Process $siteUrl
}

$existingPage = Get-ProjectPage
if (Test-ProjectPage $existingPage) {
    Write-Host "This project is already serving on $siteUrl. Opening it in your default browser."
    Open-ProjectSite
    exit 0
}

if (Test-PortOpen) {
    Write-Host "Port $port is already occupied, and the response is not this project's Vite page."
    Write-Host 'No process was stopped. Close or reconfigure that application, then try again.'
    exit 2
}

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    Write-Host 'npm.cmd was not found. Install Node.js or add npm to PATH, then try again.'
    exit 3
}

Write-Host 'Starting the Law Study Platform with npm.cmd run dev...'
$server = Start-Process -FilePath $env:ComSpec `
    -ArgumentList '/d /c npm.cmd run dev' `
    -WorkingDirectory $projectPath `
    -NoNewWindow `
    -PassThru

$ready = $false
$deadline = [DateTime]::UtcNow.AddSeconds(60)
while ([DateTime]::UtcNow -lt $deadline) {
    $server.Refresh()
    if ($server.HasExited) {
        Write-Host "The development server exited before becoming ready (exit code $($server.ExitCode))."
        exit $server.ExitCode
    }

    $response = Get-ProjectPage
    if (Test-ProjectPage $response) {
        $ready = $true
        break
    }

    if (Test-PortOpen) {
        Write-Host "Port $port was taken by another application during startup. No unrelated process was stopped."
        exit 2
    }

    Start-Sleep -Milliseconds 400
}

if (-not $ready) {
    Write-Host 'The development server did not become ready within 60 seconds. Check the Vite output above.'
    exit 4
}

Write-Host "Server is ready at $siteUrl. Opening your default browser."
Open-ProjectSite
Write-Host 'Keep this window open while studying. Close this window to stop the development server.'
$server.WaitForExit()

if ($server.ExitCode -ne 0) {
    Write-Host "The development server stopped with exit code $($server.ExitCode)."
    exit $server.ExitCode
}
