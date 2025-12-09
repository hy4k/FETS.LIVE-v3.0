Param(
  [string]$FtpHost = $env:FTP_HOST,
  [string]$User = $env:FTP_USER,
  [string]$Password = $env:FTP_PASS,
  [string]$RemoteRoot = "public_html",
  [int]$Port = 21,
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Err($msg) { Write-Host "[ERR]  $msg" -ForegroundColor Red }

if (-not $FtpHost -or -not $User -or -not $Password) {
  Write-Err "Missing FTP credentials. Provide -FtpHost, -User, -Password or set env FTP_HOST/FTP_USER/FTP_PASS."
  exit 1
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$appDir = Join-Path $repoRoot "fets-point"
$localRoot = Join-Path $appDir "dist"

if (-not $SkipBuild) {
  Write-Info "Building app (TypeScript + Vite)"
  Push-Location $appDir
  try {
    & node .\node_modules\typescript\bin\tsc -b tsconfig.app.json
    if ($LASTEXITCODE -ne 0) { throw "TypeScript build failed ($LASTEXITCODE)" }
    & node .\node_modules\vite\bin\vite.js build
    if ($LASTEXITCODE -ne 0) { throw "Vite build failed ($LASTEXITCODE)" }
  }
  finally {
    Pop-Location
  }
  Write-Ok "Build complete"
}
else {
  Write-Info "Skipping build per -SkipBuild"
}

if (-not (Test-Path $localRoot)) {
  Write-Err "Build output not found: $localRoot"
  exit 1
}

$files = Get-ChildItem -Path $localRoot -Recurse -File
if (-not $files -or $files.Count -eq 0) {
  Write-Err "No files to upload in $localRoot"
  exit 1
}

Write-Info ("Uploading {0} files to ftp://{1}:{2}/{3}" -f $files.Count, $FtpHost, $Port, $RemoteRoot)

$rootPath = (Resolve-Path $localRoot).Path
foreach ($f in $files) {
  $rel = $f.FullName.Substring($rootPath.Length)
  $rel = $rel -replace "^[\\/]+", ""
  $rel = $rel -replace "\\", "/"
  $remotePath = "$RemoteRoot/$rel"
  Write-Host "DEBUG: FullName=$($f.FullName) Rel=$rel RemotePath=$remotePath"
  $remoteUrl = "ftp://$($FtpHost):$Port/$remotePath"

  $argList = @(
    "--silent", "--show-error", "--fail",
    "--ftp-create-dirs",
    "--disable-eprt",
    "--ipv4",
    "--user", "$User`:$Password",
    "-T", $f.Name,
    $remoteUrl
  )

  $p = Start-Process -FilePath "curl.exe" -ArgumentList $argList -WorkingDirectory $f.DirectoryName -NoNewWindow -Wait -PassThru
  if ($p.ExitCode -ne 0) {
    Write-Err "Failed uploading $rel (exit $($p.ExitCode))"
    exit $p.ExitCode
  }
}

Write-Ok "Upload complete"

Write-Info "Verifying remote index.html"
$verifyArgs = @("--silent", "--show-error", "--fail", "--user", "$User`:$Password", "ftp://$($FtpHost):$Port/$RemoteRoot/", "-l")
$p2 = Start-Process -FilePath "curl.exe" -ArgumentList $verifyArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput (Join-Path $env:TEMP "deploy_verify.txt")
if ($p2.ExitCode -ne 0) {
  Write-Err "Remote listing failed (exit $($p2.ExitCode))"
  exit $p2.ExitCode
}
$content = Get-Content -Raw (Join-Path $env:TEMP "deploy_verify.txt")
Remove-Item (Join-Path $env:TEMP "deploy_verify.txt") -Force
if ($content -notmatch "index.html") {
  Write-Err "index.html not found in remote $RemoteRoot"
  exit 2
}
Write-Ok "index.html present on server"
