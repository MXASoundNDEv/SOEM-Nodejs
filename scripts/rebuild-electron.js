#!/usr/bin/env node
/*
  Reconstruit le module natif contre Electron.
  Usage:
    node scripts/rebuild-electron.js 28.2.10   # version d'Electron ciblée
  Variables d'env supportées:
    ELECTRON_VERSION, npm_config_target
*/
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const version = process.argv[2] || process.env.ELECTRON_VERSION || process.env.npm_config_target;
if (!version) {
    console.error("[soem-node] Veuillez fournir la version d'Electron (ex: 30.0.0).");
    console.error('  Ex: node scripts/rebuild-electron.js 30.0.0');
    process.exit(1);
}

console.log(`[soem-node] Rebuild pour Electron v${version}...`);

const isWin = process.platform === 'win32';
const sharedArgs = [
    '--verbose',
    '--runtime=electron',
    `--target=${version}`,
    '--dist-url=https://electronjs.org/headers',
];

const npmArch = process.env.npm_config_arch;
const npmPlatform = process.env.npm_config_platform;
if (npmArch) sharedArgs.push(`--arch=${npmArch}`);
if (npmPlatform) sharedArgs.push(`--platform=${npmPlatform}`);

const localBinary = path.join(
    __dirname,
    '..',
    'node_modules',
    '.bin',
    isWin ? 'node-gyp.cmd' : 'node-gyp',
);

const spawnOptions = {
    stdio: 'inherit',
    encoding: 'utf8',
    shell: isWin,
};

const runNodeGyp = (phase) => {
    const args = [phase, ...sharedArgs];
    let result;

    if (fs.existsSync(localBinary)) {
        result = spawnSync(localBinary, args, spawnOptions);
        if (result.status === 0) {
            return result;
        }
        if (result.error && result.error.code !== 'ENOENT') {
            return result;
        }
    }

    const globalCmd = isWin ? 'node-gyp.cmd' : 'node-gyp';
    result = spawnSync(globalCmd, args, spawnOptions);
    if (result.status === 0) {
        return result;
    }
    if (!result.error || result.error.code !== 'ENOENT') {
        return result;
    }

    result = spawnSync('npx', ['node-gyp', ...args], {
        stdio: 'inherit',
        encoding: 'utf8',
    });
    return result;
};

const fail = (phase, result) => {
    let errorMessage = `[soem-node] Échec de node-gyp ${phase}.`;
    if (result.error) {
        errorMessage += ` ${result.error.message}`;
    } else if (typeof result.status === 'number') {
        errorMessage += ` Code de sortie: ${result.status}.`;
    } else if (result.signal) {
        errorMessage += ` Signal reçu: ${result.signal}.`;
    }

    console.error(errorMessage);
    process.exit(result.status || 1);
};

const configureResult = runNodeGyp('configure');
if (configureResult.status !== 0) {
    fail('configure', configureResult);
}

const buildResult = runNodeGyp('build');
if (buildResult.status !== 0) {
    fail('build', buildResult);
}

console.log('[soem-node] Rebuild Electron terminé.');
process.exit(0);
