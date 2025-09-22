#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

console.log('[soem-node] Post-install setup...');

// Check and initialize SOEM submodule if needed
const soemPath = path.join(__dirname, '..', 'external', 'soem');
const soemCMake = path.join(soemPath, 'CMakeLists.txt');

// If the native addon is already present (packaged), try to load it.
// If it loads, skip heavy work. If it fails to load (ABI/arch mismatch), attempt a rebuild.
const packagedBinary = path.join(__dirname, '..', 'build', 'Release', 'soem_addon.node');
const skipBuildEnv = process.env.SOEM_SKIP_BUILD === '1' || process.env.SOEM_SKIP_BUILD === 'true';
if (fs.existsSync(packagedBinary)) {
  let canUseBinary = false;
  try {
    // Try to load the binary directly to validate ABI/arch compatibility
    require(packagedBinary);
    canUseBinary = true;
  } catch (e) {
    console.warn('[soem-node] Existing binary found but failed to load, will attempt rebuild.');
    console.warn('[soem-node] Error:', e && e.message);
  }
  if (canUseBinary) {
    console.log('[soem-node] Native addon already present and loadable, skipping postinstall build.');
    console.log('[soem-node] Binary path:', packagedBinary);
    process.exit(0);
  } else if (skipBuildEnv) {
    console.warn('[soem-node] Build skipped due to SOEM_SKIP_BUILD env var; the addon may not work until rebuilt.');
    process.exit(0);
  }
}

// Ensure external directory exists before any git operations
fs.mkdirSync(path.join(__dirname, '..', 'external'), { recursive: true });

if (!fs.existsSync(soemCMake)) {
  console.log('[soem-node] SOEM submodule not found, initializing...');

  // Try to initialize submodule (non-destructive). Do not deinit or remove package contents.
  // We run 'git submodule update' if possible, otherwise we clone into a temporary directory and copy files.
  const gitRes = spawnSync('git', ['submodule', 'update', '--init', '--recursive', '--force'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  if (gitRes.status !== 0) {
    console.log('[soem-node] Git submodule init failed, cloning SOEM to a temporary directory...');

    // Create temp dir and clone there to avoid touching package files directly
    let tmpDir = null;
    try {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'soem-'));
    } catch (e) {
      tmpDir = path.join(os.tmpdir(), 'soem-clone');
      try { fs.mkdirSync(tmpDir, { recursive: true }); } catch (__) { /* ignore */ }
    }

    const cloneRes = spawnSync('git', [
      'clone',
      '--depth=1',
      '--branch=master',
      'https://github.com/OpenEtherCATsociety/SOEM.git',
      tmpDir
    ], { stdio: 'inherit' });

    if (cloneRes.status !== 0) {
      console.error('[soem-node] Failed to clone SOEM into temporary directory');
      try {
        const dbg = [
          '[soem-node] Failed to clone SOEM',
          'clone exit code: ' + cloneRes.status,
          'clone error: ' + (cloneRes.error ? cloneRes.error.message : 'none')
        ].join('\n');
        fs.writeFileSync(path.join(__dirname, '..', 'BUILD-FAILED.txt'), dbg, { encoding: 'utf8' });
        console.error('[soem-node] Wrote BUILD-FAILED.txt with debug info. You can initialize the dependency manually.');
      } catch (e) {
        console.error('[soem-node] Could not write BUILD-FAILED.txt:', e && e.message);
      }
      process.exit(0);
    }

    // Copy from tmpDir to soemPath only if target does not already exist, or if missing files
    try {
      // Ensure external directory exists
      fs.mkdirSync(path.dirname(soemPath), { recursive: true });
      // If target doesn't exist, move the clone into place; otherwise copy missing files
      if (!fs.existsSync(soemPath) || fs.readdirSync(soemPath).length === 0) {
        fs.mkdirSync(soemPath, { recursive: true });
        // move by renaming when possible
        try {
          fs.renameSync(tmpDir, soemPath);
          tmpDir = null; // renamed, no need to delete
        } catch (e) {
          // fallback to copy
        }
      }

      // recursive copy helper
      const copyRecursive = (src, dest) => {
        const entries = fs.readdirSync(src, { withFileTypes: true });
        fs.mkdirSync(dest, { recursive: true });
        for (const ent of entries) {
          const s = path.join(src, ent.name);
          const d = path.join(dest, ent.name);
          if (ent.isDirectory()) {
            copyRecursive(s, d);
          } else if (ent.isSymbolicLink()) {
            try {
              const link = fs.readlinkSync(s);
              try { fs.symlinkSync(link, d); } catch (_) { /* ignore */ }
            } catch (_) { /* ignore */ }
          } else {
            try { fs.copyFileSync(s, d); } catch (_) { /* ignore */ }
          }
        }
      };

      if (tmpDir) {
        copyRecursive(tmpDir, soemPath);
      }

    } catch (e) {
      console.error('[soem-node] Error copying SOEM into package:', e && e.message);
      try {
        fs.writeFileSync(path.join(__dirname, '..', 'BUILD-FAILED.txt'), '[soem-node] Error copying SOEM into package: ' + (e && e.message), { encoding: 'utf8' });
      } catch (_) { /* ignore */ }
      // continue without failing install
    } finally {
      // cleanup tmpDir if present
      if (tmpDir && fs.existsSync(tmpDir)) {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) { /* ignore */ }
      }
    }
  }

  // Verify SOEM is now available
  if (!fs.existsSync(soemCMake)) {
    console.error('[soem-node] SOEM initialization failed - CMakeLists.txt not found');
    try {
      fs.writeFileSync(path.join(__dirname, '..', 'BUILD-FAILED.txt'), '[soem-node] SOEM initialization failed - CMakeLists.txt not found', { encoding: 'utf8' });
      console.error('[soem-node] Wrote BUILD-FAILED.txt with debug info.');
    } catch (e) {
      console.error('[soem-node] Could not write BUILD-FAILED.txt:', e && e.message);
    }
    process.exit(0);
  }

  console.log('[soem-node] SOEM successfully initialized');
}

