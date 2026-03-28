const { SCORING, ScoredField } = require('../../utils/confidence');

module.exports = {
    name: 'shopee',
    matchDomain: /shopee\.com/,
    useHeadless: true,
    forceHeadless: true, 

    async extractHeadless(page) {
        let fields = { nome: [], preco: [], imagem: [] };

        try {
            await page.waitForSelector('span.Y35YOM, .WBK02V, .IM1m0s', { timeout: 12000 }).catch(() => {});
            
            let nomeTitle = await page.evaluate(() => {
                const el = document.querySelector('span.Y35YOM') || 
                           document.querySelector('.WBK02V span') ||
                           document.querySelector('.IM1m0s'); // Nova classe shopee
                if (el) return el.innerText.trim();
                return '';
            });

            // Rejeita bloqueios Shopee
            if (nomeTitle && !nomeTitle.includes('Shopee Brasil |') && !nomeTitle.includes('Faça Login')) {
                fields.nome.push(new ScoredField(nomeTitle, 'shopee:headless:title', 'headless', SCORING.ADAPTER_SPECIFIC_HIGH));
            }

            let pValue = await page.evaluate(() => {
                const el = document.querySelector('.pqy9al') || 
                           document.querySelector('.G27NVy') ||
                           document.querySelector('.pqy9al');
                return el ? el.innerText.trim() : '';
            });

            if(pValue) {
                fields.preco.push(new ScoredField(pValue, 'shopee:headless:price', 'headless', SCORING.ADAPTER_SPECIFIC_HIGH));
            }

            let imgSrc = await page.evaluate(() => {
                const img = document.querySelector('.Kpz1bX') || 
                            document.querySelector('.Bf1r1K') ||
                            document.querySelector('._1pZ_w');
                if (img) {
                   const bg = img.style.backgroundImage;
                   if (bg) return bg.slice(5, -2);
                   if (img.src) return img.src;
                }
                const metaImg = document.querySelector('meta[property="og:image"]');
                return metaImg ? metaImg.content : '';
            });

            if(imgSrc) {
                fields.imagem.push(new ScoredField(imgSrc, 'shopee:headless:img', 'headless', SCORING.ADAPTER_SPECIFIC_HIGH));
            }

        } catch (e) {
             console.error('Shopee falhou em Headless!', e);
        }

        return fields;
    }
};
