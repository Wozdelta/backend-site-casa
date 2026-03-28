const cheerio = require('cheerio');
const { SCORING, ScoredField } = require('../../utils/confidence');

module.exports = {
    name: 'magalu',
    matchDomain: /magazineluiza\.com\.br/,

    async extractStatic(html, genericData) {
        const $ = cheerio.load(html);
        let fields = { nome: [], preco: [], imagem: [] };

        const title = $('h1[data-testid="heading-product-title"]').text().trim();
        if(title) fields.nome.push(new ScoredField(title, 'magalu:heading', 'static', SCORING.ADAPTER_SPECIFIC_HIGH));

        const price = $('p[data-testid="price-value"]').text().trim() || $('p[data-testid="price-original"]').first().text().trim();
        if(price) fields.preco.push(new ScoredField(price, 'magalu:price-value', 'static', SCORING.ADAPTER_SPECIFIC_HIGH));
        
        let img = $('img[data-testid="image-selected"]').attr('src');
        if(img) fields.imagem.push(new ScoredField(img, 'magalu:image-selected', 'static', SCORING.ADAPTER_SPECIFIC_HIGH));

        return fields;
    }
};
