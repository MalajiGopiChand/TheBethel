import puppeteer from 'puppeteer';

(async () => {
    console.log('Starting puppeteer...');
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        page.on('console', msg => {
            console.log(`[PAGE CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
        });
        
        page.on('pageerror', error => {
            console.error(`[PAGE ERROR] ${error.message}`);
        });

        console.log('Navigating to app...');
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });
        
        console.log('Taking a moment...');
        await new Promise(r => setTimeout(r, 3000));
        
        await browser.close();
        console.log('Done.');
    } catch (e) {
        console.error('Test Failed:', e);
    }
})();
