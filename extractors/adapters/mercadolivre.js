const cheerio = require('cheerio');
const { SCORING, ScoredField } = require('../../utils/confidence');

module.exports = {
    name: 'mercadolivre',
    matchDomain: /mercadolivre\.com\.br/,

    async extractStatic(html, genericData) {
        const $ = cheerio.load(html);
        let fields = { nome: [], preco: [], imagem: [] };

        // Nomes
        const titleAd = $('.ui-pdp-title').text().trim();
        if(titleAd) fields.nome.push(new ScoredField(titleAd, 'ui-pdp-title', 'static', SCORING.ADAPTER_SPECIFIC_HIGH));
        const catalogTitle = $('.ui-pdp-header__title-container h1').text().trim();
        if(catalogTitle) fields.nome.push(new ScoredField(catalogTitle, 'catalog-title', 'static', SCORING.ADAPTER_SPECIFIC_FALLBACK));

        // Precos (ML tem container da esquerda e direita, as vezes promocional)
        // Tentamos o principal .andes-money-amount--cents-superscript
        const mainPrice = $('.ui-pdp-price__second-line .andes-money-amount__fraction').first().text().trim();
        const mainCents = $('.ui-pdp-price__second-line .andes-money-amount__cents').first().text().trim() || '00';
        if(mainPrice) {
            fields.preco.push(new ScoredField(`${mainPrice},${mainCents}`, 'ml-price-main', 'static', SCORING.ADAPTER_SPECIFIC_HIGH));
        }

        const promoPrice = $('.ui-pdp-header__price .andes-money-amount__fraction').text().trim();
        if(promoPrice) {
            fields.preco.push(new ScoredField(promoPrice, 'ml-price-promo', 'static', SCORING.ADAPTER_SPECIFIC_FALLBACK));
        }

        // Imagem principal HD
        let imgAd = $('.ui-pdp-gallery__figure img').attr('src');
        if (imgAd) {
             fields.imagem.push(new ScoredField(imgAd, 'ml-gallery-main', 'static', SCORING.ADAPTER_SPECIFIC_HIGH));
        }
        let imgCatalog = $('.ui-pdp-gallery--column img').attr('src');
        if(imgCatalog) fields.imagem.push(new ScoredField(imgCatalog, 'ml-gallery-catalog', 'static', 85));

        return fields;
    }
};
