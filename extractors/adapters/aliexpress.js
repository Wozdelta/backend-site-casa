module.exports = {
    name: 'aliexpress',
    matchDomain: /aliexpress\.com/,
    useHeadless: true,
    forceHeadless: true, // Aliexpress tem anti-bot pesadissimo e render server-side complexo

    async extractHeadless(page) {
        let nome = '';
        let preco = '';
        let imagem = '';

        try {
            // Damos wait apenas no titulo ou preco pra garantir que carregou
            await page.waitForSelector('.product-title-text, h1[data-pl="product-title"], .price--originalText--ZcLWMGZ', { timeout: 12000 }).catch(() => {});

            nome = await page.evaluate(() => {
                let el = document.querySelector('.product-title-text') || 
                         document.querySelector('h1[data-pl="product-title"]') ||
                         document.querySelector('.title--wrap--jB_V_A');
                return el ? el.innerText.trim() : '';
            });

            preco = await page.evaluate(() => {
                // Aliexpress muda as classes frequentemente, tentamos os wrappers mais recentes
                let cur = document.querySelector('.price--originalText--ZcLWMGZ') || 
                          document.querySelector('.product-price-value') ||
                          document.querySelector('.price--currentPriceText--V8_y_b5');
                if (cur && cur.innerText) {
                    let val = cur.innerText.trim();
                    val = val.replace('R$', '').trim();
                    return val;
                }
                return '';
            });

            imagem = await page.evaluate(() => {
                let img = document.querySelector('.magnifier-image') || 
                          document.querySelector('.pdp-info-right img') ||
                          document.querySelector('meta[property="og:image"]');
                if (img) return img.src || img.content;
                return '';
            });

        } catch (e) {
            console.error('Aliexpress adapter error:', e);
        }

        return { nome, preco, imagem };
    }
};