console.log('[soem-node] Building native addon with node-gyp...');

// Détection Electron: npm_config_runtime = 'electron' et/ou npm_config_target = version
const npmRuntime = process.env.npm_config_runtime || '';
const npmTarget = process.env.npm_config_target || process.env.ELECTRON_VERSION || '';
const isElectron = npmRuntime.toLowerCase() === 'electron' || !!process.versions.electron;

const sharedArgs = ['--verbose'];
const npmArch = process.env.npm_config_arch;
const npmPlatform = process.env.npm_config_platform;
if (npmArch) sharedArgs.push(`--arch=${npmArch}`);
if (npmPlatform) sharedArgs.push(`--platform=${npmPlatform}`);

if (isElectron) {
  if (npmTarget) {
    sharedArgs.push(`--target=${npmTarget}`);
  }
  sharedArgs.push('--runtime=electron', '--dist-url=https://electronjs.org/headers');
}

const runNodeGyp = (phase, extraArgs = []) => {
  const args = [phase, ...sharedArgs, ...extraArgs];
  const isWin = process.platform === 'win32';
  const localBinary = path.join(
    __dirname,
    '..',
    'node_modules',
    '.bin',
    isWin ? 'node-gyp.cmd' : 'node-gyp'
  );

  const spawnOpts = {
    stdio: 'inherit',
    encoding: 'utf8',
    shell: isWin
  };

  let result;
  if (fs.existsSync(localBinary)) {
    result = spawnSync(localBinary, args, spawnOpts);
    if (result.status === 0) {
      return result;
    }
    if (result.error && result.error.code !== 'ENOENT') {
      return result;
    }
  }

  const globalCmd = isWin ? 'node-gyp.cmd' : 'node-gyp';
  result = spawnSync(globalCmd, args, spawnOpts);
  if (result.status === 0) {
    return result;
  }
  if (!result.error || result.error.code !== 'ENOENT') {
    return result;
  }

  // Fallback to npx if direct binary failed
  result = spawnSync('npx', ['node-gyp', ...args], {
    stdio: 'inherit',
    encoding: 'utf8'
  });
  return result;
};

const handleFailure = (phase, result) => {
  console.error(`\n[soem-node] node-gyp ${phase} failed. Ensure Python and a C/C++ toolchain are installed.`);

  const debugLines = [
    '[soem-node] Debug information:',
    `- Phase: ${phase}`,
    '- Platform: ' + process.platform,
    '- Node version: ' + process.version,
    '- Working directory: ' + process.cwd(),
    '- SOEM path exists: ' + fs.existsSync(soemPath),
    '- CMakeLists.txt exists: ' + fs.existsSync(soemCMake),
    '- Exit code: ' + result.status,
    '- Signal: ' + result.signal,
  ];
  if (result.error) {
    debugLines.push('- Error: ' + result.error.message);
    debugLines.push('- Error code: ' + result.error.code);
  }
  debugLines.push('\n[soem-node] Installation did not complete native build. You can run `npm run build` in the package root or follow the README for manual build steps.');

  debugLines.forEach(l => console.error(l));
  try {
    fs.writeFileSync(path.join(__dirname, '..', 'BUILD-FAILED.txt'), debugLines.join('\n'), { encoding: 'utf8' });
    console.error('[soem-node] Wrote BUILD-FAILED.txt with debug info.');
  } catch (e) {
    console.error('[soem-node] Could not write BUILD-FAILED.txt:', e && e.message);
  }

  process.exit(0);
};

const configureResult = runNodeGyp('configure');
if (configureResult.status !== 0) {
  handleFailure('configure', configureResult);
}

const buildResult = runNodeGyp('build');
if (buildResult.status !== 0) {
  handleFailure('build', buildResult);
}

console.log('[soem-node] Build completed successfully!');
