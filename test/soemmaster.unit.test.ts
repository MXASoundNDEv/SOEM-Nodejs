/**
 * Unit tests for SoemMaster JS wrapper.
 * The native addon is fully mocked so tests run without hardware.
 */

// Spies that the mock will use
const initMock = jest.fn(() => true);
const configInitMock = jest.fn(() => 2);
const configMapPDOMock = jest.fn(() => undefined);
const stateMock = jest.fn(() => 4);
const readStateMock = jest.fn(() => 4);
const sdoReadMock = jest.fn(() => Buffer.from([0x01, 0x02]));
const sdoWriteMock = jest.fn(() => true);
const sendPDMock = jest.fn(() => 123);
const receivePDMock = jest.fn(() => 1);
const closeMock = jest.fn(() => undefined);
const writeStateMock = jest.fn(() => 5);
const stateCheckMock = jest.fn(() => 5);
const reconfigSlaveMock = jest.fn(() => 1);
const recoverSlaveMock = jest.fn(() => 1);
const slaveMbxCyclicMock = jest.fn(() => 0);
const configDCMock = jest.fn(() => true);
const getSlavesMock = jest.fn(() => [{ name: 'slave1' }] );
const initRedundantMock = jest.fn(() => true);
const configMapGroupMock = jest.fn(() => Buffer.from([0x00]));
const sendProcessdataGroupMock = jest.fn(() => 10);
const receiveProcessdataGroupMock = jest.fn(() => 11);
const mbxHandlerMock = jest.fn(() => 0);
const elist2stringMock = jest.fn(() => 'no errors');
const SoEreadMock = jest.fn(() => Buffer.from([0xAA]));
const SoEwriteMock = jest.fn(() => true);
const readeepromMock = jest.fn(() => 0);
const writeeepromMock = jest.fn(() => 0);
const APRDMock = jest.fn(() => Buffer.from([0x10]));
const APWRMock = jest.fn(() => 1);
const LRWMock = jest.fn(() => 2);
const LRDMock = jest.fn(() => Buffer.from([0x20]));
const LWRMock = jest.fn(() => 3);
const dcsync0Mock = jest.fn(() => true);
const dcsync01Mock = jest.fn(() => true);
const listInterfacesMock = jest.fn(() => [{ name: 'eth0', description: 'mock' }]);

// Mock the native addon module used by src/index.ts
jest.mock('../build/Release/soem_addon.node', () => {
  // constructor spy
  const ctor = jest.fn().mockImplementation(() => ({
    init: initMock,
    configInit: configInitMock,
    configMapPDO: configMapPDOMock,
    state: stateMock,
    readState: readStateMock,
    sdoRead: sdoReadMock,
    sdoWrite: sdoWriteMock,
    sendProcessdata: sendPDMock,
    receiveProcessdata: receivePDMock,
    close: closeMock,
    writeState: writeStateMock,
    stateCheck: stateCheckMock,
    reconfigSlave: reconfigSlaveMock,
    recoverSlave: recoverSlaveMock,
    slaveMbxCyclic: slaveMbxCyclicMock,
    configDC: configDCMock,
    getSlaves: getSlavesMock,
    initRedundant: initRedundantMock,
    configMapGroup: configMapGroupMock,
    sendProcessdataGroup: sendProcessdataGroupMock,
    receiveProcessdataGroup: receiveProcessdataGroupMock,
    mbxHandler: mbxHandlerMock,
    elist2string: elist2stringMock,
    SoEread: SoEreadMock,
    SoEwrite: SoEwriteMock,
    readeeprom: readeepromMock,
    writeeeprom: writeeepromMock,
    APRD: APRDMock,
    APWR: APWRMock,
    LRW: LRWMock,
    LRD: LRDMock,
    LWR: LWRMock,
    dcsync0: dcsync0Mock,
    dcsync01: dcsync01Mock
  }));
  // attach static helper
  (ctor as any).listInterfaces = listInterfacesMock;
  return { Master: ctor };
});

import { SoemMaster } from '../src/index';

