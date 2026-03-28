const { SCORING, ScoredField } = require('../../utils/confidence');

module.exports = {
    name: 'tokstok',
    matchDomain: /tokstok\.com\.br/,
    useHeadless: true,
    forceHeadless: true,

    async extractHeadless(page) {
        let fields = { nome: [], preco: [], imagem: [] };

        try {
            await page.waitForSelector('.vtex-product-price-1-x-currencyInteger, h1', { timeout: 10000 }).catch(() => {});

            let nome = await page.evaluate(() => {
                const title = document.querySelector('h1.vtex-store-components-3-x-productNameContainer') || document.querySelector('h1 span');
                return title ? title.innerText.trim() : '';
            });

            let preco = await page.evaluate(() => {
                const priceDiv = document.querySelector('.vtex-product-price-1-x-sellingPriceValue');
                if (priceDiv) return priceDiv.innerText.replace('R$', '').trim();
                return '';
            });

            let imagem = await page.evaluate(() => {
                const img = document.querySelector('.vtex-store-components-3-x-productImageTag');
                return img ? img.src : '';
            });

            if(nome) fields.nome.push(new ScoredField(nome, 'tokstok:title', 'headless', SCORING.ADAPTER_SPECIFIC_HIGH));
            if(preco) fields.preco.push(new ScoredField(preco, 'tokstok:price', 'headless', SCORING.ADAPTER_SPECIFIC_HIGH));
            if(imagem) fields.imagem.push(new ScoredField(imagem, 'tokstok:image', 'headless', SCORING.ADAPTER_SPECIFIC_HIGH));

        } catch (e) {
             console.error('Tok&Stok error:', e);
        }

        return fields;
    }
};
