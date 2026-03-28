const { SCORING, ScoredField } = require('../../utils/confidence');

module.exports = {
    name: 'fastshop',
    matchDomain: /fastshop\.com\.br/,
    useHeadless: true,
    forceHeadless: true,

    async extractHeadless(page) {
        let fields = { nome: [], preco: [], imagem: [] };

        try {
            await page.waitForSelector('.title-product, h1', { timeout: 10000 }).catch(() => {});

            let nome = await page.evaluate(() => {
                const title = document.querySelector('.title-product') || document.querySelector('h1.product-name');
                return title ? title.innerText.trim() : '';
            });

            let preco = await page.evaluate(() => {
                const priceDiv = document.querySelector('.price-promotional') || document.querySelector('.price-value') || document.querySelector('[data-testid="price-value"]');
                if (priceDiv) return priceDiv.innerText.replace('R$', '').trim();
                return '';
            });

            let imagem = await page.evaluate(() => {
                const img = document.querySelector('.image-gallery img') || document.querySelector('.product-image');
                return img ? img.src : '';
            });

            if(nome) fields.nome.push(new ScoredField(nome, 'fastshop:title', 'headless', SCORING.ADAPTER_SPECIFIC_HIGH));
            if(preco) fields.preco.push(new ScoredField(preco, 'fastshop:price', 'headless', SCORING.ADAPTER_SPECIFIC_HIGH));
            if(imagem) fields.imagem.push(new ScoredField(imagem, 'fastshop:img', 'headless', SCORING.ADAPTER_SPECIFIC_HIGH));

        } catch (e) {
             console.error('FastShop error:', e);
        }

        return fields;
    }
};
