// Mock l'addon natif avant l'import
jest.mock('../build/Release/soem_addon.node', () => {
  const mockInterfaces = [
    {
      name: process.platform === 'win32' ? '\\Device\\NPF_{TEST-GUID-1}' : 'eth0',
      description: process.platform === 'win32' ? 'Test Network Adapter 1' : 'Ethernet Interface 1'
    },
    {
      name: process.platform === 'win32' ? '\\Device\\NPF_{TEST-GUID-2}' : 'eth1', 
      description: process.platform === 'win32' ? 'Test Network Adapter 2' : 'Ethernet Interface 2'
    }
  ];

  class MockMaster {
    private ifname: string;
    private isInitialized = false;
    private isClosed = false;

    constructor(ifname = 'eth0') {
      this.ifname = ifname;
    }

    init() {
      if (this.isClosed) return false;
      if (this.ifname.includes('INVALID') || this.ifname === 'fail') {
        return false;
      }
      this.isInitialized = true;
      return true;
    }

    configInit() {
      if (!this.isInitialized) return 0;
      if (this.ifname.includes('eth0') || this.ifname.includes('TEST-GUID-1')) {
        return 2;
      }
      return 0;
    }

    configMapPDO() {
      if (!this.isInitialized) throw new Error('Not initialized');
    }

    state() {
      if (!this.isInitialized) return 0;
      return 8;
    }

    readState() {
      if (!this.isInitialized) return 0;
      return 8;
    }

    sdoRead(slave: number, index: number, sub: number) {
      if (!this.isInitialized) throw new Error('Not initialized');
      
      if (index === 0x1000 && sub === 0) {
        const buffer = Buffer.allocUnsafe(4);
        buffer.writeUInt32LE(0x12345678, 0);
        return buffer;
      }
      
      if (index === 0x1018 && sub === 1) {
        const buffer = Buffer.allocUnsafe(4);
        buffer.writeUInt32LE(0x00000123, 0);
        return buffer;
      }
      
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sdoWrite(_slave: number, _index: number, _sub: number, _data: Buffer) {
      if (!this.isInitialized) return false;
      return true;
    }

    sendProcessdata() {
      if (!this.isInitialized) return 0;
      return 1;
    }

    receiveProcessdata() {
      if (!this.isInitialized) return 0;
      return 1;
    }

    close() {
      this.isInitialized = false;
      this.isClosed = true;
    }

    static listInterfaces() {
      return mockInterfaces;
    }
  }

  return { Master: MockMaster };
}, { virtual: true });

import { SoemMaster, NetworkInterface } from '../src/index';

describe('SoemMaster', () => {
  describe('constructor', () => {
    it('should create instance with default interface', () => {
      const master = new SoemMaster();
      expect(master).toBeInstanceOf(SoemMaster);
    });

    it('should create instance with custom interface', () => {
      const master = new SoemMaster('eth1');
      expect(master).toBeInstanceOf(SoemMaster);
    });
  });

  describe('listInterfaces', () => {
    it('should return array of network interfaces', () => {
      const interfaces = SoemMaster.listInterfaces();
      
      expect(Array.isArray(interfaces)).toBe(true);
      expect(interfaces.length).toBeGreaterThan(0);
      
      interfaces.forEach((iface: NetworkInterface) => {
        expect(iface).toHaveProperty('name');
        expect(iface).toHaveProperty('description');
        expect(typeof iface.name).toBe('string');
        expect(typeof iface.description).toBe('string');
      });
    });

    it('should return platform-specific interface names', () => {
      const interfaces = SoemMaster.listInterfaces();
      const firstInterface = interfaces[0];
      
      if (process.platform === 'win32') {
        expect(firstInterface.name).toMatch(/\\Device\\NPF_/);
      } else {
        expect(firstInterface.name).toMatch(/^(eth|lo|en)/);
      }
    });
  });

  describe('init', () => {
    it('should initialize successfully with valid interface', () => {
      const master = new SoemMaster('eth0');
      const result = master.init();
      
      expect(result).toBe(true);
      master.close();
    });

    it('should fail to initialize with invalid interface', () => {
      const master = new SoemMaster('INVALID_INTERFACE');
      const result = master.init();
      
      expect(result).toBe(false);
      master.close();
    });

    it('should return true if already initialized', () => {
      const master = new SoemMaster('eth0');
      
      expect(master.init()).toBe(true);
      expect(master.init()).toBe(true); // Second call should also return true
      
      master.close();
    });
  });

  describe('configInit', () => {
    it('should return 0 if not initialized', () => {
      const master = new SoemMaster('eth0');
      const slaves = master.configInit();
      
      expect(slaves).toBe(0);
      master.close();
    });

    it('should return number of slaves when initialized', () => {
      const master = new SoemMaster('eth0');
      master.init();
      
      const slaves = master.configInit();
      expect(typeof slaves).toBe('number');
      expect(slaves).toBeGreaterThanOrEqual(0);
      
      master.close();
    });
  });

  describe('configMapPDO', () => {
    it('should not throw when master is initialized', () => {
      const master = new SoemMaster('eth0');
      master.init();
      
      expect(() => master.configMapPDO()).not.toThrow();
      
      master.close();
    });

    it('should throw when master is not initialized', () => {
      const master = new SoemMaster('eth0');
      
      expect(() => master.configMapPDO()).toThrow('Not initialized');
      
      master.close();
    });
  });

  describe('state and readState', () => {
    it('should return state when initialized', () => {
      const master = new SoemMaster('eth0');
      master.init();
      
      const state = master.state();
      const readState = master.readState();
      
      expect(typeof state).toBe('number');
      expect(typeof readState).toBe('number');
      
      master.close();
    });

    it('should return 0 when not initialized', () => {
      const master = new SoemMaster('eth0');
      
      expect(master.state()).toBe(0);
      expect(master.readState()).toBe(0);
      
      master.close();
    });
  });

  describe('SDO operations', () => {
    let master: SoemMaster;

    beforeEach(() => {
      master = new SoemMaster('eth0');
      master.init();
    });

    afterEach(() => {
      master.close();
    });

    it('should read SDO data', () => {
      const data = master.sdoRead(1, 0x1000, 0);
      
      if (data) {
        expect(Buffer.isBuffer(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
      }
    });

    it('should write SDO data', () => {
      const testData = Buffer.from([0x01, 0x02, 0x03, 0x04]);
      const result = master.sdoWrite(1, 0x2000, 0, testData);
      
      expect(typeof result).toBe('boolean');
    });

    it('should throw when not initialized for SDO operations', () => {
      const uninitializedMaster = new SoemMaster('eth0');
      
      expect(() => uninitializedMaster.sdoRead(1, 0x1000, 0)).toThrow('Not initialized');
      
      uninitializedMaster.close();
    });
  });

  describe('process data operations', () => {
    let master: SoemMaster;

    beforeEach(() => {
      master = new SoemMaster('eth0');
      master.init();
    });

    afterEach(() => {
      master.close();
    });

    it('should send and receive process data', () => {
      const sendWkc = master.sendProcessdata();
      const receiveWkc = master.receiveProcessdata();
      
      expect(typeof sendWkc).toBe('number');
      expect(typeof receiveWkc).toBe('number');
    });

    it('should return 0 when not initialized', () => {
      const uninitializedMaster = new SoemMaster('eth0');
      
      expect(uninitializedMaster.sendProcessdata()).toBe(0);
      expect(uninitializedMaster.receiveProcessdata()).toBe(0);
      
      uninitializedMaster.close();
    });
  });

  describe('close', () => {
    it('should close successfully', () => {
      const master = new SoemMaster('eth0');
      master.init();
      
      expect(() => master.close()).not.toThrow();
    });

    it('should be safe to call close multiple times', () => {
      const master = new SoemMaster('eth0');
      master.init();
      
      master.close();
      expect(() => master.close()).not.toThrow();
    });

    it('should not allow operations after close', () => {
      const master = new SoemMaster('eth0');
      master.init();
      master.close();
      
      expect(master.init()).toBe(false);
    });
  });
});
