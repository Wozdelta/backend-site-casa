const cheerio = require('cheerio');
const { SCORING, ScoredField } = require('../../utils/confidence');

module.exports = {
    name: 'havan',
    matchDomain: /havan\.com\.br/,

    async extractStatic(html, genericData) {
        const $ = cheerio.load(html);
        let fields = { nome: [], preco: [], imagem: [] };

        const title = $('.product-name h1').text().trim() || $('.page-title h1').text().trim();
        if(title) fields.nome.push(new ScoredField(title, 'havan:h1', 'static', SCORING.ADAPTER_SPECIFIC_HIGH));

        const price = $('.price-box .price').first().text().trim();
        if(price) fields.preco.push(new ScoredField(price, 'havan:price-box', 'static', SCORING.ADAPTER_SPECIFIC_HIGH));

        const img = $('.product-image-photo').attr('src');
        if(img) fields.imagem.push(new ScoredField(img, 'havan:photo', 'static', SCORING.ADAPTER_SPECIFIC_HIGH));

        return fields;
    }
};
