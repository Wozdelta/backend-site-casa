module.exports = {
    name: 'shopee',
    matchDomain: /shopee\.com\.br|shopee/,
    useHeadless: true, // ESSENCIAL! A Shopee é toda renderizada em Client-Side usando JS. O Cheerio não pega nada além da tela de carregamento laranja.

    async extractHeadless(page) {
        // A Shopee necessita de um Headless Extract dedicado
        let nome = '';
        let preco = '';
        let imagem = '';

        try {
            await page.waitForSelector('span.Y35YOM, .WBK02V', { timeout: 8000 }).catch(() => {});
            
            nome = await page.evaluate(() => {
                const el = document.querySelector('span.Y35YOM, .WBK02V span');
                if (el) return el.innerText.trim();
                const metaOgUrl = document.querySelector('meta[property="og:title"]');
                return metaOgUrl ? metaOgUrl.content : '';
            });

            preco = await page.evaluate(() => {
                const el = document.querySelector('.pqy9al, .G27NVy');
                return el ? el.innerText.trim() : '';
            });

            imagem = await page.evaluate(() => {
                const img = document.querySelector('.Kpz1bX, .Bf1r1K, ._1pZ_w');
                if (img) {
                   const bg = img.style.backgroundImage;
                   if (bg) return bg.slice(5, -2);
                   if (img.src) return img.src;
                }
                const metaImg = document.querySelector('meta[property="og:image"]');
                return metaImg ? metaImg.content : '';
            });

        } catch (e) {
             console.error('Shopee falhou em Headless!', e);
        }

        return { nome, preco, imagem };
    }
};
