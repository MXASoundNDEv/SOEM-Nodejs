# soem-node — Bindings N-API pour SOEM (EtherCAT Master)

Ce dépôt te donne un squelette complet pour publier un package NPM qui wrappe **SOEM** (bibliothèque C) via **Node-API (N-API)**. Il se construit avec **cmake-js** et inclut des typings TypeScript.

> Compatible Linux x64/arm64 (RAW Ethernet requis). Windows/macOS possibles mais non testés ici.

---

## Arborescence

```
soem-node/
├─ package.json
├─ CMakeLists.txt
├─ cmake-js.json
├─ binding.gyp            # (facultatif, si tu préfères node-gyp)
├─ src/
│  ├─ addon.cc            # colle N-API <-> SOEM
│  ├─ soem_wrap.hpp
│  └─ index.ts            # API JS/TS publique
├─ types/
│  └─ index.d.ts
├─ external/
│  └─ soem/               # submodule Git du repo SOEM
├─ scripts/
│  └─ postinstall.js      # build auto à l'installation
├─ examples/
│  └─ scan-and-read.js
├─ LICENSE
└─ README.md
```

---

## package.json

```json
{
  "name": "soem-node",
  "version": "0.1.0",
  "description": "Bindings Node-API pour SOEM (Simple Open EtherCAT Master)",
  "main": "dist/index.js",
  "types": "types/index.d.ts",
  "scripts": {
    "build": "tsc && cmake-js rebuild",
    "install": "node scripts/postinstall.js",
    "prepare": "npm run build",
    "example": "node examples/scan-and-read.js"
  },
  "gypfile": false,
  "engines": { "node": ">=18" },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "cmake-js": "^7.3.0",
    "node-addon-api": "^8.0.0",
    "typescript": "^5.6.0"
  },
  "dependencies": {},
  "os": ["linux", "darwin", "win32"],
  "cpu": ["x64", "arm64"],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/ton-org/soem-node.git"
  },
  "keywords": ["ethercat", "soem", "fieldbus", "industrial"],
  "license": "GPL-2.0-or-later"
}
```

> ⚠️ Choisis une licence compatible avec SOEM (GPLv2 avec exceptions). Si tu vises un usage propriétaire, prendre une licence commerciale SOEM et adapte le champ `license`.

---

## cmake-js.json

```json
{
  "runtime": "node",
  "arch": "x64",
  "CMAKE_BUILD_PARALLEL_LEVEL": "8",
  "variables": {
    "CMAKE_POSITION_INDEPENDENT_CODE": "ON"
  }
}
```

---

## CMakeLists.txt

```cmake
cmake_minimum_required(VERSION 3.18)
project(soem_node LANGUAGES C CXX)

set(CMAKE_C_STANDARD 99)
set(CMAKE_CXX_STANDARD 17)

# Node-API include dirs
execute_process(COMMAND node -p "require('node-addon-api').include" OUTPUT_VARIABLE NAPI_DIR)
string(REGEX REPLACE "\n$" "" NAPI_DIR "${NAPI_DIR}")

# SOEM en sous-module
add_subdirectory(external/soem EXCLUDE_FROM_ALL)

# Addon
add_library(soem_addon MODULE src/addon.cc)

# Définitions pour Linux/raw socket
if(UNIX AND NOT APPLE)
  target_link_libraries(soem_addon PRIVATE soem rt pthread)
else()
  target_link_libraries(soem_addon PRIVATE soem)
endif()

# Include paths
target_include_directories(soem_addon PRIVATE ${NAPI_DIR} external/soem/soem)

# Nom du module .node
set_target_properties(soem_addon PROPERTIES
  PREFIX ""
  OUTPUT_NAME "soem_addon"
)
```

---

## src/soem_wrap.hpp

```cpp
#pragma once
#include <napi.h>
extern "C" {
  #include "ethercat.h"
}

namespace soemnode {

class Master : public Napi::ObjectWrap<Master> {
public:
  static Napi::Function Init(Napi::Env env);
  Master(const Napi::CallbackInfo& info);

private:
  // méthodes exposées
  Napi::Value init(const Napi::CallbackInfo& info);
  Napi::Value configInit(const Napi::CallbackInfo& info);
  Napi::Value configMapPDO(const Napi::CallbackInfo& info);
  Napi::Value state(const Napi::CallbackInfo& info);
  Napi::Value readState(const Napi::CallbackInfo& info);
  Napi::Value sdoRead(const Napi::CallbackInfo& info);
  Napi::Value sdoWrite(const Napi::CallbackInfo& info);
  Napi::Value sendProcessdata(const Napi::CallbackInfo& info);
  Napi::Value receiveProcessdata(const Napi::CallbackInfo& info);
  Napi::Value close(const Napi::CallbackInfo& info);

  // champs
  std::string ifname_;
  bool opened_ = false;
};

}
```

