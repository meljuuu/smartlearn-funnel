# Run this yourself only when ready to paste into the approved Apps Script property.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$taskEncryptedFile = Join-Path (Join-Path $PSScriptRoot '..') '.review/smartlearn-signing-secret.dpapi'
$taskPlainBytes = [System.Security.Cryptography.ProtectedData]::Unprotect([System.IO.File]::ReadAllBytes($taskEncryptedFile), $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
try {
  Set-Clipboard -Value ([System.Text.Encoding]::UTF8.GetString($taskPlainBytes))
  Write-Output 'Copied the signing secret locally without displaying it. Paste only into APPS_SCRIPT_SECRET in the SmartLearn Apps Script project, save, then clear the clipboard with: Set-Clipboard -Value ""'
} finally { [Array]::Clear($taskPlainBytes, 0, $taskPlainBytes.Length) }
