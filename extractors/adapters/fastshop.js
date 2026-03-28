module.exports = {
    name: 'fastshop',
    matchDomain: /fastshop\.com\.br/,
    useHeadless: true,
    forceHeadless: true, // Proteção estrita, requisições de node são bloqueadas ou pedem JS challenge

    async extractHeadless(page) {
        let nome = '';
        let preco = '';
        let imagem = '';

        try {
            await page.waitForSelector('.title-product, h1', { timeout: 10000 }).catch(() => {});

            nome = await page.evaluate(() => {
                const title = document.querySelector('.title-product') || document.querySelector('h1.product-name');
                return title ? title.innerText.trim() : '';
            });

            preco = await page.evaluate(() => {
                // Tenta preço promocional via pix primeiro
                const priceDiv = document.querySelector('.price-promotional') || 
                                 document.querySelector('.price-value') ||
                                 document.querySelector('[data-testid="price-value"]');
                if (priceDiv) return priceDiv.innerText.replace('R$', '').trim();
                return '';
            });

            imagem = await page.evaluate(() => {
                const img = document.querySelector('.image-gallery img') || 
                            document.querySelector('.product-image');
                return img ? img.src : '';
            });

        } catch (e) {
             console.error('FastShop error:', e);
        }

        return { nome, preco, imagem };
    }
};
