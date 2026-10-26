const { spawnSync } = require('node:child_process');
const path = require('node:path');
const read = args => spawnSync('git', args, { encoding: 'utf8' });
const revision = read(['rev-parse', 'HEAD']);
const dirty = read(['status', '--porcelain', '--untracked-files=all']);
if (revision.status !== 0 || dirty.status !== 0 || dirty.stdout.trim()) {
  console.error('Commit the reviewed deployment files first. Deployment requires a clean Git working tree so its build ID identifies the tested code.'); process.exit(1);
}
const result = spawnSync(process.execPath, [path.resolve('node_modules/wrangler/bin/wrangler.js'), 'deploy', '--var', `BUILD_COMMIT:${revision.stdout.trim()}`], { stdio: 'inherit' });
process.exitCode = result.status === 0 ? 0 : 1;
