const { EtherCATUtils } = require('./ethercat-utils');

async function main() {
    console.log('=== EtherCAT Interface Manager ===');
    console.log('');

    // Print detailed interface information
    EtherCATUtils.printInterfaceInfo();

    console.log('=== Automatic EtherCAT Setup ===');
    console.log('');

    // Create a master with automatic interface detection
    const master = EtherCATUtils.createMaster();

    if (!master) {
        console.error('Failed to create EtherCAT master');
        process.exit(1);
    }

    try {
        // Scan for devices
        console.log('Scanning for EtherCAT slaves...');
        const slaves = master.configInit();
        console.log(`Found ${slaves} EtherCAT slave(s)`);

        if (slaves > 0) {
            master.configMapPDO();
            console.log('PDO mapping configured successfully');

            // Perform a few communication cycles
            console.log('Testing communication...');
            for (let i = 0; i < 5; i++) {
                master.sendProcessdata();
                const wkc = master.receiveProcessdata();
                console.log(`Cycle ${i + 1}: WKC=${wkc}, State=${master.readState()}`);
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Try to read some basic information
            console.log('');
            console.log('Reading slave information...');

            for (let slave = 1; slave <= Math.min(slaves, 3); slave++) {
                try {
                    console.log(`\nSlave ${slave}:`);

                    // Read device type
                    const deviceType = master.sdoRead(slave, 0x1000, 0);
                    if (deviceType && deviceType.length >= 4) {
                        const type = deviceType.readUInt32LE(0);
                        console.log(`  Device Type: 0x${type.toString(16)}`);
                    }

                    // Read vendor ID
                    const vendorId = master.sdoRead(slave, 0x1018, 1);
                    if (vendorId && vendorId.length >= 4) {
                        const vendor = vendorId.readUInt32LE(0);
                        console.log(`  Vendor ID: 0x${vendor.toString(16)}`);
                    }

                    // Read product code
                    const productCode = master.sdoRead(slave, 0x1018, 2);
                    if (productCode && productCode.length >= 4) {
                        const product = productCode.readUInt32LE(0);
                        console.log(`  Product Code: 0x${product.toString(16)}`);
                    }

                } catch (error) {
                    console.log(`  Error reading slave ${slave}: ${error.message}`);
                }
            }
        } else {
            console.log('No EtherCAT slaves detected');
            console.log('');
            console.log('This could be because:');
            console.log('- No EtherCAT devices are connected');
            console.log('- Devices are not powered');
            console.log('- Wrong network interface selected');
            console.log('- EtherCAT devices are in INIT state');
        }

    } catch (error) {
        console.error('Error during EtherCAT operation:', error.message);
    } finally {
        master.close();
        console.log('');
        console.log('EtherCAT master closed');
    }
}

// Handle command line arguments
if (process.argv.includes('--interfaces')) {
    console.log('Available network interfaces:');
    console.log('');
    EtherCATUtils.printInterfaceInfo();
    process.exit(0);
}

if (process.argv.includes('--help')) {
    console.log('EtherCAT Interface Manager');
    console.log('');
    console.log('Usage:');
    console.log('  node examples/interface-manager.js           # Run full scan');
    console.log('  node examples/interface-manager.js --interfaces  # List interfaces only');
    console.log('  node examples/interface-manager.js --help        # Show this help');
    process.exit(0);
}

main().catch(e => {
    console.error('Fatal error:', e.message);
    process.exit(1);
});
