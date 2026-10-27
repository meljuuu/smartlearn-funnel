// Internal stdin-only uploader. No secret is ever an argument or printed.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
if (process.argv.includes('--check-new')) {
  const result = spawnSync(process.execPath, [path.resolve('node_modules/wrangler/bin/wrangler.js'), 'secret', 'list', '--name', 'smartlearn-funnel'], { encoding: 'utf8' });
  try {
    if (result.status !== 0 || JSON.parse(result.stdout).some(item => item.name === 'APPS_SCRIPT_SECRET')) throw new Error('existing_or_unverified');
    process.exit(0);
  } catch { console.error('Refusing to create or rotate a signing key without its encrypted local recovery copy. The remote key exists or could not be checked. Recover the existing value through the approved Apps Script properties instead.'); process.exit(1); }
}
let secret = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { secret += chunk; });
process.stdin.on('end', () => {
  secret = secret.trim();
  if (!/^[A-Za-z0-9_-]{43}$/.test(secret)) { console.error('Expected a 32-byte base64url signing secret through stdin.'); process.exitCode = 1; return; }
  const result = spawnSync(process.execPath, [path.resolve('node_modules/wrangler/bin/wrangler.js'), 'secret', 'put', 'APPS_SCRIPT_SECRET', '--name', 'smartlearn-funnel'], { input: secret + '\n', encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  for (const output of [result.stdout, result.stderr]) if (output) process.stdout.write(output.split(secret).join('[REDACTED]'));
  process.exitCode = result.status === 0 ? 0 : 1;
});
