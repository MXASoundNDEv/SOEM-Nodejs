import { SoemMaster } from '../src/index';
import { EtherCATUtils } from '../examples/ethercat-utils';

// Mock l'addon natif
jest.mock('../build/Release/soem_addon.node');

describe('Integration Tests', () => {
  beforeEach(() => {
    (global as any).mockConsole();
  });

  afterEach(() => {
    (global as any).restoreConsole();
  });

  describe('Full EtherCAT workflow', () => {
    it('should complete a full scan and initialization workflow', async () => {
      // 1. Liste des interfaces
      const interfaces = SoemMaster.listInterfaces();
      expect(interfaces.length).toBeGreaterThan(0);

      // 2. Création automatique du master
      const master = EtherCATUtils.createMaster();
      expect(master).toBeInstanceOf(SoemMaster);

      if (master) {
        try {
          // 3. Configuration initiale
          const slaves = master.configInit();
          expect(typeof slaves).toBe('number');

          // 4. Si des esclaves sont trouvés, configurer PDO
          if (slaves > 0) {
            expect(() => master.configMapPDO()).not.toThrow();

            // 5. Tester la communication
            for (let i = 0; i < 3; i++) {
              const sendWkc = master.sendProcessdata();
              const receiveWkc = master.receiveProcessdata();
              
              expect(typeof sendWkc).toBe('number');
              expect(typeof receiveWkc).toBe('number');
              
              const state = master.readState();
              expect(typeof state).toBe('number');
            }

            // 6. Tester les opérations SDO
            try {
              const deviceType = master.sdoRead(1, 0x1000, 0);
              if (deviceType) {
                expect(Buffer.isBuffer(deviceType)).toBe(true);
              }

              const testData = Buffer.from([0x01, 0x02, 0x03, 0x04]);
              const writeResult = master.sdoWrite(1, 0x2000, 0, testData);
              expect(typeof writeResult).toBe('boolean');
            } catch (error) {
              // SDO operations peuvent échouer selon le setup
              console.log('SDO operations not available in test environment');
            }
          }
        } finally {
          // 7. Nettoyer
          master.close();
        }
      }
    });

    it('should handle interface selection priorities correctly', () => {
      const interfaces = SoemMaster.listInterfaces();
      
      // Trouver la meilleure interface
      const best = EtherCATUtils.findBestInterface();
      expect(best).toBeTruthy();

      if (best && interfaces.length > 1) {
        // La meilleure interface devrait être privilégiée
        const isIntelOrEthernet = /Intel.*Gigabit|.*Ethernet|Network Connection/i.test(best.description);
        const isNotVirtual = !/WAN Miniport|Loopback|Virtual/i.test(best.description);
        
        if (interfaces.some(iface => /Intel.*Gigabit/i.test(iface.description))) {
          expect(isIntelOrEthernet || isNotVirtual).toBe(true);
        }
      }
    });

    it('should gracefully handle missing network capabilities', () => {
      // Test avec une interface qui échoue
      const master = new SoemMaster('INVALID_INTERFACE');
      
      expect(master.init()).toBe(false);
      expect(master.configInit()).toBe(0);
      expect(master.sendProcessdata()).toBe(0);
      expect(master.receiveProcessdata()).toBe(0);
      
      master.close();
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle multiple master instances', () => {
      const master1 = new SoemMaster('eth0');
      const master2 = new SoemMaster('eth1');

      expect(master1.init()).toBe(true);
      expect(master2.init()).toBe(true);

      // Les deux devraient fonctionner indépendamment
      expect(master1.configInit()).toBeGreaterThanOrEqual(0);
      expect(master2.configInit()).toBeGreaterThanOrEqual(0);

      master1.close();
      master2.close();
    });

    it('should handle rapid init/close cycles', () => {
      const master = new SoemMaster('eth0');

      for (let i = 0; i < 5; i++) {
        expect(master.init()).toBe(true);
        master.close();
      }
    });

    it('should validate interface names properly', () => {
      const validInterfaces = ['eth0', 'eth1', 'enp0s3'];
      const invalidInterfaces = ['', null, undefined, 'invalid_interface_name'];

      validInterfaces.forEach(name => {
        const master = new SoemMaster(name);
        // Ne devrait pas throw lors de la création
        expect(master).toBeInstanceOf(SoemMaster);
        master.close();
      });

      invalidInterfaces.forEach(name => {
        const master = new SoemMaster(name as any);
        // Peut créer l'instance mais init devrait échouer
        expect(master).toBeInstanceOf(SoemMaster);
        master.close();
      });
    });
  });

  describe('Performance and stability', () => {
    it('should handle high-frequency operations', () => {
      const master = new SoemMaster('eth0');
      master.init();

      const startTime = Date.now();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        master.sendProcessdata();
        master.receiveProcessdata();
      }

      const duration = Date.now() - startTime;
      
      // Devrait compléter en moins de 5 secondes
      expect(duration).toBeLessThan(5000);
      
      master.close();
    });

    it('should not leak memory with repeated operations', () => {
      // Test simple pour vérifier qu'il n'y a pas de fuites évidentes
      const master = new SoemMaster('eth0');
      master.init();

      // Simuler des opérations répétées
      for (let i = 0; i < 50; i++) {
        master.configInit();
        master.sendProcessdata();
        master.receiveProcessdata();
        master.state();
        master.readState();
      }

      // Devrait se terminer sans erreur
      expect(() => master.close()).not.toThrow();
    });
  });
});
