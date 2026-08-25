$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Get-DotEnvValue([string]$Name) {
  $line = Get-Content .env | Where-Object { $_ -match "^$([regex]::Escape($Name))=" } | Select-Object -First 1
  if (-not $line) { throw "Missing $Name in .env" }
  return ($line.Substring($line.IndexOf('=') + 1)).Trim().Trim('"').Trim("'")
}

function Invoke-CurlStatus([string[]]$Arguments, [string]$OutputPath) {
  $status = & curl.exe -sS -o $OutputPath -w '%{http_code}' @Arguments
  if ($LASTEXITCODE -ne 0) { throw "curl failed with exit code $LASTEXITCODE" }
  return [int]$status
}

function Assert-Status([string]$Name, [int]$Actual, [int[]]$Expected) {
  if ($Expected -notcontains $Actual) {
    throw "$Name expected HTTP $($Expected -join '/') but received $Actual"
  }
  $script:Results += [ordered]@{ test = $Name; status = $Actual; passed = $true }
}

$BaseUrl = 'http://127.0.0.1:3000'
$AdminEmail = Get-DotEnvValue 'ADMIN_EMAIL'
$AdminPassword = Get-DotEnvValue 'ADMIN_PASSWORD'
$DemoStudentEmail = Get-DotEnvValue 'STUDENT_EMAIL'
$DemoStudentPassword = Get-DotEnvValue 'STUDENT_PASSWORD'
$env:DATABASE_URL = Get-DotEnvValue 'DATABASE_URL'
$RunId = [guid]::NewGuid().ToString('N')
$TempRoot = Join-Path $env:TEMP "ai-study-security-$RunId"
$AdminCookies = Join-Path $TempRoot 'admin.cookies'
$StudentCookies = Join-Path $TempRoot 'student.cookies'
$DemoStudentCookies = Join-Path $TempRoot 'demo-student.cookies'
$ResponsePath = Join-Path $TempRoot 'response.json'
$RegistrationPath = Join-Path $TempRoot 'registration.json'
$OversizedPath = Join-Path $TempRoot 'oversized.pdf'
$FakePdfPath = Join-Path $TempRoot 'fake.pdf'
$Results = @()
$StudentEmail = "security-test-$RunId@example.invalid"
$StudentPassword = "Security-Test-$RunId!"

New-Item -ItemType Directory -Path $TempRoot | Out-Null

function Login([string]$Email, [string]$Password, [string]$CookiePath, [string]$ExpectedRole) {
  $csrfJson = & curl.exe -sS -c $CookiePath "$BaseUrl/api/auth/csrf"
  if ($LASTEXITCODE -ne 0) { throw 'Unable to fetch CSRF token' }
  $csrf = ($csrfJson | ConvertFrom-Json).csrfToken
  $status = Invoke-CurlStatus @(
    '-b', $CookiePath, '-c', $CookiePath,
    '-X', 'POST', "$BaseUrl/api/auth/callback/credentials",
    '--data-urlencode', "csrfToken=$csrf",
    '--data-urlencode', "email=$Email",
    '--data-urlencode', "password=$Password",
    '--data-urlencode', "callbackUrl=$BaseUrl/dashboard",
    '--data-urlencode', 'json=true'
  ) $ResponsePath
  Assert-Status "Login $Email" $status @(200)
  $loginResponse = Get-Content -Raw $ResponsePath | ConvertFrom-Json
  if ([string]$loginResponse.url -match 'error=') {
    throw "Login failed for $Email"
  }

  $sessionStatus = Invoke-CurlStatus @('-b', $CookiePath, "$BaseUrl/api/auth/session") $ResponsePath
  Assert-Status "Session $Email" $sessionStatus @(200)
  $sessionResponse = Get-Content -Raw $ResponsePath | ConvertFrom-Json
  if (-not $sessionResponse.user -or $sessionResponse.user.email -ne $Email) {
    throw "Session cookie was not established for $Email"
  }
  if ($sessionResponse.user.role -ne $ExpectedRole) {
    throw "Session for $Email expected role $ExpectedRole but received $($sessionResponse.user.role)"
  }
}

