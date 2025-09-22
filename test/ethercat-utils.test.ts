// Plus de mock inline : on utilise __mocks__/soem_addon.js via moduleNameMapper (bindings -> mock)

import { EtherCATUtils } from '../examples/ethercat-utils';
// Utiliser dist pour aligner avec examples/ethercat-utils.js
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SoemMaster } = require('../dist');

describe('EtherCATUtils', () => {
  beforeEach(() => {
    // Reset tous les mocks avant chaque test
    jest.clearAllMocks();
    (global as any).mockConsole();
  });

  afterEach(() => {
    (global as any).restoreConsole();
  });

  describe('getAvailableInterfaces', () => {
    it('should return available interfaces', () => {
      const interfaces = EtherCATUtils.getAvailableInterfaces();
      
      expect(Array.isArray(interfaces)).toBe(true);
      expect(interfaces.length).toBeGreaterThan(0);
      
      interfaces.forEach((iface: any) => {
        expect(iface).toHaveProperty('name');
        expect(iface).toHaveProperty('description');
      });
    });

    it('should handle errors gracefully', () => {
      const spy = jest.spyOn(SoemMaster, 'listInterfaces').mockImplementation(() => {
        throw new Error('Test error');
      });

      const interfaces = EtherCATUtils.getAvailableInterfaces();
      expect(Array.isArray(interfaces)).toBe(true);
      expect(interfaces).toEqual([]);

      // Le message peut être loggé avec error.message
      expect(console.warn).toHaveBeenCalledWith(
        'Warning: Could not list network interfaces:', 'Test error'
      );

      spy.mockRestore();
    });
  });

  describe('findBestInterface', () => {
    it('should return null when no interfaces available', () => {
      const spy = jest.spyOn(EtherCATUtils, 'getAvailableInterfaces').mockReturnValue([]);
      
      const best = EtherCATUtils.findBestInterface();
      expect(best).toBeNull();
      
      spy.mockRestore();
    });

    it('should prioritize Intel Gigabit interfaces', () => {
      const mockInterfaces = [
        { name: 'loopback', description: 'Loopback' },
        { name: 'intel', description: 'Intel Gigabit Network Connection' },
        { name: 'realtek', description: 'Realtek Ethernet' }
      ];
      
      const spy = jest.spyOn(EtherCATUtils, 'getAvailableInterfaces').mockReturnValue(mockInterfaces);
      
      const best = EtherCATUtils.findBestInterface();
      expect(best?.name).toBe('intel');
      expect(best?.description).toContain('Intel Gigabit');
      
      spy.mockRestore();
    });

    it('should return first interface if no priority match', () => {
      const mockInterfaces = [
        { name: 'test1', description: 'Test Interface 1' },
        { name: 'test2', description: 'Test Interface 2' }
      ];
      
      const spy = jest.spyOn(EtherCATUtils, 'getAvailableInterfaces').mockReturnValue(mockInterfaces);
      
      const best = EtherCATUtils.findBestInterface();
      expect(best?.name).toBe('test1');
      
      spy.mockRestore();
    });
  });

  describe('testInterface', () => {
    it('should return true for working interfaces', () => {
  const result = EtherCATUtils.testInterface('eth0');
  // Dans le mock global, eth0 doit init() => true
  expect(result).toBe(true);
    });

    it('should return false for invalid interfaces', () => {
      const result = EtherCATUtils.testInterface('INVALID_INTERFACE');
      expect(result).toBe(false);
    });

    it('should return false when interface throws error', () => {
      const result = EtherCATUtils.testInterface('fail');
      expect(result).toBe(false);
    });
  });

  describe('findWorkingInterface', () => {
    it('should return first working interface', () => {
      const mockInterfaces = [
        { name: 'fail', description: 'Failing Interface' },
        { name: 'eth0', description: 'Working Interface' },
        { name: 'eth1', description: 'Another Interface' }
      ];
      
      const spy = jest.spyOn(EtherCATUtils, 'getAvailableInterfaces').mockReturnValue(mockInterfaces);
      
      const working = EtherCATUtils.findWorkingInterface();
      expect(working?.name).toBe('eth0');
      
      spy.mockRestore();
    });

    it('should return null if no interface works', () => {
      const mockInterfaces = [
        // Noms contenant 'INVALID' pour que testInterface retourne false dans le mock
        { name: 'INVALID_IFACE1', description: 'Failing Interface 1' },
        { name: 'INVALID_IFACE2', description: 'Failing Interface 2' }
      ];
      
      const spy = jest.spyOn(EtherCATUtils, 'getAvailableInterfaces').mockReturnValue(mockInterfaces);
      
      const working = EtherCATUtils.findWorkingInterface();
      expect(working).toBeNull();
      
      spy.mockRestore();
    });
  });

  describe('createMaster', () => {
    it('should create master with preferred interface if working', () => {
      const master = EtherCATUtils.createMaster('eth0');
      expect(master).not.toBeNull();
      if (master) {
        expect(typeof master.configInit).toBe('function');
        master.close();
      }
    });

    it('should fallback to automatic detection if preferred interface fails', () => {
      const master = EtherCATUtils.createMaster('INVALID_INTERFACE');
      
      expect(console.warn).toHaveBeenCalledWith(
        "Preferred interface 'INVALID_INTERFACE' is not available or working"
      );
      
      if (master) {
        expect(master).toBeInstanceOf(SoemMaster);
        master.close();
      }
    });

    it('should return null if no working interface found', () => {
      const spy = jest.spyOn(EtherCATUtils, 'findWorkingInterface').mockReturnValue(null);
      
      const master = EtherCATUtils.createMaster();
      
      expect(master).toBeNull();
      expect(console.error).toHaveBeenCalledWith('No working EtherCAT interface found');
      
      spy.mockRestore();
    });

    it('should handle master creation errors', () => {
      // Forcer testInterface à considérer l'interface comme fonctionnelle afin de passer la sélection
      const testIfaceSpy = jest.spyOn(EtherCATUtils, 'testInterface').mockReturnValue(true);
      // Mock pour simuler une erreur lors de l'init réelle du master
      const initSpy = jest.spyOn(SoemMaster.prototype, 'init').mockImplementation(() => { throw new Error('Creation error'); });

      const master = EtherCATUtils.createMaster('eth0');
      expect(master).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error creating EtherCAT master:', 'Creation error');

      initSpy.mockRestore();
      testIfaceSpy.mockRestore();
    });
  });

  describe('printInterfaceInfo', () => {
    it('should print interface information', () => {
      EtherCATUtils.printInterfaceInfo();
      
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Found'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('network interface(s):'));
    });

    it('should print no interfaces message when none available', () => {
      const spy = jest.spyOn(EtherCATUtils, 'getAvailableInterfaces').mockReturnValue([]);
      
      EtherCATUtils.printInterfaceInfo();
      
      expect(console.log).toHaveBeenCalledWith('No network interfaces found.');
      expect(console.log).toHaveBeenCalledWith('Make sure you have WinPcap or Npcap installed and proper permissions.');
      
      spy.mockRestore();
    });

    it('should print recommended interface', () => {
      const mockBest = { name: 'eth0', description: 'Best Interface' };
      const spy = jest.spyOn(EtherCATUtils, 'findBestInterface').mockReturnValue(mockBest);
      
      EtherCATUtils.printInterfaceInfo();
      
      expect(console.log).toHaveBeenCalledWith('Recommended interface: eth0');
      expect(console.log).toHaveBeenCalledWith('(Best Interface)');
      
      spy.mockRestore();
    });
  });
});
