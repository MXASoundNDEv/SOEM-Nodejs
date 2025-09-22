# SOEM-Nodejs

[![CI/CD](https://github.com/MXASoundNDEv/SOEM-Nodejs/actions/workflows/ci.yml/badge.svg)](https://github.com/MXASoundNDEv/SOEM-Nodejs/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/soem-node.svg)](https://badge.fury.io/js/soem-node)
[![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-lightgrey)](https://github.com/MXASoundNDEv/SOEM-Nodejs)
[![Coverage](https://img.shields.io/badge/coverage-38%25-yellow)](./coverage/index.html)

High-performance Node.js bindings for [SOEM (Simple Open EtherCAT Master)](https://github.com/OpenEtherCATsociety/SOEM) featuring automatic network interface discovery and advanced management utilities.

## 🚀 Features

- ✅ **Automatic interface discovery** – finds optimal EtherCAT-capable interfaces
- ✅ **Multi-platform support** – Windows & Linux (x64, arm64)
- ✅ **Full TypeScript definitions** – rich typing & IntelliSense
- ✅ **Modern API** – clean, minimal, predictable
- ✅ **Built‑in utilities** – management & diagnostics helpers
- ✅ **Extensive tests** – unit + integration coverage
- ✅ **Real examples** – practical scripts & guidance

## 📦 Installation

```bash
npm install soem-node
```

### System prerequisites

- **Node.js** >= 18
- **C/C++ toolchain** (MSVC Build Tools on Windows, gcc or clang on Linux)
- **Python** (required by node-gyp)

> CMake is no longer required: the build uses `node-gyp` and `binding.gyp` only.

#### Windows
- **Npcap** (recommended) or **WinPcap** for raw network access
  - Download: https://npcap.com/#download
- **Visual Studio Build Tools** (or full VS install)

#### Linux
- `libpcap-dev` (Ubuntu/Debian) or `libpcap` for your distro
- Proper raw socket permissions (see below)

### Linux capabilities (avoid running as root)

```bash
sudo setcap cap_net_raw,cap_net_admin+eip $(which node)
```

## 🎯 Quick Start

### 1. List interfaces

```js
const { SoemMaster } = require('soem-node');
const interfaces = SoemMaster.listInterfaces();
console.log('Available interfaces:', interfaces);
```

### 2. Automatic master creation

```js
const { EtherCATUtils } = require('soem-node/examples/ethercat-utils');
const master = EtherCATUtils.createMaster();
if (master) {
  try {
    const slaves = master.configInit();
    console.log(`${slaves} EtherCAT slaves detected`);
  } finally {
    master.close();
  }
}
```

### 3. Full communication cycle

```js
const { SoemMaster } = require('soem-node');

async function main() {
  const master = new SoemMaster('eth0'); // or Windows interface name
  if (!master.init()) throw new Error('EtherCAT init failed');
  try {
    const slaves = master.configInit();
    if (slaves > 0) {
      master.configMapPDO();
      for (let i = 0; i < 100; i++) {
        master.sendProcessdata();
        const wkc = master.receiveProcessdata();
        console.log(`Cycle ${i}: WKC=${wkc}`);
        await new Promise(r => setTimeout(r, 10));
      }
      const deviceType = master.sdoRead(1, 0x1000, 0);
      if (deviceType) {
        console.log('Device type:', deviceType.readUInt32LE(0).toString(16));
      }
    }
  } finally {
    master.close();
  }
}

main().catch(console.error);
```

## Manual Build

Build invokes `node-gyp` and auto-generates `ec_options.h` via the script referenced in `binding.gyp` (`scripts/generate-ec-options.js`).

```
npm run build
```

Native binary output: `build/Release/soem_addon.node`.

## Electron Usage

Based on **Node-API (N-API)**: most Electron versions supporting the same N-API level will work without rebuilding. If you encounter an ABI error:

```bash
npm rebuild --runtime=electron --target=30.0.0 --dist-url=https://electronjs.org/headers
```

`electron-builder` config snippet:
```jsonc
{
  "asarUnpack": [
    "node_modules/soem-node/build/Release/*.node"
  ]
}
```

Checklist:
- Install Npcap (Windows) or libpcap (Linux)
- Confirm architecture (x64 / arm64)
- Adjust Linux capabilities (see above)

Reference: https://www.electronjs.org/docs/latest/tutorial/native-code-and-electron

## 🧪 Testing & Quality

### Run tests

```bash
npm test            # basic tests
npm run test:ci     # with coverage
npm run test:watch  # watch mode
npm run test:all    # full suite
npm run lint        # lint
npm run security    # security audit
```

### Coverage

Project maintains strong coverage:
- ✅ Core API unit tests
- ✅ Integration workflows
- ✅ Intelligent mocks for CI
- ✅ Performance & stability checks

### CI/CD

GitHub Actions provides:
- ✅ Cross-platform tests (Windows, Linux)
- ✅ TypeScript + ESLint validation
- ✅ Security audit
- ✅ Multi-platform build
- ✅ Automated npm publish

## 🔧 Development

### Setup

```bash
git clone https://github.com/MXASoundNDEv/SOEM-Nodejs.git
cd SOEM-Nodejs
npm install
npm run build
npm test
```

### Project structure

```
soem-node/
├── src/               # TypeScript source
├── examples/          # Example scripts & helpers
├── test/              # Test suite
├── types/             # Type definitions
├── external/          # SOEM submodule
├── docs/              # Documentation
└── scripts/           # Utility scripts (options generation, release, CI)
```

## Example script

```
node examples/scan-and-read.js eth0
```
Reads slaves, exchanges processdata and reads SDO `0x1000` from slave 1.

## Troubleshooting

| Issue | Hint |
|-------|------|
| Native module not found | Re-run `npm run build`; check `build/Release/soem_addon.node` |
| Build errors | Ensure Python + toolchain present |
| Network access denied | Install Npcap/libpcap & permissions |
| Need rebuild (Electron) | Use `npm rebuild --runtime=electron ...` |
| Low WKC | Check cabling, topology, slave power |

## License

GPL-2.0-or-later. SOEM itself is GPLv2 with exceptions. Shipping prebuilt binaries may require publishing your source. A commercial SOEM license is available for proprietary use.

---

## 📘 Full API (SoemMaster)

This section mirrors the French API doc for convenience. See also `docs/` for background (EtherCAT overview, glossary).

### Contents
1. Overview
2. Import & Typing
3. Lifecycle
4. Summary Table
5. Category Reference
6. Advanced Examples
7. Errors & Diagnostics
8. Performance Best Practices
9. Short FAQ

---
### 1. Overview
`SoemMaster` wraps native SOEM primitives (N-API). Provides:
- Slave discovery & configuration
- PDO mapping and cyclic exchange
- SDO / SoE / EEPROM access
- Low-level frame primitives
- Distributed Clocks (DC) helpers
- Recovery & reconfiguration utilities

### 2. Import & Typing
```ts
import { SoemMaster } from 'soem-node';
interface NetworkInterface { name: string; description: string }
```
CommonJS:
```js
const { SoemMaster } = require('soem-node');
```

### 3. Lifecycle
```
new SoemMaster(ifname) -> init() -> configInit() -> (slaves>0) -> configMapPDO() -> loop: send/receive -> close()
```

### 4. Summary Table
| Method | Returns | Category | Notes |
|--------|---------|----------|-------|
| constructor(ifname?) | instance | Init | Default `eth0` (adjust on Windows) |
| init() | boolean | Init | Opens interface |
| configInit() | number | Discovery | Slave count |
| configMapPDO() | void | PDO | Setup processdata map |
| state() | number | State | Cached value |
| readState() | number | State | Forces refresh |
| sdoRead(slave,i,sub,ca?) | Buffer\|null | SDO | Optional Complete Access |
| sdoWrite(slave,i,sub,data,ca?) | boolean | SDO | Optional Complete Access |
| sendProcessdata() | number | PDO | Cycle send |
| receiveProcessdata() | number | PDO | WKC / bytes |
| writeState(slave,state) | number | State | Workcounter/code |
| stateCheck(slave,req,timeout?) | number | State | Wait for state |
| reconfigSlave(slave,timeout?) | number | Recovery | Reconfigure slave |
| recoverSlave(slave,timeout?) | number | Recovery | >0 success |
| slaveMbxCyclic(slave) | number | Mailbox | Enables cyclic mailbox |
| configDC() | boolean | DC | Enable distributed clocks |
| getSlaves() | any[] | Info | Slave metadata |
| initRedundant(if1,if2) | boolean | Redundancy | Dual interface master |
| configMapGroup(group?) | Buffer\|null | PDO Group | Group mapping |
| sendProcessdataGroup(group?) | number | PDO Group | Group variant |
| receiveProcessdataGroup(group?,timeout?) | number | PDO Group | Group variant |
| mbxHandler(group?,limit?) | number | Mailbox | Mailbox processing |
| elist2string() | string | Diagnostic | Internal error log |
| SoEread(slave,driveNo,flags,idn) | Buffer\|null | SoE | Read element |
| SoEwrite(slave,driveNo,flags,idn,data) | boolean | SoE | Write element |
| readeeprom(slave,addr,timeout?) | number | EEPROM | Read word |
| writeeeprom(slave,addr,data,timeout?) | number | EEPROM | Write word |
| APRD(ADP,ADO,length,timeout?) | Buffer\|null | Low-level | Application Read |
| APWR(ADP,ADO,data,timeout?) | number | Low-level | Application Write |
| LRW(LogAdr,length,buf,timeout?) | number | Low-level | Logical Read/Write |
| LRD(LogAdr,length,timeout?) | Buffer\|null | Low-level | Logical Read |
| LWR(LogAdr,data,timeout?) | number | Low-level | Logical Write |
| dcsync0(slave,act,CyclTime,CyclShift) | boolean | DC | Single cycle sync |
| dcsync01(slave,act,CyclTime0,CyclTime1,CyclShift) | boolean | DC | Dual cycle sync |
| SoemMaster.listInterfaces() | NetworkInterface[] | Utility | Enumerate interfaces |

### 5. Category Reference
#### Initialization & Discovery
`init()`, `configInit()`, `configMapPDO()`, `initRedundant()`.

#### Process Data (PDO / Groups)
`sendProcessdata()`, `receiveProcessdata()`, plus `*Group()` variants for multiple groups / timings.

#### Object Access (SDO / SoE / EEPROM)
Use SDO for dictionary objects, SoE for supported drives, EEPROM for low-level device storage. Optional `ca` (Complete Access) for block reads/writes where supported.

#### State & Recovery
`state()`, `readState()`, `writeState()`, `stateCheck()`, `reconfigSlave()`, `recoverSlave()`. Use `stateCheck` after transitions (e.g. INIT -> PRE-OP -> SAFE-OP -> OP).

#### Distributed Clocks & Sync
`configDC()`, `dcsync0()`, `dcsync01()` for sub-microsecond synchronized cycles. `CyclTime*` are in nanoseconds.

#### Low-level Primitives
`APRD`, `APWR`, `LRW`, `LRD`, `LWR` for diagnostic frames or specialized control flows.

#### Utilities & Diagnostics
`elist2string()` for internal SOEM error/event list, `getSlaves()` for runtime bus inspection, `mbxHandler()` for periodic mailbox processing.

### 6. Advanced Examples
Real-time style loop (~1 kHz):
```js
const master = new SoemMaster('eth0');
if (!master.init()) throw new Error('init failed');
try {
  const slaves = master.configInit();
  if (!slaves) return;
  master.configMapPDO();
  master.configDC();
  const periodUs = 1000; // 1 kHz
  const start = process.hrtime.bigint();
  for (let i = 0; i < 5000; i++) {
    master.sendProcessdata();
    master.receiveProcessdata();
    const target = start + BigInt(i + 1) * BigInt(periodUs) * 1000n;
    while (process.hrtime.bigint() < target) {}
  }
} finally { master.close(); }
```

Batch SDO reads:
```js
function readU32(master, slave, index, sub) {
  const b = master.sdoRead(slave, index, sub);
  return b ? b.readUInt32LE(0) : null;
}
const items = [0x1000, 0x1001, 0x1008];
const results = Object.fromEntries(items.map(i => [i.toString(16), readU32(master, 1, i, 0)]));
```

DC sync enable:
```js
if (master.configDC()) {
  master.dcsync0(1, true, 1_000_000, 0); // 1 ms in ns
}
```

Redundancy:
```js
const redundant = new SoemMaster('eth0');
if (redundant.initRedundant('eth0', 'eth1')) {
  // proceed like a normal master
}
```

### 7. Errors & Diagnostics
- `false` / `null` return => non-fatal failure (e.g., SDO read timeout)
- Exceptions => severe init or binding errors
- Use `elist2string()` after anomalies
- Tune `timeout?` parameters for slower devices
- Abnormal WKC => check cabling, slave power, EMI, network adapter

### 8. Performance Best Practices
- Pre-allocate buffers for repeated `LRW`
- Avoid SDO operations inside tight cyclic loops (do them pre/post cycle)
- Enable DC to reduce jitter
- On Linux consider CPU isolation (isolcpus) & RT scheduling
- On Windows minimize background services on the target core

### 9. Short FAQ
**Q:** Why does `sdoRead` return null? **A:** Slave timeout or invalid index/sub.
**Q:** Need root on Linux? **A:** Not if capabilities are set.
**Q:** Electron support? **A:** Yes via N-API; rebuild only if ABI mismatch.
**Q:** How to debug WKC = 0? **A:** Check physical layer, interface selection, slave power, cabling path.

---
For contributions or deeper protocol background see `docs/`.
