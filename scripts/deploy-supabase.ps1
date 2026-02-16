param(
  [string]$ProjectRef = $env:SUPABASE_PROJECT_REF,
  [string]$DbPassword = $env:SUPABASE_DB_PASSWORD,
  [switch]$WithMigrations
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = (Resolve-Path (Join-Path $scriptDir '..')).Path
$supabaseDir = Join-Path $projectRoot 'supabase'
$functionsDir = Join-Path $supabaseDir 'functions'
$configPath = Join-Path $supabaseDir 'config.toml'

function Resolve-ProjectRef {
  param(
    [string]$CurrentProjectRef,
    [string]$ConfigFilePath
  )

  if ($CurrentProjectRef) {
    return $CurrentProjectRef
  }

  if (-not (Test-Path $ConfigFilePath)) {
    return ''
  }

  $projectLine = Get-Content $ConfigFilePath | Where-Object { $_ -match '^project_id\s*=' } | Select-Object -First 1
  if (-not $projectLine) {
    return ''
  }

  if ($projectLine -match '"([^"]+)"') {
    return $Matches[1]
  }

  return ''
}

try {
  $null = Get-Command supabase -ErrorAction Stop
} catch {
  throw "Supabase CLI not found. Install with: npm install -g supabase"
}

$resolvedProjectRef = Resolve-ProjectRef -CurrentProjectRef $ProjectRef -ConfigFilePath $configPath
if (-not $resolvedProjectRef) {
  throw 'Project ref not found. Use -ProjectRef, SUPABASE_PROJECT_REF, or set project_id in supabase/config.toml.'
}

if (-not (Test-Path $functionsDir)) {
  throw "Functions directory not found at $functionsDir"
}

Write-Host "Project ref: $resolvedProjectRef"

if ($WithMigrations) {
  if (-not $DbPassword) {
    throw '-WithMigrations requires SUPABASE_DB_PASSWORD or -DbPassword.'
  }

  Write-Host 'Applying migrations (supabase db push --include-all)...'
  & supabase db push --project-ref $resolvedProjectRef --password $DbPassword --include-all
  if ($LASTEXITCODE -ne 0) {
    throw 'Migration deployment failed.'
  }
}

$functionDirs = Get-ChildItem -Path $functionsDir -Directory | Sort-Object Name
$deployedCount = 0

foreach ($dir in $functionDirs) {
  if ($dir.Name -eq '_shared') {
    continue
  }

  $hasIndexTs = Test-Path (Join-Path $dir.FullName 'index.ts')
  $hasIndexJs = Test-Path (Join-Path $dir.FullName 'index.js')
  if (-not ($hasIndexTs -or $hasIndexJs)) {
    Write-Warning "Skipping $($dir.Name): missing index.ts/index.js"
    continue
  }

  Write-Host "Deploying function: $($dir.Name)"
  & supabase functions deploy $dir.Name --project-ref $resolvedProjectRef
  if ($LASTEXITCODE -ne 0) {
    throw "Function deployment failed: $($dir.Name)"
  }

  $deployedCount++
}

if ($deployedCount -eq 0) {
  throw "No deployable functions found in $functionsDir"
}

Write-Host "Deployment complete. Functions deployed: $deployedCount"
