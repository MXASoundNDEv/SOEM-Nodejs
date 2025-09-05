const { SoemMaster } = require('../dist');

/**
 * Utility functions for EtherCAT interface management
 */
class EtherCATUtils {
    /**
     * Get all available network interfaces
     * @returns {Array} Array of interface objects with name and description
     */
    static getAvailableInterfaces() {
        try {
            return SoemMaster.listInterfaces();
        } catch (error) {
            console.warn('Warning: Could not list network interfaces:', error.message);
            return [];
        }
    }

    /**
     * Find the best interface for EtherCAT communication
     * Prioritizes physical Ethernet adapters over virtual ones
     * @returns {Object|null} Best interface object or null if none found
     */
    static findBestInterface() {
        const interfaces = this.getAvailableInterfaces();

        if (interfaces.length === 0) {
            return null;
        }

        // Prioritize real network interfaces over virtual ones
        const priorities = [
            // Physical Ethernet interfaces (common patterns)
            /Intel.*Gigabit|Realtek.*Ethernet|Broadcom.*Ethernet/i,
            // Generic network adapters
            /Network Connection|Ethernet|LAN/i,
            // Anything that's not clearly virtual
            /^(?!.*WAN Miniport|.*Loopback|.*Virtual|.*VMware|.*VirtualBox)/i
        ];

        for (const priority of priorities) {
            const match = interfaces.find(iface => priority.test(iface.description));
            if (match) {
                return match;
            }
        }

        // If no prioritized interface found, return the first one
        return interfaces[0];
    }

    /**
     * Test if an interface can be used for EtherCAT
     * @param {string} interfaceName - Name of the interface to test
     * @returns {boolean} True if interface can be initialized
     */
    static testInterface(interfaceName) {
        try {
            const master = new SoemMaster(interfaceName);
            const result = master.init();
            master.close();
            return result;
        } catch (error) {
            return false;
        }
    }

    /**
     * Find a working interface by testing each one
     * @returns {Object|null} First working interface or null if none work
     */
    static findWorkingInterface() {
        const interfaces = this.getAvailableInterfaces();

        for (const iface of interfaces) {
            if (this.testInterface(iface.name)) {
                return iface;
            }
        }

        return null;
    }

    /**
     * Create a SoemMaster instance with automatic interface detection
     * @param {string} [preferredInterface] - Preferred interface name (optional)
     * @returns {SoemMaster|null} Initialized SoemMaster or null if failed
     */
    static createMaster(preferredInterface = null) {
        let interface_to_use = null;

        if (preferredInterface) {
            // Test the preferred interface first
            if (this.testInterface(preferredInterface)) {
                interface_to_use = { name: preferredInterface, description: 'Preferred interface' };
            } else {
                console.warn(`Preferred interface '${preferredInterface}' is not available or working`);
            }
        }

        if (!interface_to_use) {
            // Find a working interface automatically
            interface_to_use = this.findWorkingInterface();
        }

        if (!interface_to_use) {
            console.error('No working EtherCAT interface found');
            return null;
        }

        try {
            const master = new SoemMaster(interface_to_use.name);
            if (master.init()) {
                console.log(`EtherCAT initialized on: ${interface_to_use.name}`);
                console.log(`Description: ${interface_to_use.description}`);
                return master;
            } else {
                master.close();
                return null;
            }
        } catch (error) {
            console.error('Error creating EtherCAT master:', error.message);
            return null;
        }
    }

    /**
     * Print detailed information about available interfaces
     */
    static printInterfaceInfo() {
        const interfaces = this.getAvailableInterfaces();

        if (interfaces.length === 0) {
            console.log('No network interfaces found.');
            console.log('Make sure you have WinPcap or Npcap installed and proper permissions.');
            return;
        }

        console.log(`Found ${interfaces.length} network interface(s):`);
        console.log('');

        interfaces.forEach((iface, index) => {
            const isWorking = this.testInterface(iface.name);
            const status = isWorking ? '✓ Working' : '✗ Not available';

            console.log(`${index + 1}. ${iface.name}`);
            console.log(`   Description: ${iface.description}`);
            console.log(`   Status: ${status}`);
            console.log('');
        });

        const best = this.findBestInterface();
        if (best) {
            console.log(`Recommended interface: ${best.name}`);
            console.log(`(${best.description})`);
        }
    }
}

module.exports = { EtherCATUtils, SoemMaster };
