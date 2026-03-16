const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    page.on('pageerror', err => console.log('REACT CRASH:', err.message));
    page.on('console', msg => {
        if (msg.type() === 'error') console.log('ERROR:', msg.text());
    });
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
    await page.goto('http://localhost:4173/menu', { waitUntil: 'networkidle0' });
    console.log('Done checking.');
    await browser.close();
})();
