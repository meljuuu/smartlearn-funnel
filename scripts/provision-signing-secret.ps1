$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$taskProject = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskPrivateDirectory = Join-Path $taskProject '.review'
[System.IO.Directory]::CreateDirectory($taskPrivateDirectory) | Out-Null
$taskEncryptedFile = Join-Path $taskPrivateDirectory 'smartlearn-signing-secret.dpapi'
if (Test-Path -LiteralPath $taskEncryptedFile) {
  $taskPlainBytes = [System.Security.Cryptography.ProtectedData]::Unprotect([System.IO.File]::ReadAllBytes($taskEncryptedFile), $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
  $taskSigningSecret = [System.Text.Encoding]::UTF8.GetString($taskPlainBytes)
} else {
  Push-Location -LiteralPath $taskProject
  try { & node (Join-Path $PSScriptRoot 'store-signing-secret.cjs') --check-new; if ($LASTEXITCODE -ne 0) { throw 'Signing-key creation was stopped to avoid an unapproved rotation.' } }
  finally { Pop-Location }
  $taskRandomBytes = New-Object byte[] 32
  $taskRng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $taskRng.GetBytes($taskRandomBytes) } finally { $taskRng.Dispose() }
  $taskSigningSecret = [Convert]::ToBase64String($taskRandomBytes).TrimEnd('=').Replace('+','-').Replace('/','_')
  $taskPlainBytes = [System.Text.Encoding]::UTF8.GetBytes($taskSigningSecret)
  $taskProtectedBytes = [System.Security.Cryptography.ProtectedData]::Protect($taskPlainBytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
  [System.IO.File]::WriteAllBytes($taskEncryptedFile, $taskProtectedBytes)
  [Array]::Clear($taskRandomBytes, 0, $taskRandomBytes.Length)
}
Push-Location -LiteralPath $taskProject
try {
  $taskSigningSecret | & node (Join-Path $PSScriptRoot 'store-signing-secret.cjs')
  if ($LASTEXITCODE -ne 0) { throw 'Cloudflare secret upload failed. The encrypted local copy is retained for a safe retry.' }
  Write-Output 'Signing secret stored in Cloudflare. Its matching local copy is encrypted for this Windows user; no plaintext file was written.'
} finally {
  [Array]::Clear($taskPlainBytes, 0, $taskPlainBytes.Length)
  $taskSigningSecret = $null
  Pop-Location
}
