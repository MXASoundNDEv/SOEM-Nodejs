examples / scan - and - read.js
const { SoemMaster } = require('../dist');

async function main() {
    const m = new SoemMaster(process.argv[2] || 'eth0');
    if (!m.init()) throw new Error('ec_init failed');

    const slaves = m.configInit();
    console.log('Slaves detected:', slaves);

    m.configMapPDO();

    // Boucle de processdata (demo)
    for (let i = 0; i < 1000; i++) {
        m.sendProcessdata();
        const wkc = m.receiveProcessdata();
        if (i % 100 === 0) console.log('WKC', wkc, 'state', m.readState());
    }

    // Exemple SDO read: index 0x1000 (Device Type) du slave 1
    const buf = m.sdoRead(1, 0x1000, 0);
    if (buf) console.log('SDO 0x1000:', buf);

    m.close();
}

main().catch(e => { console.error(e); process.exit(1); });