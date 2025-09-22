#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

if (process.argv.length < 4) {
  console.error('[generate-ec-options] Usage: node generate-ec-options.js <input> <output>');
  process.exit(1);
}

const inputPath = process.argv[2];
const outputPath = process.argv[3];

const defaults = {
  EC_BUFSIZE: 'EC_MAXECATFRAME',
  EC_MAXBUF: '16',
  EC_MAXEEPBITMAP: '128',
  EC_MAXEEPBUF: 'EC_MAXEEPBITMAP << 5',
  EC_LOGGROUPOFFSET: '16',
  EC_MAXELIST: '64',
  EC_MAXNAME: '40',
  EC_MAXSLAVE: '200',
  EC_MAXGROUP: '2',
  EC_MAXIOSEGMENTS: '64',
  EC_MAXMBX: '1486',
  EC_MBXPOOLSIZE: '32',
  EC_MAXEEPDO: '0x200',
  EC_MAXSM: '8',
  EC_MAXFMMU: '4',
  EC_MAXLEN_ADAPTERNAME: '128',
  EC_MAX_MAPT: '1',
  EC_MAXODLIST: '1024',
  EC_MAXOELIST: '256',
  EC_SOE_MAXNAME: '60',
  EC_SOE_MAXMAPPING: '64',
  EC_TIMEOUTRET: '2000',
  EC_TIMEOUTRET3: 'EC_TIMEOUTRET * 3',
  EC_TIMEOUTSAFE: '20000',
  EC_TIMEOUTEEP: '20000',
  EC_TIMEOUTTXM: '20000',
  EC_TIMEOUTRXM: '700000',
  EC_TIMEOUTSTATE: '2000000',
  EC_DEFAULTRETRIES: '3',
  EC_PRIMARY_MAC_ARRAY: '{0x0101, 0x0101, 0x0101}',
  EC_SECONDARY_MAC_ARRAY: '{0x0404, 0x0404, 0x0404}'
};

const input = fs.readFileSync(inputPath, 'utf8');
const outputDir = path.dirname(outputPath);
fs.mkdirSync(outputDir, { recursive: true });

const result = input.replace(/@([A-Z0-9_]+)@/g, (match, name) => {
  if (!(name in defaults)) {
    console.error(`[generate-ec-options] Missing default for ${name}`);
    process.exit(1);
  }
  return defaults[name];
});

fs.writeFileSync(outputPath, result, 'utf8');
