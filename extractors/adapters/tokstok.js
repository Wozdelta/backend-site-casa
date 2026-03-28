module.exports = {
    name: 'tokstok',
    matchDomain: /tokstok\.com\.br/,
    useHeadless: true,
    forceHeadless: true, // SPA pesada de React que as vezes bloqueia crawler puro

    async extractHeadless(page) {
        let nome = '';
        let preco = '';
        let imagem = '';

        try {
            await page.waitForSelector('.vtex-product-price-1-x-currencyInteger, h1', { timeout: 10000 }).catch(() => {});

            nome = await page.evaluate(() => {
                const title = document.querySelector('h1.vtex-store-components-3-x-productNameContainer') || 
                              document.querySelector('h1 span');
                return title ? title.innerText.trim() : '';
            });

            preco = await page.evaluate(() => {
                const priceDiv = document.querySelector('.vtex-product-price-1-x-sellingPriceValue');
                if (priceDiv) return priceDiv.innerText.replace('R$', '').trim();
                return '';
            });

            imagem = await page.evaluate(() => {
                const img = document.querySelector('.vtex-store-components-3-x-productImageTag');
                return img ? img.src : '';
            });

        } catch (e) {
             console.error('Tok&Stok error:', e);
        }

        return { nome, preco, imagem };
    }
};
