// Mock pour l'addon natif SOEM pour les tests
const mockInterfaces = [
    {
        name: process.platform === 'win32' ? '\\Device\\NPF_{TEST-GUID-1}' : 'eth0',
        description: process.platform === 'win32' ? 'Test Network Adapter 1' : 'Ethernet Interface 1'
    },
    {
        name: process.platform === 'win32' ? '\\Device\\NPF_{TEST-GUID-2}' : 'eth1',
        description: process.platform === 'win32' ? 'Test Network Adapter 2' : 'Ethernet Interface 2'
    },
    {
        name: process.platform === 'win32' ? '\\Device\\NPF_Loopback' : 'lo',
        description: 'Loopback Interface'
    }
];

class MockMaster {
    constructor(ifname = 'eth0') {
        this.ifname = ifname;
        this.isInitialized = false;
        this.isClosed = false;
    }

    init() {
        if (this.isClosed) return false;

        // Simuler l'échec pour certaines interfaces
        if (this.ifname.includes('INVALID') || this.ifname === 'fail') {
            return false;
        }

        this.isInitialized = true;
        return true;
    }

    configInit() {
        if (!this.isInitialized) return 0;

        // Simuler la détection d'esclaves pour certaines interfaces
        if (this.ifname.includes('eth0') || this.ifname.includes('TEST-GUID-1')) {
            return 2; // 2 esclaves simulés
        }

        return 0; // Pas d'esclaves
    }

    configMapPDO() {
        if (!this.isInitialized) throw new Error('Not initialized');
        // Mock implementation
    }

    state() {
        if (!this.isInitialized) return 0;
        return 8; // OP state
    }

    readState() {
        if (!this.isInitialized) return 0;
        return 8; // OP state
    }

    sdoRead(slave, index, sub) {
        if (!this.isInitialized) throw new Error('Not initialized');

        // Mock SDO responses
        if (index === 0x1000 && sub === 0) {
            // Device type
            const buffer = Buffer.allocUnsafe(4);
            buffer.writeUInt32LE(0x12345678, 0);
            return buffer;
        }

        if (index === 0x1018 && sub === 1) {
            // Vendor ID
            const buffer = Buffer.allocUnsafe(4);
            buffer.writeUInt32LE(0x00000123, 0);
            return buffer;
        }

        return null;
    }

    sdoWrite(slave, index, sub, data) {
        if (!this.isInitialized) return false;
        return true;
    }

    sendProcessdata() {
        if (!this.isInitialized) return 0;
        return 1; // WKC
    }

    receiveProcessdata() {
        if (!this.isInitialized) return 0;
        return 1; // WKC
    }

    close() {
        this.isInitialized = false;
        this.isClosed = true;
    }

    static listInterfaces() {
        return mockInterfaces;
    }
}

module.exports = {
    Master: MockMaster
};