---

## src/addon.cc

```cpp
#include "soem_wrap.hpp"
#include <cstring>

using namespace Napi;
using namespace soemnode;

static FunctionReference masterCtor;

Master::Master(const CallbackInfo& info) : ObjectWrap<Master>(info) {
  Env env = info.Env();
  if (info.Length() > 0 && info[0].IsString()) {
    ifname_ = info[0].As<String>().Utf8Value();
  } else {
    ifname_ = "eth0";
  }
}

Value Master::init(const CallbackInfo& info) {
  Env env = info.Env();
  if(opened_) return Boolean::New(env, true);
  if(ec_init(ifname_.c_str())) { opened_ = true; return Boolean::New(env, true);}
  return Boolean::New(env, false);
}

Value Master::configInit(const CallbackInfo& info) {
  Env env = info.Env();
  if(!opened_) return Boolean::New(env, false);
  int slaves = ec_config_init(FALSE);
  return Number::New(env, slaves);
}

Value Master::configMapPDO(const CallbackInfo& info) {
  Env env = info.Env();
  ec_config_map(&ec_slave[0].userdata);
  ec_configdc();
  return env.Undefined();
}

Value Master::state(const CallbackInfo& info) {
  Env env = info.Env();
  return Number::New(env, ec_slave[0].state);
}

Value Master::readState(const CallbackInfo& info) {
  Env env = info.Env();
  ec_readstate();
  return Number::New(env, ec_slave[0].state);
}

Value Master::sdoRead(const CallbackInfo& info) {
  Env env = info.Env();
  if (info.Length() < 3) return env.Null();
  uint16 slave = info[0].As<Number>().Uint32Value();
  uint16 index = info[1].As<Number>().Uint32Value();
  uint8 subidx = info[2].As<Number>().Uint32Value();
  uint8 buf[512]; int sz = sizeof(buf);
  int wkc = ec_SDOread(slave, index, subidx, FALSE, &sz, buf, EC_TIMEOUTRXM);
  if(wkc <= 0) return env.Null();
  return Buffer<uint8_t>::Copy(env, buf, sz);
}

Value Master::sdoWrite(const CallbackInfo& info) {
  Env env = info.Env();
  if (info.Length() < 4) return Boolean::New(env, false);
  uint16 slave = info[0].As<Number>().Uint32Value();
  uint16 index = info[1].As<Number>().Uint32Value();
  uint8 subidx = info[2].As<Number>().Uint32Value();
  Buffer<uint8_t> data = info[3].As<Buffer<uint8_t>>();
  int sz = data.Length();
  int wkc = ec_SDOwrite(slave, index, subidx, FALSE, sz, data.Data(), EC_TIMEOUTRXM);
  return Boolean::New(env, wkc > 0);
}

Value Master::sendProcessdata(const CallbackInfo& info) {
  int wkc = ec_send_processdata();
  return Number::New(info.Env(), wkc);
}

Value Master::receiveProcessdata(const CallbackInfo& info) {
  int wkc = ec_receive_processdata(EC_TIMEOUTRET);
  return Number::New(info.Env(), wkc);
}

Value Master::close(const CallbackInfo& info) {
  if(opened_) { ec_close(); opened_ = false; }
  return info.Env().Undefined();
}

Function Master::Init(Env env) {
  Function func = DefineClass(env, "Master", {
    InstanceMethod("init", &Master::init),
    InstanceMethod("configInit", &Master::configInit),
    InstanceMethod("configMapPDO", &Master::configMapPDO),
    InstanceMethod("state", &Master::state),
    InstanceMethod("readState", &Master::readState),
    InstanceMethod("sdoRead", &Master::sdoRead),
    InstanceMethod("sdoWrite", &Master::sdoWrite),
    InstanceMethod("sendProcessdata", &Master::sendProcessdata),
    InstanceMethod("receiveProcessdata", &Master::receiveProcessdata),
    InstanceMethod("close", &Master::close)
  });
  masterCtor = Persistent(func);
  masterCtor.SuppressDestruct();
  return func;
}

Object InitAll(Env env, Object exports) {
  exports.Set("Master", Master::Init(env));
  return exports;
}

NODE_API_MODULE(soem_addon, InitAll)
```

