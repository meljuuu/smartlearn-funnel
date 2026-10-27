param([switch]$Capture,[string]$Status)
# Reuse the user's existing encrypted recovery key; no secret is displayed or
# written to source/arguments/environment. Google deployment is not changed here.
Add-Type -AssemblyName System.Security
$root = Split-Path -Parent $PSScriptRoot
$keyFile = Join-Path $root '.review/smartlearn-signing-secret.dpapi'
if (!(Test-Path -LiteralPath $keyFile)) { throw 'Installed encrypted key unavailable. Use npm run verify:google in your own terminal instead; never put a secret in chat.' }
$endpoint = $env:APPS_SCRIPT_URL
$privateEndpointSource = Join-Path $root '.review/rotate-signing-secret.ps1'
if (!$endpoint -and (Test-Path -LiteralPath $privateEndpointSource)) { $endpoint=[regex]::Match([System.IO.File]::ReadAllText($privateEndpointSource),'https://script\.google\.com/macros/s/[\w-]+/exec').Value }
if (!$endpoint) { throw 'Set APPS_SCRIPT_URL locally to the existing Web app /exec URL from Deploy > Manage deployments. Do not create a new deployment.' }
if ($Status -and $Status -notmatch '^[a-fA-F0-9-]{36}$') { throw 'Status requires an opaque request UUID.' }
$privateBytes = [System.Security.Cryptography.ProtectedData]::Unprotect([System.IO.File]::ReadAllBytes($keyFile),$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser)
$payload = @{APPS_SCRIPT_URL=$endpoint; APPS_SCRIPT_SECRET=[System.Text.Encoding]::UTF8.GetString($privateBytes)} | ConvertTo-Json -Compress
$start = New-Object System.Diagnostics.ProcessStartInfo
$start.FileName='node'; $start.Arguments='"'+(Join-Path $PSScriptRoot 'verify-google-private.cjs')+'"'
if($Capture){$start.Arguments+=' --capture'}
if($Status){$start.Arguments+=' --status '+$Status}
$start.UseShellExecute=$false; $start.CreateNoWindow=$true; $start.RedirectStandardInput=$true
try { $process=[System.Diagnostics.Process]::Start($start); $process.StandardInput.Write($payload); $process.StandardInput.Close(); $process.WaitForExit(); $code=$process.ExitCode }
finally { [Array]::Clear($privateBytes,0,$privateBytes.Length); $payload=$null }
exit $code
