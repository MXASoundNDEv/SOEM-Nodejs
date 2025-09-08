#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

console.log('[soem-node] Post-install setup...');

// Check and initialize SOEM submodule if needed
const soemPath = path.join(__dirname, '..', 'external', 'soem');
const soemCMake = path.join(soemPath, 'CMakeLists.txt');
const darwinCMake = path.join(soemPath, 'cmake', 'Darwin.cmake');

if (!fs.existsSync(soemCMake)) {
  console.log('[soem-node] SOEM submodule not found, initializing...');

  // Try to initialize submodule with fresh start
  console.log('[soem-node] Cleaning any existing submodule...');
  spawnSync('git', ['submodule', 'deinit', '-f', 'external/soem'], {
    stdio: 'pipe',
    cwd: path.join(__dirname, '..')
  });

  // Try to initialize submodule
  const gitRes = spawnSync('git', ['submodule', 'update', '--init', '--recursive', '--force'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  if (gitRes.status !== 0) {
    console.log('[soem-node] Git submodule init failed, cloning SOEM directly...');

    // Remove any partial directory
    if (fs.existsSync(soemPath)) {
      fs.rmSync(soemPath, { recursive: true, force: true });
    }

    // Fallback: clone SOEM directly
    const cloneRes = spawnSync('git', [
      'clone',
      '--depth=1',
      '--branch=master',
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

  console.log('[soem-node] SOEM successfully initialized');
}

// Create Darwin.cmake if missing (for macOS support)
if (!fs.existsSync(darwinCMake)) {
  console.log('[soem-node] Creating Darwin.cmake for macOS support...');
  const linuxCMake = path.join(soemPath, 'cmake', 'Linux.cmake');

  if (fs.existsSync(linuxCMake)) {
    // Copy Linux.cmake to Darwin.cmake
    let darwinContent = fs.readFileSync(linuxCMake, 'utf8');

    // Remove rt library dependency for macOS (not available on macOS)
    darwinContent = darwinContent.replace(
      'target_link_libraries(soem PUBLIC pthread rt)',
      'target_link_libraries(soem PUBLIC pthread)'
    );

    // Add comment about macOS
    darwinContent = darwinContent.replace(
      '# This software is dual-licensed under GPLv3 and a commercial',
      '# macOS (Darwin) configuration - based on Linux with modifications\n# This software is dual-licensed under GPLv3 and a commercial'
    );

    fs.writeFileSync(darwinCMake, darwinContent);
    console.log('[soem-node] Darwin.cmake created successfully');
  } else {
    console.warn('[soem-node] Warning: Could not create Darwin.cmake (Linux.cmake not found)');
  }
}

console.log('[soem-node] Building native addon with cmake-js...');

// Try different approaches for running cmake-js
let res;
if (process.platform === 'win32') {
  // On Windows, use the .cmd file directly
  res = spawnSync(path.join(__dirname, '..', 'node_modules', '.bin', 'cmake-js.cmd'), [
    'rebuild',
    '--loglevel=verbose'
  ], {
    stdio: 'inherit',
    encoding: 'utf8',
    shell: true
  });
} else {
  // On Unix-like systems, use npx directly
  res = spawnSync('npx', ['cmake-js', 'rebuild', '--loglevel=verbose'], {
    stdio: 'inherit',
    encoding: 'utf8'
  });
}

if (res.status !== 0) {
  console.error('\n[soem-node] Build failed. Ensure CMake and a C/C++ toolchain are installed.');
  console.error('You can set DEBUG=cmake-js:* for verbose logs.');

  // Additional debug information
  console.error('\n[soem-node] Debug information:');
  console.error('- Platform:', process.platform);
  console.error('- Node version:', process.version);
  console.error('- Working directory:', process.cwd());
  console.error('- SOEM path exists:', fs.existsSync(soemPath));
  console.error('- CMakeLists.txt exists:', fs.existsSync(soemCMake));
  console.error('- Darwin.cmake exists:', fs.existsSync(darwinCMake));
  console.error('- Exit code:', res.status);
  console.error('- Signal:', res.signal);
  if (res.error) {
    console.error('- Error:', res.error.message);
    console.error('- Error code:', res.error.code);
  }

  process.exit(res.status || 1);
}

console.log('[soem-node] Build completed successfully!');