---

## src/index.ts

```ts
import { join } from "node:path";
import { createRequire } from "node:module";

// Charge le module natif .node créé par cmake-js
const require = createRequire(import.meta.url);
const native = require("../build/Release/soem_addon.node");

export type IfName = string; // ex: "eth0" ou "enp3s0"

export class SoemMaster {
  private _m: any;
  constructor(ifname: IfName = "eth0") {
    this._m = new native.Master(ifname);
  }
  init() { return this._m.init(); }
  configInit(): number { return this._m.configInit(); }
  configMapPDO(): void { this._m.configMapPDO(); }
  state(): number { return this._m.state(); }
  readState(): number { return this._m.readState(); }
  sdoRead(slave: number, index: number, sub: number): Buffer { return this._m.sdoRead(slave, index, sub); }
  sdoWrite(slave: number, index: number, sub: number, data: Buffer): boolean { return this._m.sdoWrite(slave, index, sub, data); }
  sendProcessdata(): number { return this._m.sendProcessdata(); }
  receiveProcessdata(): number { return this._m.receiveProcessdata(); }
  close(): void { this._m.close(); }
}
```

---

## types/index.d.ts

```ts
export type IfName = string;
export class SoemMaster {
  constructor(ifname?: IfName);
  init(): boolean;
  configInit(): number;
  configMapPDO(): void;
  state(): number;
  readState(): number;
  sdoRead(slave: number, index: number, sub: number): Buffer | null;
  sdoWrite(slave: number, index: number, sub: number, data: Buffer): boolean;
  sendProcessdata(): number;
  receiveProcessdata(): number;
  close(): void;
}
```

---

## scripts/postinstall.js

```js
#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

console.log('[soem-node] Building native addon with cmake-js...');
const res = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['cmake-js', 'rebuild'], { stdio: 'inherit' });
if (res.status !== 0) {
  console.error('\n[soem-node] Build failed. Ensure you have CMake, a C/C++ toolchain, and libpcap/raw socket perms.');
  process.exit(res.status || 1);
}
```

---

## examples/scan-and-read.js

```js
const { SoemMaster } = require('../dist');

async function main() {
  const m = new SoemMaster(process.argv[2] || 'eth0');
  if (!m.init()) throw new Error('ec_init failed');

  const slaves = m.configInit();
  console.log('Slaves detected:', slaves);

  m.configMapPDO();

  // Boucle de processdata (demo)
  for (let i = 0; i < 1000; i++) {
    m.sendProcessdata();
    const wkc = m.receiveProcessdata();
    if (i % 100 === 0) console.log('WKC', wkc, 'state', m.readState());
  }

  // Exemple SDO read: index 0x1000 (Device Type) du slave 1
  const buf = m.sdoRead(1, 0x1000, 0);
  if (buf) console.log('SDO 0x1000:', buf);

  m.close();
}

main().catch(e => { console.error(e); process.exit(1); });
```

---

## README.md (extraits)

```md
# soem-node

Bindings Node-API pour [SOEM]. Nécessite l'accès RAW Ethernet (exécuté en root ou avec CAP_NET_RAW/CAP_NET_ADMIN).

## Prérequis
- Node.js >= 18, npm
- CMake >= 3.18, toolchain C/C++
- Linux: permissions RAW (ex: `sudo setcap cap_net_raw,cap_net_admin+eip $(which node)`).

## Installation
```bash
npm i soem-node
# ou, en dev local
git submodule update --init --recursive
npm run build
```

## Usage
```js
const { SoemMaster } = require('soem-node');
const m = new SoemMaster('enp3s0');
if(!m.init()) throw new Error('init failed');
const n = m.configInit();
console.log('slaves:', n);
```
```

---

## Initialiser le submodule SOEM

```bash
git submodule add https://github.com/OpenEtherCATsociety/SOEM.git external/soem
```

---

## Remarques
- Cette API est volontairement *proche* de la C-API SOEM. On pourra ajouter des helpers de haut niveau (mapping PDO typé, discovery avec ESI, watchdog, etc.).
- Pour Windows/macOS, ajuste `target_link_libraries` (WinPcap/Npcap sous Windows; pas de RAW frames standard sous macOS).
- Pour publier sur NPM avec binaires précompilés: intègre `prebuildify`/`node-pre-gyp`.
- Tests à ajouter (Jest) + CI (GitHub Actions) pour build matrix (linux-x64, linux-arm64).