try {
  $status = Invoke-CurlStatus @("$BaseUrl/api/admin/overview") $ResponsePath
  Assert-Status 'Anonymous admin API request is rejected' $status @(401)

  Login $AdminEmail $AdminPassword $AdminCookies 'ADMIN'
  Login $DemoStudentEmail $DemoStudentPassword $DemoStudentCookies 'STUDENT'

  $status = Invoke-CurlStatus @('-b', $AdminCookies, "$BaseUrl/admin") $ResponsePath
  Assert-Status 'Admin can open admin page' $status @(200)

  $status = Invoke-CurlStatus @('-b', $AdminCookies, "$BaseUrl/api/admin/overview") $ResponsePath
  Assert-Status 'Admin can read admin overview API' $status @(200)
  $adminOverview = Get-Content -Raw $ResponsePath | ConvertFrom-Json
  if (-not $adminOverview.counts -or @($adminOverview.users).Count -lt 2) {
    throw 'Admin overview does not contain the seeded role accounts'
  }

  $status = Invoke-CurlStatus @('-b', $DemoStudentCookies, "$BaseUrl/admin") $ResponsePath
  Assert-Status 'Student receives 403 for admin page' $status @(403)

  $status = Invoke-CurlStatus @('-b', $DemoStudentCookies, "$BaseUrl/api/admin/overview") $ResponsePath
  Assert-Status 'Student receives 403 for admin API' $status @(403)

  # A unique account keeps the rate-limit assertions repeatable across test runs.
  $registrationBody = @{ email = $StudentEmail; password = $StudentPassword; name = 'Security Test Student' } | ConvertTo-Json -Compress
  [IO.File]::WriteAllText($RegistrationPath, $registrationBody, [Text.UTF8Encoding]::new($false))
  $status = Invoke-CurlStatus @(
    '-X', 'POST', "$BaseUrl/api/auth/register",
    '-H', 'Content-Type: application/json', '--data-binary', "@$RegistrationPath"
  ) $ResponsePath
  Assert-Status 'Register temporary student' $status @(201)
  Login $StudentEmail $StudentPassword $StudentCookies 'STUDENT'

  $status = Invoke-CurlStatus @('-b', $StudentCookies, "$BaseUrl/admin") $ResponsePath
  Assert-Status 'Temporary student receives 403 for admin route' $status @(403)

  $status = Invoke-CurlStatus @('-b', $AdminCookies, "$BaseUrl/api/ai/providers") $ResponsePath
  Assert-Status 'AI provider options endpoint' $status @(200)
  $providerResponse = Get-Content -Raw $ResponsePath | ConvertFrom-Json
  $groqProvider = @($providerResponse.providers | Where-Object { $_.id -eq 'groq' })
  if ($groqProvider.Count -ne 1 -or $groqProvider[0].model -ne 'openai/gpt-oss-120b') {
    throw 'Groq GPT-OSS 120B is missing from the provider options endpoint'
  }
  $Results += [ordered]@{ test = 'Groq GPT-OSS 120B provider is selectable'; status = 200; passed = $true }

  $status = Invoke-CurlStatus @(
    '--path-as-is', '-b', $AdminCookies,
    "$BaseUrl/api/files/..%2Fpackage.json"
  ) $ResponsePath
  Assert-Status 'Path traversal is rejected' $status @(400, 404)

  for ($attempt = 1; $attempt -le 11; $attempt += 1) {
    $status = Invoke-CurlStatus @(
      '-b', $StudentCookies, '-X', 'POST', "$BaseUrl/api/ai",
      '-H', 'Content-Type: application/json',
      '-H', "X-Forwarded-For: 198.51.100.$attempt",
      '--data', '{}'
    ) $ResponsePath
    if ($attempt -le 10) { Assert-Status "Rate limit request $attempt" $status @(400) }
  }
  Assert-Status 'Rate limit request 11' $status @(429)

  $status = Invoke-CurlStatus @(
    '-b', $StudentCookies, '-X', 'POST', "$BaseUrl/api/ai",
    '-H', 'Content-Type: application/json',
    '-H', 'X-Forwarded-For: 203.0.113.250',
    '--data', '{}'
  ) $ResponsePath
  Assert-Status 'Spoofed forwarded IP cannot bypass limit' $status @(429)

  $oversized = New-Object byte[] (11 * 1024 * 1024 + 1)
  [System.Text.Encoding]::ASCII.GetBytes('%PDF') | ForEach-Object -Begin { $index = 0 } -Process {
    $oversized[$index] = $_
    $index += 1
  }
  [IO.File]::WriteAllBytes($OversizedPath, $oversized)
  $status = Invoke-CurlStatus @(
    '-b', $AdminCookies, '-X', 'POST', "$BaseUrl/api/upload",
    '-F', "file=@$OversizedPath;type=application/pdf"
  ) $ResponsePath
  Assert-Status 'Oversized PDF returns 413' $status @(413)

  [IO.File]::WriteAllBytes($FakePdfPath, [System.Text.Encoding]::ASCII.GetBytes('MZ-not-a-pdf'))
  $status = Invoke-CurlStatus @(
    '-b', $AdminCookies, '-X', 'POST', "$BaseUrl/api/upload",
    '-F', "file=@$FakePdfPath;type=application/pdf"
  ) $ResponsePath
  Assert-Status 'Fake PDF signature is rejected' $status @(400)

  $SamplePdf = Get-ChildItem uploads -Filter '*.pdf' -File | Sort-Object Length | Select-Object -First 1
  if (-not $SamplePdf) { throw 'No local sample PDF is available for the valid-upload test' }
  $status = Invoke-CurlStatus @(
    '-b', $AdminCookies, '-X', 'POST', "$BaseUrl/api/upload",
    '-F', "file=@$($SamplePdf.FullName);type=application/pdf"
  ) $ResponsePath
  Assert-Status 'Valid PDF upload' $status @(201)
  $uploaded = Get-Content -Raw $ResponsePath | ConvertFrom-Json
  $UploadedFilename = [string]$uploaded.filename
  if (-not (Test-Path (Join-Path uploads $UploadedFilename))) { throw 'Uploaded PDF is missing on disk' }

  $status = Invoke-CurlStatus @(
    '-b', $AdminCookies, '-X', 'DELETE', "$BaseUrl/api/files/$UploadedFilename"
  ) $ResponsePath
  Assert-Status 'Delete document API' $status @(200)
  if (Test-Path (Join-Path uploads $UploadedFilename)) { throw 'Physical PDF remains after deletion' }
  if (Test-Path (Join-Path uploads "$UploadedFilename.txt")) { throw 'Extracted text remains after deletion' }
  $Results += [ordered]@{ test = 'Physical artifacts removed'; status = 200; passed = $true }

  [ordered]@{
    generatedAt = (Get-Date).ToUniversalTime().ToString('o')
    passed = $Results.Count
    failed = 0
    results = $Results
  } | ConvertTo-Json -Depth 5
}
finally {
  $env:TEST_USER_EMAIL = $StudentEmail
  & node -e "const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); p.user.deleteMany({where:{email:process.env.TEST_USER_EMAIL}}).finally(()=>p.`$disconnect())" | Out-Null
  Remove-Item -LiteralPath $TempRoot -Recurse -Force -ErrorAction SilentlyContinue
}
