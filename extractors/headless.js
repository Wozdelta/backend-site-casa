const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function extractWithBrowser(url, adapter) {
    let browser;
    try {
        console.log(`PUPPETEER INVISIVEL iniciando para [${url}]...`);
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // Anti-bet strategy basic
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Passar a bola pro adapter resolver com Playwright/Puppeteer Selector
        if(adapter.extractHeadless) {
            console.log(`Rodando logic headless customizada do adaptador [${adapter.name}]`);
            const data = await adapter.extractHeadless(page);
            await browser.close();
            return data;
        }

        // Senao tem custom logic, apenas lemos o HTML e jogamos pro Cheerio normal que vai ler a DOM montada!
        const html = await page.content();
        await browser.close();
        
        const generic = require('./generic');
        const genericData = generic.parseGenericSEO(html);
        
        // Se ainda não achou, o próprio adaptador tenta analisar o HTML gigante renderizado
        let adapterData = {};
        if (adapter.extractStatic) {
            adapterData = await adapter.extractStatic(html, genericData); 
        }

        return { ...genericData, ...adapterData };

    } catch(err) {
        console.error('Puppeteer falhou brutalmente:', err);
        if(browser) await browser.close();
        return {};
    }
}

module.exports = {
    extractWithBrowser
};
