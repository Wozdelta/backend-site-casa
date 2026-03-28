const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const generic = require('./generic');

async function extractWithBrowser(url, adapter) {
    let browser;
    let fields = { nome: [], preco: [], imagem: [] };

    try {
        console.log(`PUPPETEER INVISIVEL [START] -> ${url}`);
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080']
        });
        const page = await browser.newPage();
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
        
        // Timeout robusto pra evitar gargalos
        await page.setDefaultNavigationTimeout(35000);
        await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => {});
        
        // Ponto de hidratação: Se for SPA (React), precisamos de alguns milissegundos para o conteúdo aparecer.
        await new Promise(r => setTimeout(r, 2000));

        // Adaptadores dedicados Headless
        if (adapter && adapter.extractHeadless) {
            console.log(`Rodando Headless Custom [${adapter.name}]`);
            const adapterFields = await adapter.extractHeadless(page);
            fields.nome.push(...(adapterFields.nome || []));
            fields.preco.push(...(adapterFields.preco || []));
            fields.imagem.push(...(adapterFields.imagem || []));
        }

        // SEMPRE rodamos o Generic parser como fallback no HTML totalmente renderizado e desofuscado!
        const html = await page.content();
        const genericFields = generic.parseGenericSEO(html, 'headless_generic');
        
        fields.nome.push(...genericFields.nome);
        fields.preco.push(...genericFields.preco);
        fields.imagem.push(...genericFields.imagem);
        
        // Se o adaptador ESTIVER PRESENTE mas não tiver Headless customizado, jogamos a DOM hidratada na lógica Estática dele!
        if (adapter && !adapter.extractHeadless && adapter.extractStatic) {
            console.log(`Rodando Logic Static Custom [${adapter.name}] usando HTML hidratado do Headless`);
            const hydratedStaticFields = await adapter.extractStatic(html, {});
            fields.nome.push(...(hydratedStaticFields.nome || []));
            fields.preco.push(...(hydratedStaticFields.preco || []));
            fields.imagem.push(...(hydratedStaticFields.imagem || []));
        }

        await browser.close();
        return fields;

    } catch (err) {
        console.error('[PUPPETEER FAIL]:', err.message);
        if (browser) await browser.close();
        return fields;
    }
}

module.exports = {
    extractWithBrowser
};
