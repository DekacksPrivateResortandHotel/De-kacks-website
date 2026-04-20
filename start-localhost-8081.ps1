$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$prefix = "http://localhost:8081/"

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".gif"  = "image/gif"
  ".svg"  = "image/svg+xml"
  ".ico"  = "image/x-icon"
  ".txt"  = "text/plain; charset=utf-8"
}

function Get-ContentType([string]$path) {
  $ext = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
  if ($mimeTypes.ContainsKey($ext)) {
    return $mimeTypes[$ext]
  }
  return "application/octet-stream"
}

function Resolve-RequestPath([string]$urlPath) {
  $relative = [Uri]::UnescapeDataString($urlPath.TrimStart("/"))
  if ([string]::IsNullOrWhiteSpace($relative)) {
    $relative = "index.html"
  }

  $candidate = Join-Path $root $relative
  if ((Test-Path $candidate) -and (Get-Item $candidate).PSIsContainer) {
    $candidate = Join-Path $candidate "index.html"
  }

  return $candidate
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)

try {
  $listener.Start()
} catch {
  Write-Host "Hindi ma-start ang localhost:8081. Baka may ibang app na gumagamit na ng port." -ForegroundColor Red
  throw
}

Start-Process $prefix
Write-Host "Dekack website is running at $prefix" -ForegroundColor Green
Write-Host "Panatilihing bukas ang window na ito habang ginagamit ang website." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the local server." -ForegroundColor Yellow

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $response = $context.Response

    try {
      $filePath = Resolve-RequestPath $context.Request.Url.AbsolutePath

      if (-not (Test-Path $filePath) -or (Get-Item $filePath).PSIsContainer) {
        $response.StatusCode = 404
        $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 - File not found")
        $response.ContentType = "text/plain; charset=utf-8"
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
      } else {
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $response.StatusCode = 200
        $response.ContentType = Get-ContentType $filePath
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    } catch {
      $response.StatusCode = 500
      $buffer = [System.Text.Encoding]::UTF8.GetBytes("500 - Internal server error")
      $response.ContentType = "text/plain; charset=utf-8"
      $response.OutputStream.Write($buffer, 0, $buffer.Length)
    } finally {
      $response.OutputStream.Close()
    }
  }
} finally {
  if ($listener.IsListening) {
    $listener.Stop()
  }
  $listener.Close()
}
