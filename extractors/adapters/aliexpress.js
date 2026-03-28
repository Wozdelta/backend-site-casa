const { SCORING, ScoredField } = require('../../utils/confidence');

module.exports = {
    name: 'aliexpress',
    matchDomain: /aliexpress\.com/,
    useHeadless: true,
    forceHeadless: true,

    async extractHeadless(page) {
        let fields = { nome: [], preco: [], imagem: [] };

        try {
            await page.waitForSelector('.product-title-text, h1[data-pl="product-title"], .price--originalText--ZcLWMGZ', { timeout: 12000 }).catch(() => {});

            let nome = await page.evaluate(() => {
                let el = document.querySelector('.product-title-text') || document.querySelector('h1[data-pl="product-title"]');
                return el ? el.innerText.trim() : '';
            });
            if(nome) fields.nome.push(new ScoredField(nome, 'adapter:DOM:title', 'headless', SCORING.ADAPTER_SPECIFIC_HIGH));

            let preco = await page.evaluate(() => {
                let cur = document.querySelector('.price--originalText--ZcLWMGZ') || document.querySelector('.product-price-value');
                if (cur && cur.innerText) return cur.innerText.trim().replace('R$', '').trim();
                return '';
            });
            if(preco) fields.preco.push(new ScoredField(preco, 'adapter:DOM:price', 'headless', SCORING.ADAPTER_SPECIFIC_HIGH));

            let imagem = await page.evaluate(() => {
                let img = document.querySelector('.magnifier-image') || document.querySelector('.pdp-info-right img');
                return img ? img.src : '';
            });
            if(imagem) fields.imagem.push(new ScoredField(imagem, 'adapter:DOM:image', 'headless', SCORING.ADAPTER_SPECIFIC_HIGH));

        } catch (e) {
            console.error('Aliexpress adapter error:', e);
        }

        return fields;
    }
};
