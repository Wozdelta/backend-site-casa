const cheerio = require('cheerio');
const { SCORING, ScoredField } = require('../../utils/confidence');

module.exports = {
    name: 'kabum',
    matchDomain: /kabum\.com\.br/,

    async extractStatic(html, genericData) {
        const $ = cheerio.load(html);
        let fields = { nome: [], preco: [], imagem: [] };

        const title = $('h1').text().trim();
        if(title) fields.nome.push(new ScoredField(title, 'kabum:h1', 'static', SCORING.ADAPTER_SPECIFIC_HIGH));

        let ptPrice = $('.finalPrice').first().text().trim() || $('h4.sc-5492fae6-2').first().text().trim();
        if(ptPrice) fields.preco.push(new ScoredField(ptPrice, 'kabum:finalPrice', 'static', SCORING.ADAPTER_SPECIFIC_HIGH));

        let imgEl = $('.selectedImage img').attr('src') || $('img.imageGallery').first().attr('src');
        if(imgEl) fields.imagem.push(new ScoredField(imgEl, 'kabum:selectedImage', 'static', SCORING.ADAPTER_SPECIFIC_HIGH));

        return fields;
    }
};
