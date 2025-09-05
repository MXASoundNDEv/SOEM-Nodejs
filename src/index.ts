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