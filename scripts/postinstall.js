#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

console.log('[soem-node] Building native addon with cmake-js...');
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const res = spawnSync(cmd, ['cmake-js', 'rebuild'], { stdio: 'inherit' });
if (res.status !== 0) {
  console.error('\n[soem-node] Build failed. Ensure CMake and a C/C++ toolchain are installed.');
  console.error('You can set DEBUG=cmake-js:* for verbose logs.');
  process.exit(res.status || 1);
}
