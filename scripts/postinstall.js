#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

console.log('[soem-node] Post-install setup...');

// Check and initialize SOEM submodule if needed
const soemPath = path.join(__dirname, '..', 'external', 'soem');
const soemCMake = path.join(soemPath, 'CMakeLists.txt');

if (!fs.existsSync(soemCMake)) {
  console.log('[soem-node] SOEM submodule not found, initializing...');

  // Try to initialize submodule
  const gitRes = spawnSync('git', ['submodule', 'update', '--init', '--recursive'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  if (gitRes.status !== 0) {
    console.log('[soem-node] Git submodule init failed, cloning SOEM directly...');

    // Fallback: clone SOEM directly
    const cloneRes = spawnSync('git', [
      'clone',
      'https://github.com/OpenEtherCATsociety/SOEM.git',
      soemPath
    ], { stdio: 'inherit' });

    if (cloneRes.status !== 0) {
      console.error('[soem-node] Failed to initialize SOEM dependency');
      process.exit(1);
    }
  }

  // Verify SOEM is now available
  if (!fs.existsSync(soemCMake)) {
    console.error('[soem-node] SOEM initialization failed - CMakeLists.txt not found');
    process.exit(1);
  }
}

console.log('[soem-node] Building native addon with cmake-js...');
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const res = spawnSync(cmd, ['cmake-js', 'rebuild'], { stdio: 'inherit' });
if (res.status !== 0) {
  console.error('\n[soem-node] Build failed. Ensure CMake and a C/C++ toolchain are installed.');
  console.error('You can set DEBUG=cmake-js:* for verbose logs.');
  process.exit(res.status || 1);
}
