<#
.SYNOPSIS
  Production deployment pipeline: Docker build -> ECR push -> EKS apply.

.DESCRIPTION
  What this script does, in order:
    1. Verifies prerequisites (aws, docker, kubectl) and resolves the AWS account.
    2. Logs into Amazon ECR and creates the awdf-backend / awdf-frontend
       repositories if they do not exist yet (scan-on-push enabled).
    3. Builds both production images (multi-stage, non-root) and pushes them.
    4. Renders the k8s/ manifests into a temp dir with the real ECR image URLs,
       tag, and (optionally) ACM certificate ARN + public client URL.
    5. Ensures the awdf namespace exists and creates/updates the awdf-secrets
       Secret out-of-band (values come from -MongoUri/-JwtSecret, or
       backend\.env as a fallback) so credentials never end up in Git.
    6. Applies everything with kubectl kustomize and waits for rollouts.

.EXAMPLE
  ./scripts/deploy-aws.ps1 -ClusterName my-eks -Region ap-south-1

.EXAMPLE
  ./scripts/deploy-aws.ps1 -ClusterName my-eks -Region ap-south-1 `
      -CertArn arn:aws:acm:ap-south-1:123456789012:certificate/abc `
      -ClientUrl https://app.example.com `
      -MongoUri 'mongodb+srv://user:pass@cluster.mongodb.net/taskmanager' `
      -Tag v1.2.3
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ClusterName,

  [string]$Region = "ap-south-1",
  [string]$AccountId = "",
  [string]$Tag = "",
  [string]$CertArn = "",
  [string]$ClientUrl = "",
  [string]$MongoUri = "",
  [string]$JwtSecret = "",
  [switch]$SkipBuild,
  [switch]$SkipPush,
  [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-Tool {
  param(
    [string]$Exe,
    [string[]]$ToolArgs
  )
  # Native tools write diagnostics to stderr; run them without letting
  # PowerShell turn stderr into terminating errors.
  $prev = $global:ErrorActionPreference
  $global:ErrorActionPreference = "Continue"
  try {
    $output = & $Exe @ToolArgs 2>&1
    $code = $LASTEXITCODE
  } finally {
    $global:ErrorActionPreference = $prev
  }
  [pscustomobject]@{
    Output   = (($output | Out-String).Trim())
    ExitCode = $code
  }
}

function Assert-LastExit([string]$Action) {
  if ($LASTEXITCODE -ne 0) { throw "Step failed: $Action (exit code $LASTEXITCODE)" }
}

function New-RandomHex([int]$ByteCount) {
  $bytes = New-Object byte[] $ByteCount
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  -join ($bytes | ForEach-Object { $_.ToString("x2") })
}

# --------------------------------------------------------------------------
# 0. Prerequisites
# --------------------------------------------------------------------------
Write-Step "Checking prerequisites"
foreach ($tool in @("aws", "docker", "kubectl")) {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
    throw "'$tool' is required but was not found on PATH."
  }
}
$dockerInfo = Invoke-Tool "docker" @("info", "--format", "{{.ServerVersion}}")
if ($dockerInfo.ExitCode -ne 0) { throw "Docker daemon is not running." }

if (-not $AccountId) {
  $AccountId = (Invoke-Tool "aws" @("sts", "get-caller-identity", "--query", "Account", "--output", "text")).Output
}
if ($AccountId -notmatch '^\d{12}$') { throw "Could not resolve AWS account id: $AccountId" }
if (-not $Tag) {
  $sha = ""
  if (Get-Command "git" -ErrorAction SilentlyContinue) {
    $sha = (Invoke-Tool "git" @("rev-parse", "--short", "HEAD")).Output
  }
  $Tag = "$(Get-Date -Format 'yyyyMMdd-HHmmss')$(if ($sha) { "-$sha" })"
}
$EcrBase = "$AccountId.dkr.ecr.$Region.amazonaws.com"
Write-Host "Account : $AccountId"
Write-Host "Region  : $Region"
Write-Host "Cluster : $ClusterName"
Write-Host "Tag     : $Tag"

# --------------------------------------------------------------------------
# 1. ECR: login + repositories
# --------------------------------------------------------------------------
Write-Step "Logging in to Amazon ECR"
$login = Invoke-Tool "aws" @("ecr", "get-login-password", "--region", $Region)
if ($login.ExitCode -ne 0) { throw "ECR login password retrieval failed: $($login.Output)" }
# docker login reads the password from stdin; PowerShell pipes require a direct call
$global:ErrorActionPreference = "Continue"
$login.Output | docker login --username AWS --password-stdin $EcrBase
$global:ErrorActionPreference = "Stop"
Assert-LastExit "docker login to $EcrBase"

Write-Step "Ensuring ECR repositories exist"
foreach ($repo in @("awdf-backend", "awdf-frontend")) {
  $exists = Invoke-Tool "aws" @("ecr", "describe-repositories", "--repository-names", $repo, "--region", $Region, "--query", "repositoryName", "--output", "text")
  if ($exists.ExitCode -ne 0) {
    Write-Host "Creating ECR repository: $repo"
    $create = Invoke-Tool "aws" @(
      "ecr", "create-repository",
      "--repository-name", $repo,
      "--region", $Region,
      "--image-scanning-configuration", "scanOnPush=true",
      "--image-tag-mutability", "MUTABLE",
      "--output", "text", "--query", "repository.repositoryArn"
    )
    if ($create.ExitCode -ne 0) { throw "Failed to create ECR repository ${repo}: $($create.Output)" }
  } else {
    Write-Host "ECR repository exists: $repo"
  }
}

# --------------------------------------------------------------------------
# 2. Build
# --------------------------------------------------------------------------
if (-not $SkipBuild) {
  Write-Step "Building production images"
  docker build -t "awdf-backend:$Tag" "$Root\backend"
  Assert-LastExit "docker build backend"
  docker build --build-arg VITE_API_BASE_URL=/api -t "awdf-frontend:$Tag" "$Root\Frontend"
  Assert-LastExit "docker build frontend"
}

# --------------------------------------------------------------------------
# 3. Push
# --------------------------------------------------------------------------
if (-not $SkipPush) {
  Write-Step "Pushing images to ECR"
  docker tag "awdf-backend:$Tag" "$EcrBase/awdf-backend:$Tag"
  docker tag "awdf-frontend:$Tag" "$EcrBase/awdf-frontend:$Tag"
  docker push "$EcrBase/awdf-backend:$Tag"
  Assert-LastExit "docker push awdf-backend"
  docker push "$EcrBase/awdf-frontend:$Tag"
  Assert-LastExit "docker push awdf-frontend"
}

if ($SkipDeploy) {
  Write-Host ""
  Write-Host "SkipDeploy set - stopping after image push." -ForegroundColor Yellow
  exit 0
}

# --------------------------------------------------------------------------
# 4. Render manifests (k8s/ is never mutated in the repo)
# --------------------------------------------------------------------------
Write-Step "Rendering Kubernetes manifests"
$stage = Join-Path ([System.IO.Path]::GetTempPath()) ("awdf-k8s-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $stage | Out-Null
try {
  Copy-Item "$Root\k8s\*" -Destination $stage -Recurse -Force

  $kustPath = Join-Path $stage "kustomization.yaml"
  $k = Get-Content $kustPath -Raw
  $k = $k -replace 'newName: awdf-backend', "newName: $EcrBase/awdf-backend"
  $k = $k -replace 'newName: awdf-frontend', "newName: $EcrBase/awdf-frontend"
  $k = $k -replace 'newTag: latest', "newTag: $Tag"
  Set-Content -Path $kustPath -Value $k -NoNewline

  $ingPath = Join-Path $stage "ingress.yaml"
  $i = Get-Content $ingPath -Raw
  if ($CertArn) {
    $i = $i -replace 'LISTEN_PORTS_PLACEHOLDER', '[{"HTTP":80},{"HTTPS":443}]'
    $i = $i -replace 'SSL_REDIRECT_PLACEHOLDER', '"443"'
    $i = $i -replace '(?m)^(  annotations:)$', "`$1`n    alb.ingress.kubernetes.io/certificate-arn: $CertArn"
  } else {
    $i = $i -replace 'LISTEN_PORTS_PLACEHOLDER', '[{"HTTP":80}]'
    $i = $i -replace 'SSL_REDIRECT_PLACEHOLDER', '"0"'
    Write-Host "No -CertArn supplied: deploying HTTP-only ALB. Pass -CertArn for HTTPS." -ForegroundColor Yellow
  }
  Set-Content -Path $ingPath -Value $i -NoNewline

  if ($ClientUrl) {
    $cmPath = Join-Path $stage "configmap.yaml"
    $c = Get-Content $cmPath -Raw
    $c = $c -replace 'CLIENT_URL: "\*"', "CLIENT_URL: `"$ClientUrl`""
    Set-Content -Path $cmPath -Value $c -NoNewline
  }

  # ------------------------------------------------------------------
  # 5. Cluster context
  # ------------------------------------------------------------------
  Write-Step "Configuring kubectl for EKS cluster '$ClusterName'"
  $kube = Invoke-Tool "aws" @("eks", "update-kubeconfig", "--name", $ClusterName, "--region", $Region)
  if ($kube.ExitCode -ne 0) { throw "update-kubeconfig failed: $($kube.Output)" }
  Write-Host $kube.Output

  # ------------------------------------------------------------------
  # 6. Namespace + secrets (out-of-band by design)
  # ------------------------------------------------------------------
  Write-Step "Applying namespace"
  $nsApply = Invoke-Tool "kubectl" @("apply", "-f", (Join-Path $stage "namespace.yaml"))
  if ($nsApply.ExitCode -ne 0) { throw "namespace apply failed: $($nsApply.Output)" }
  Write-Host $nsApply.Output

  $mongo = $MongoUri
  $jwt = $JwtSecret
  if ((-not $mongo) -or (-not $jwt)) {
    $envPath = Join-Path $Root "backend\.env"
    if (Test-Path $envPath) {
      foreach ($line in (Get-Content $envPath)) {
        if (-not $mongo -and $line -match '^MONGODB_URI\s*=\s*(.+)$') { $mongo = $Matches[1].Trim() }
        if (-not $jwt -and $line -match '^JWT_SECRET\s*=\s*(.+)$') { $jwt = $Matches[1].Trim() }
      }
    }
  }

  # The backend refuses to boot in production with the development JWT default.
  if ($jwt -and $jwt -match 'development') {
    Write-Host "JWT_SECRET found is the development default - generating a production secret." -ForegroundColor Yellow
    $jwt = New-RandomHex 32
  }

  Write-Step "Ensuring Secret 'awdf-secrets' exists"
  $secretGet = Invoke-Tool "kubectl" @("-n", "awdf", "get", "secret", "awdf-secrets", "-o", "name")
  $secretExists = $secretGet.ExitCode -eq 0

  if (-not $secretExists) {
    if (-not $mongo) {
      throw "No MongoDB URI found. Pass -MongoUri or define MONGODB_URI in backend\.env (see k8s\secret.example.yaml)."
    }
    if (-not $jwt) {
      $jwt = New-RandomHex 32
      Write-Host "Generated a new JWT_SECRET for this cluster."
    }
    $global:ErrorActionPreference = "Continue"
    kubectl -n awdf create secret generic awdf-secrets `
      --from-literal=MONGODB_URI=$mongo `
      --from-literal=JWT_SECRET=$jwt `
      --dry-run=client -o yaml | kubectl apply -f -
    Assert-LastExit "creating awdf-secrets"
    $global:ErrorActionPreference = "Stop"
    Write-Host "Secret created."
  } elseif ($mongo) {
    if (-not $jwt) {
      $jwtB64 = (Invoke-Tool "kubectl" @("-n", "awdf", "get", "secret", "awdf-secrets", "-o", "jsonpath={.data.JWT_SECRET}")).Output
      if ($jwtB64) { $jwt = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($jwtB64)) }
    }
    if (-not $jwt) { $jwt = New-RandomHex 32 }
    $global:ErrorActionPreference = "Continue"
    kubectl -n awdf create secret generic awdf-secrets `
      --from-literal=MONGODB_URI=$mongo `
      --from-literal=JWT_SECRET=$jwt `
      --dry-run=client -o yaml | kubectl apply -f -
    Assert-LastExit "updating awdf-secrets"
    $global:ErrorActionPreference = "Stop"
    Write-Host "Secret updated (MONGODB_URI replaced, JWT_SECRET preserved)."
  } else {
    Write-Host "Secret already exists and no -MongoUri given - left untouched."
  }

  # ------------------------------------------------------------------
  # 7. Apply everything + wait
  # ------------------------------------------------------------------
  Write-Step "Applying manifests (kustomize)"
  $apply = Invoke-Tool "kubectl" @("apply", "-k", $stage)
  if ($apply.ExitCode -ne 0) { throw "kubectl apply failed:`n$($apply.Output)" }
  Write-Host $apply.Output

  Write-Step "Waiting for rollouts"
  $r1 = Invoke-Tool "kubectl" @("-n", "awdf", "rollout", "status", "deployment/backend", "--timeout=300s")
  if ($r1.ExitCode -ne 0) { throw "backend rollout failed:`n$($r1.Output)" }
  Write-Host $r1.Output
  $r2 = Invoke-Tool "kubectl" @("-n", "awdf", "rollout", "status", "deployment/frontend", "--timeout=300s")
  if ($r2.ExitCode -ne 0) { throw "frontend rollout failed:`n$($r2.Output)" }
  Write-Host $r2.Output

  Write-Step "Deploy complete"
  $ing = Invoke-Tool "kubectl" @("-n", "awdf", "get", "ingress", "awdf", "-o", "jsonpath={.status.loadBalancer.ingress[0].hostname}")
  if ($ing.Output) {
    Write-Host "ALB URL: http://$($ing.Output)" -ForegroundColor Green
    Write-Host "(HTTPS available if -CertArn was supplied.)" -ForegroundColor Green
  } else {
    Write-Host "Ingress created; ALB hostname pending (takes 1-3 minutes):" -ForegroundColor Yellow
    & kubectl -n awdf get ingress
  }
}
finally {
  if (Test-Path $stage) { Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue }
}
