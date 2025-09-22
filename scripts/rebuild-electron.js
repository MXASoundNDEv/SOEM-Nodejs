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
    console.error("[soem-node] Veuillez fournir la version d'Electron (ex: 30.0.0).");
    console.error('  Ex: node scripts/rebuild-electron.js 30.0.0');
    process.exit(1);
}

console.log(`[soem-node] Rebuild pour Electron v${version}...`);

const isWin = process.platform === 'win32';
const sharedArgs = ['--runtime=electron', `--runtimeVersion=${version}`, '--loglevel=verbose'];
const localBinary = path.join(
    __dirname,
    '..',
    'node_modules',
    '.bin',
    isWin ? 'cmake-js.cmd' : 'cmake-js',
);

const spawnOptions = {
    stdio: 'pipe',
    shell: isWin,
};

const pipeResult = (result) => {
    if (result.stdout?.length) {
        process.stdout.write(result.stdout);
    }
    if (result.stderr?.length) {
        process.stderr.write(result.stderr);
    }
};

const formatCommand = (command, args) => [command, ...args].join(' ');

const handleFailure = (commandLabel, result) => {
    let errorMessage = `[soem-node] Échec de l'exécution de ${commandLabel}.`;
    if (result.error) {
        errorMessage += ` ${result.error.message}`;
    } else if (typeof result.status === 'number') {
        errorMessage += ` Code de sortie: ${result.status}.`;
    } else if (result.signal) {
        errorMessage += ` Signal reçu: ${result.signal}.`;
    }

    const stderrOutput = result.stderr?.toString();
    if (stderrOutput) {
        errorMessage += `\n--- stderr ---\n${stderrOutput.trimEnd()}`;
    }

    console.error(errorMessage);
    process.exit(result.status || 1);
};

const execute = (command, args) => {
    const result = spawnSync(command, args, spawnOptions);
    pipeResult(result);
    return result;
};

if (isWin) {
    const args = ['rebuild', ...sharedArgs];
    const result = execute(localBinary, args);
    if (result.error || result.status !== 0) {
        handleFailure(formatCommand(localBinary, args), result);
    }
    process.exit(0);
}

const npxArgs = ['cmake-js', 'rebuild', ...sharedArgs];
let result = execute('npx', npxArgs);

if (result.error?.code === 'ENOENT') {
    console.warn("[soem-node] 'npx' est indisponible, tentative avec le binaire local cmake-js.");
    const directArgs = ['rebuild', ...sharedArgs];
    result = execute(localBinary, directArgs);
    if (result.error || result.status !== 0) {
        handleFailure(formatCommand(localBinary, directArgs), result);
    }
    process.exit(0);
}

if (result.error || result.status !== 0) {
    handleFailure(formatCommand('npx', npxArgs), result);
}

process.exit(0);
