const { SoemMaster } = require('../dist');

async function main() {
    console.log('Listing available network interfaces...');

    try {
        const interfaces = SoemMaster.listInterfaces();

        if (interfaces.length === 0) {
            console.log('No network interfaces found.');
            console.log('Make sure you have:');
            console.log('- WinPcap or Npcap installed on Windows');
            console.log('- Proper permissions to access network interfaces');
            console.log('- Run as administrator on Windows');
            return;
        }

        console.log(`Found ${interfaces.length} network interface(s):`);
        console.log('');

        interfaces.forEach((iface, index) => {
            console.log(`${index + 1}. ${iface.name}`);
            console.log(`   Description: ${iface.description}`);
            console.log('');
        });

        console.log('You can use any of these interface names with SoemMaster:');
        console.log('Example: new SoemMaster("' + interfaces[0]?.name + '")');

    } catch (error) {
        console.error('Error listing interfaces:', error.message);
        console.log('');
        console.log('This might be due to:');
        console.log('- Missing WinPcap/Npcap on Windows');
        console.log('- Insufficient permissions');
        console.log('- No compatible network adapters');
    }
}

main().catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
});
