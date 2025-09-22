/**
 * Integration tests for SoemMaster.
 *
 * Modes:
 * - Real native addon: set RUN_INTEGRATION=true (tests will attempt to use the real native binding).
 * - JS stub: set RUN_INTEGRATION_STUB=true (tests use an in-memory JS stub to simulate the addon).
 *
 * By default these tests are skipped to avoid accidental hardware access.
 */

const RUN_REAL = process.env.RUN_INTEGRATION === 'true';
const RUN_STUB = process.env.RUN_INTEGRATION_STUB === 'true';

jest.setTimeout(20000);

if (!RUN_REAL && !RUN_STUB) {
  // Enregistrer des placeholders test.todo pour indiquer comment activer ces tests
  describe('Integration tests (disabled by default)', () => {
    test.todo('Set RUN_INTEGRATION=true pour exécuter avec l’addon natif');
    test.todo('Set RUN_INTEGRATION_STUB=true pour exécuter avec le stub JS');
  });
} else {
  // Optionally mock the native addon with a JS stub before importing the wrapper
  if (RUN_STUB) {
    jest.doMock('../../build/Release/soem_addon.node', () => {
      class Master {
        private inited = false;
  constructor(..._args: any[]) { this.inited = false; void _args; }
        init() { this.inited = true; return true; }
        configInit() { return 1; }
        configMapPDO() { return undefined; }
        sendProcessdata() { return 1; }
        receiveProcessdata() { return 1; }
  sdoRead(..._args: any[]) { const ca = _args[3]; return Buffer.from([0x01, ca ? 0xFF : 0x00]); }
  sdoWrite(..._args: any[]) { void _args; return true; }
        close() { this.inited = false; }
        // minimal other methods used in tests
        configDC() { return true; }
        listInterfaces = () => [{ name: 'eth0', description: 'stub' }];
      }
      (Master as any).listInterfaces = () => [{ name: 'eth0', description: 'stub' }];
      return { Master };
    }, { virtual: true });
  }

  describe('SoemMaster integration', () => {
    let SoemMaster: any;
    beforeAll(() => {
      // require inside isolateModules so that jest.doMock has effect
      jest.isolateModules(() => {
        SoemMaster = require('../../src/index').SoemMaster;
      });
    });

    it('init -> config -> processdata -> sdo flow', () => {
      const m = new SoemMaster('eth0');
      expect(m.init()).toBe(true);
      const slaves = m.configInit();
      expect(typeof slaves).toBe('number');
      m.configMapPDO();
      const s = m.sendProcessdata();
      expect(typeof s).toBe('number');
      const r = m.receiveProcessdata();
      expect(typeof r).toBe('number');
      const read = m.sdoRead(1, 0x1000, 0, true);
      expect(read).toBeInstanceOf(Buffer);
      const ok = m.sdoWrite(1, 0x2000, 0, Buffer.from([0x1]), false);
      expect(ok).toBe(true);
      m.close();
    });

    it('listInterfaces static helper', () => {
      const ifs = SoemMaster.listInterfaces();
      expect(Array.isArray(ifs)).toBe(true);
      expect(ifs[0].name).toBeDefined();
    });
  });
}
