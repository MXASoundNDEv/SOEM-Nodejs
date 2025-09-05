const { SoemMaster } = require('../dist');

async function main() {
    console.log('Scanning for EtherCAT devices...');

    // Get available interfaces
    let interfaces = [];
    try {
        interfaces = SoemMaster.listInterfaces();
    } catch (error) {
        console.error('Error listing interfaces:', error.message);
        console.log('Falling back to default interface names...');

        // Fallback to common interface names
        const commonNames = process.platform === 'win32'
            ? ['\\Device\\NPF_{GUID}', 'eth0']
            : ['eth0', 'enp0s3', 'ens33', 'wlan0'];

        interfaces = commonNames.map(name => ({ name, description: 'Fallback interface' }));
    }

    if (interfaces.length === 0) {
        console.error('No network interfaces available');
        process.exit(1);
    }

    console.log(`Found ${interfaces.length} network interface(s)`);

    // Try each interface until one works or we run out
    let master = null;
    let workingInterface = null;

    for (const iface of interfaces) {
        console.log(`Trying interface: ${iface.name}`);

        try {
            master = new SoemMaster(iface.name);

            if (master.init()) {
                console.log(`✓ Successfully initialized EtherCAT on interface: ${iface.name}`);
                workingInterface = iface;
                break;
            } else {
                console.log(`✗ Failed to initialize EtherCAT on interface: ${iface.name}`);
                master.close();
                master = null;
            }
        } catch (error) {
            console.log(`✗ Error with interface ${iface.name}: ${error.message}`);
            if (master) {
                master.close();
                master = null;
            }
        }
    }

    if (!master || !workingInterface) {
        console.error('No working EtherCAT interface found');
        console.log('');
        console.log('Troubleshooting tips:');
        console.log('- Ensure EtherCAT devices are connected');
        console.log('- Run as administrator (Windows) or with sudo (Linux)');
        console.log('- Install WinPcap/Npcap (Windows) or ensure raw socket access (Linux)');
        console.log('- Check that network interfaces are not being used by other processes');
        process.exit(1);
    }

    console.log(`Using interface: ${workingInterface.name} (${workingInterface.description})`);
    console.log('');

    try {
        const slaves = master.configInit();
        console.log('EtherCAT slaves detected:', slaves);

        if (slaves > 0) {
            master.configMapPDO();
            console.log('PDO mapping configured');

            // Test communication
            console.log('Testing process data communication...');
            for (let i = 0; i < 10; i++) {
                master.sendProcessdata();
                const wkc = master.receiveProcessdata();
                console.log(`Cycle ${i + 1}: Working Counter = ${wkc}, State = ${master.readState()}`);

                // Small delay between cycles
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Try to read device information from first slave
            if (slaves >= 1) {
                try {
                    console.log('');
                    console.log('Reading device information from slave 1...');
                    const deviceType = master.sdoRead(1, 0x1000, 0);
                    if (deviceType && deviceType.length >= 4) {
                        const type = deviceType.readUInt32LE(0);
                        console.log(`Device type: 0x${type.toString(16)}`);
                    }

                    const vendorId = master.sdoRead(1, 0x1018, 1);
                    if (vendorId && vendorId.length >= 4) {
                        const vendor = vendorId.readUInt32LE(0);
                        console.log(`Vendor ID: 0x${vendor.toString(16)}`);
                    }
                } catch (sdoError) {
                    console.log('Could not read SDO data:', sdoError.message);
                }
            }
        } else {
            console.log('No EtherCAT slaves found on this network');
        }

    } catch (error) {
        console.error('Error during EtherCAT operation:', error.message);
    } finally {
        master.close();
        console.log('EtherCAT connection closed');
    }
}

main().catch(e => {
    console.error('Fatal error:', e.message);
    process.exit(1);
});
