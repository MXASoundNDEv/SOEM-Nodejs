export type IfName = string;

export interface NetworkInterface {
  name: string;
  description: string;
}

export class SoemMaster {
  constructor(ifname?: IfName);
  init(): boolean;
  configInit(): number;
  configMapPDO(): void;
  state(): number;
  readState(): number;
  sdoRead(slave: number, index: number, sub: number, ca?: boolean): Buffer | null;
  sdoWrite(slave: number, index: number, sub: number, data: Buffer, ca?: boolean): boolean;
  sendProcessdata(): number;
  receiveProcessdata(): number;
  close(): void;
  writeState(slave: number, state: number): number;
  stateCheck(slave: number, reqstate: number, timeout?: number): number;
  reconfigSlave(slave: number, timeout?: number): number;
  recoverSlave(slave: number, timeout?: number): number;
  slaveMbxCyclic(slave: number): number;
  configDC(): boolean;
  getSlaves(): any[];
  initRedundant(if1: string, if2: string): boolean;
  configMapGroup(group?: number): Buffer | null;
  sendProcessdataGroup(group?: number): number;
  receiveProcessdataGroup(group?: number, timeout?: number): number;
  mbxHandler(group?: number, limit?: number): number;
  elist2string(): string;
  SoEread(slave: number, driveNo: number, elementflags: number, idn: number): Buffer | null;
  SoEwrite(slave: number, driveNo: number, elementflags: number, idn: number, data: Buffer): boolean;
  readeeprom(slave: number, eeproma: number, timeout?: number): number;
  writeeeprom(slave: number, eeproma: number, data: number, timeout?: number): number;
  APRD(ADP: number, ADO: number, length: number, timeout?: number): Buffer | null;
  APWR(ADP: number, ADO: number, data: Buffer, timeout?: number): number;
  LRW(LogAdr: number, length: number, buf: Buffer, timeout?: number): number;
  LRD(LogAdr: number, length: number, timeout?: number): Buffer | null;
  LWR(LogAdr: number, data: Buffer, timeout?: number): number;
  dcsync0(slave: number, act: boolean, CyclTime: number, CyclShift: number): boolean;
  dcsync01(slave: number, act: boolean, CyclTime0: number, CyclTime1: number, CyclShift: number): boolean;
  static listInterfaces(): NetworkInterface[];
}
