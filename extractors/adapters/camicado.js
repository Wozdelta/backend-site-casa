const cheerio = require('cheerio');
const { SCORING, ScoredField } = require('../../utils/confidence');

module.exports = {
    name: 'camicado',
    matchDomain: /camicado\.com\.br/,
    useHeadless: true, 

    async extractStatic(html, genericData) {
        const $ = cheerio.load(html);
        let fields = { nome: [], preco: [], imagem: [] };

        const val = $('.best-price').first().text().trim() || $('.sales-price').first().text().trim() || $('[data-testid="product-price"]').text().trim();
        if (val) {
            let p = val.replace(/[R$\s]/g, '').trim();
            fields.preco.push(new ScoredField(p, 'camicado:price', 'static', SCORING.ADAPTER_SPECIFIC_HIGH));
        }

        let nome = $('h1').first().text().trim();
        if (nome) fields.nome.push(new ScoredField(nome, 'camicado:h1', 'static', SCORING.ADAPTER_SPECIFIC_HIGH));

        return fields;
    }
};
