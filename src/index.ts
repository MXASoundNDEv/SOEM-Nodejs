const native: any = require('../build/Release/soem_addon.node');

export interface NetworkInterface {
  name: string;
  description: string;
}

export class SoemMaster {
  private _m: any;
  constructor(ifname: string = 'eth0') {
    this._m = new native.Master(ifname);
  }
  init(): boolean { return this._m.init(); }
  configInit(): number { return this._m.configInit(); }
  configMapPDO(): void { this._m.configMapPDO(); }
  state(): number { return this._m.state(); }
  readState(): number { return this._m.readState(); }
  sdoRead(slave: number, index: number, sub: number): Buffer { return this._m.sdoRead(slave, index, sub); }
  sdoWrite(slave: number, index: number, sub: number, data: Buffer): boolean { return this._m.sdoWrite(slave, index, sub, data); }
  sendProcessdata(): number { return this._m.sendProcessdata(); }
  receiveProcessdata(): number { return this._m.receiveProcessdata(); }
  close(): void { this._m.close(); }
  
  static listInterfaces(): NetworkInterface[] {
    return native.Master.listInterfaces();
  }
}
