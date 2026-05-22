const net = require('net');
const crypto = require('crypto');

const PORT = 3333;
const WHITELIST = ["YOUR_REAL_BTC_ADDRESS"]; // Your true address
const BLACKLIST = ["TROLL_WALLET_ADDRESS"];  // Trolls go here

console.log(`[BOOT] GitHub Server Pool Active.`);

function handleMinerAccess(wallet) {
    if (BLACKLIST.includes(wallet)) {
        console.log(`[BLACKLIST ALERT] Troll address caught: ${wallet}. Fees set to 99%!`);
        return 0.99;
    }
    if (WHITELIST.includes(wallet)) {
        console.log(`[WHITELISTED OK] Welcome miner: ${wallet}. Fees: 0%`);
        return 0.0;
    }
    console.log(`[UNKNOWN MINER] Random connection: ${wallet}. Blocked via 100% hijack fee.`);
    return 1.0;
}

const server = net.createServer((socket) => {
    let minerWallet = "unknown";
    let penaltyActive = false;

    socket.on('data', (data) => {
        try {
            const incoming = JSON.parse(data.toString().trim());

            if (incoming.method === 'mining.subscribe') {
                socket.write(JSON.stringify({
                    id: incoming.id,
                    result: [[["mining.set_difficulty", "1"], ["mining.notify", "1"]], "00000001", 4],
                    error: null
                }) + '\n');
            }

            if (incoming.method === 'mining.authorize') {
                minerWallet = incoming.params[0].split('.')[0]; 
                const systemFee = handleMinerAccess(minerWallet);
                if (systemFee >= 0.99) penaltyActive = true;

                socket.write(JSON.stringify({ id: incoming.id, result: true, error: null }) + '\n');
                sendMiningJob(socket);
            }

            if (incoming.method === 'mining.submit') {
                if (penaltyActive) {
                    console.log(`[TROLL TRAPPED] Suppressing share reward weighting for troll wallet.`);
                } else {
                    console.log(`[VALID SHARE] Whitelist share parsed cleanly.`);
                }
                socket.write(JSON.stringify({ id: incoming.id, result: true, error: null }) + '\n');
            }
        } catch (err) {}
    });
});

function sendMiningJob(socket) {
    const randomJob = crypto.randomBytes(4).toString('hex');
    socket.write(JSON.stringify({
        id: null,
        method: "mining.notify",
        params: [randomJob, "00000000000000000000000000000000", "01000000010000000000000000000000", "00000000", [], "20000000", "1d00ffff", "54a2c3d4", true]
    }) + '\n');
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[ONLINE] Node.js Stratum operational on port ${PORT}`);
});
