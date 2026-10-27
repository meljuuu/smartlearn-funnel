const readline = require('node:readline');
const { Writable } = require('node:stream');
const { bridge } = require('../server/gateway.cjs');
const { verifyAdapter } = require('../server/verify-google.cjs');
async function prompt(label, hidden = false) {
  if (!process.stdin.isTTY) throw new Error('Run this command in your own interactive terminal; never supply a secret on the command line.');
  process.stdout.write(label);
  const output = new Writable({ write(chunk, encoding, callback) { if (!hidden) process.stdout.write(chunk); callback(); } });
  const reader = readline.createInterface({ input: process.stdin, output, terminal: true });
  return new Promise((resolve, reject) => {
    reader.once('line', value => { reader.close(); if (hidden) process.stdout.write('\n'); resolve(value.trim()); });
    reader.once('SIGINT', () => { reader.close(); reject(new Error('Cancelled.')); });
  });
}
(async () => {
  const url = await prompt('Apps Script /exec URL: ');
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) throw new Error('Use the versioned Apps Script web-app /exec URL.');
  const secret = await prompt('APPS_SCRIPT_SECRET (hidden input, from your password manager): ', true);
  if (secret.length < 32) throw new Error('The signing secret must be at least 32 characters.');
  const settings = { APPS_SCRIPT_URL: url, APPS_SCRIPT_SECRET: secret };
  if (process.argv.includes('--status')) {
    const requestId = process.argv[process.argv.indexOf('--status') + 1];
    if (!require('../shared/core.cjs').uuid.test(requestId || '')) throw new Error('Supply the opaque request UUID after --status.');
    const status = await bridge('status', { lead: { request_id: requestId }, clientKey: 'synthetic-verification' }, settings);
    console.log(JSON.stringify(status, null, 2)); return;
  }
  const result = await verifyAdapter((action, payload) => bridge(action, payload, settings), process.argv.includes('--capture'));
  console.log(JSON.stringify(result, null, 2)); // Only flags, counts and opaque test IDs.
})().catch(error => { console.error('Verification failed:', error.message); if (error.requestId) console.error('Reconcile this opaque request ID before another test:', error.requestId); process.exitCode = 1; });