describe('SoemMaster (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('constructor and init', () => {
    const m = new SoemMaster('eth0');
    expect(m).toBeDefined();
    expect(m.init()).toBe(true);
    expect(initMock).toHaveBeenCalled();
  });

  it('configInit and configMapPDO', () => {
    const m = new SoemMaster();
    expect(m.configInit()).toBe(2);
    m.configMapPDO();
    expect(configMapPDOMock).toHaveBeenCalled();
  });

  it('state and readState', () => {
    const m = new SoemMaster();
    expect(m.state()).toBe(4);
    expect(m.readState()).toBe(4);
  });

  it('sdoRead and sdoWrite with ca flag', () => {
    const m = new SoemMaster();
    const buf = m.sdoRead(1, 0x1000, 0, true);
    expect(sdoReadMock).toHaveBeenCalledWith(1, 0x1000, 0, true);
    expect(buf).toBeInstanceOf(Buffer);
    expect(m.sdoWrite(1, 0x2000, 0, Buffer.from([0x1]), false)).toBe(true);
    expect(sdoWriteMock).toHaveBeenCalled();
  });

  it('processdata send/receive', () => {
    const m = new SoemMaster();
    expect(m.sendProcessdata()).toBe(123);
    expect(m.receiveProcessdata()).toBe(1);
  });

  it('close', () => {
    const m = new SoemMaster();
    m.close();
    expect(closeMock).toHaveBeenCalled();
  });

  it('writeState and stateCheck', () => {
    const m = new SoemMaster();
    expect(m.writeState(1, 4)).toBe(5);
    expect(writeStateMock).toHaveBeenCalledWith(1, 4);
    expect(m.stateCheck(1, 4, 100)).toBe(5);
  });

  it('reconfigSlave and recoverSlave', () => {
    const m = new SoemMaster();
    expect(m.reconfigSlave(1, 100)).toBe(1);
    expect(m.recoverSlave(1, 100)).toBe(1);
  });

  it('slaveMbxCyclic and configDC', () => {
    const m = new SoemMaster();
    expect(m.slaveMbxCyclic(1)).toBe(0);
    expect(m.configDC()).toBe(true);
  });

  it('getSlaves and initRedundant', () => {
    const m = new SoemMaster();
    expect(Array.isArray(m.getSlaves())).toBe(true);
    expect(m.initRedundant('if1', 'if2')).toBe(true);
  });

  it('group processdata and mailbox handler', () => {
    const m = new SoemMaster();
    expect(m.configMapGroup()).toBeInstanceOf(Buffer);
    expect(m.sendProcessdataGroup()).toBe(10);
    expect(m.receiveProcessdataGroup()).toBe(11);
    expect(m.mbxHandler()).toBe(0);
  });

  it('elist2string and SoE read/write', () => {
    const m = new SoemMaster();
    expect(m.elist2string()).toBe('no errors');
    expect(m.SoEread(1, 0, 0, 1)).toBeInstanceOf(Buffer);
    expect(m.SoEwrite(1, 0, 0, 1, Buffer.from([0x1]))).toBe(true);
  });

  it('EEPROM read/write', () => {
    const m = new SoemMaster();
    expect(m.readeeprom(1, 0)).toBe(0);
    expect(m.writeeeprom(1, 0, 0)).toBe(0);
  });

  it('APRD/APWR/LRW/LRD/LWR', () => {
    const m = new SoemMaster();
    expect(m.APRD(1, 2, 1)).toBeInstanceOf(Buffer);
    expect(m.APWR(1, 2, Buffer.from([0x1]))).toBe(1);
    expect(m.LRW(0x1000, 2, Buffer.alloc(2))).toBe(2);
    expect(m.LRD(0x1000, 2)).toBeInstanceOf(Buffer);
    expect(m.LWR(0x1000, Buffer.from([0x1]))).toBe(3);
  });

  it('dcsync helpers', () => {
    const m = new SoemMaster();
    expect(m.dcsync0(1, true, 1000, 0)).toBe(true);
    expect(m.dcsync01(1, true, 1000, 2000, 0)).toBe(true);
  });

  it('static listInterfaces', () => {
    const list = SoemMaster.listInterfaces();
    expect(list).toBeInstanceOf(Array);
    expect(list[0].name).toBe('eth0');
  });
});
