const http = require('http');

const urls = [
    '/',
    '/products',
    '/cart',
    '/checkout',
    '/order-lookup',
    '/login'
];

async function checkPort(port) {
    console.log(`Checking Port ${port}...`);
    let success = false;

    for (const url of urls) {
        await new Promise((resolve) => {
            const req = http.get(`http://localhost:${port}${url}`, (res) => {
                console.log(`[Port ${port}] ${url}: ${res.statusCode} ${res.statusMessage}`);
                success = true;
                resolve();
            });

            req.on('error', (e) => {
                resolve();
            });

            req.setTimeout(2000, () => {
                req.destroy();
                resolve();
            });
        });
    }
    return success;
}

(async () => {
    if (await checkPort(3000)) return;
    if (await checkPort(3001)) return;
    if (await checkPort(3002)) return;
    console.log('All ports (3000, 3001, 3002) checked. None are responding.');
})();
