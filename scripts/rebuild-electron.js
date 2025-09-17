#!/usr/bin/env node
/*
  Reconstruit le module natif contre Electron.
  Usage:
    node scripts/rebuild-electron.js 28.2.10   # version d'Electron ciblée
  Variables d'env supportées:
    ELECTRON_VERSION, npm_config_target
*/
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const version = process.argv[2] || process.env.ELECTRON_VERSION || process.env.npm_config_target;
if (!version) {
    console.error('[soem-node] Veuillez fournir la version d\'Electron (ex: 30.0.0).');
    console.error('  Ex: node scripts/rebuild-electron.js 30.0.0');
    process.exit(1);
}

console.log(`[soem-node] Rebuild pour Electron v${version}...`);

const isWin = process.platform === 'win32';
const cmakeJs = isWin
    ? path.join(__dirname, '..', 'node_modules', '.bin', 'cmake-js.cmd')
    : 'npx';

const args = isWin
    ? ['rebuild', '--runtime=electron', `--runtimeVersion=${version}`, '--loglevel=verbose']
    : ['cmake-js', 'rebuild', '--runtime=electron', `--runtimeVersion=${version}`, '--loglevel=verbose'];

const res = spawnSync(cmakeJs, args, { stdio: 'inherit', shell: isWin });
process.exit(res.status || 0);
