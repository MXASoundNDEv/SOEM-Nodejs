#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

console.log('[soem-node] Building native addon with cmake-js...');
const res = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['cmake-js', 'rebuild'], { stdio: 'inherit' });
if (res.status !== 0) {
    console.error('\n[soem-node] Build failed. Ensure you have CMake, a C/C++ toolchain, and libpcap/raw socket perms.');
    process.exit(res.status || 1);
}