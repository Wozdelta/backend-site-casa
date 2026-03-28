const cheerio = require('cheerio');
const { SCORING, ScoredField } = require('../../utils/confidence');

module.exports = {
    name: 'amazon',
    matchDomain: /amazon\.com\.br/,

    async extractStatic(html, genericData) {
        const $ = cheerio.load(html);
        let fields = { nome: [], preco: [], imagem: [] };

        const title = $('#productTitle').text().trim();
        if(title) fields.nome.push(new ScoredField(title, 'amazon:productTitle', 'static', SCORING.ADAPTER_SPECIFIC_HIGH));

        // Preço na Amazon muda constantemente o id. Tentamos as principais 
        let price = $('#corePrice_desktop .a-price-whole').first().text().trim() 
                  + $('#corePrice_desktop .a-price-fraction').first().text().trim();
        
        if (!price || price === '') {
            price = $('.a-price .a-offscreen').first().text().trim();
        }
        
        if(price) fields.preco.push(new ScoredField(price, 'amazon:priceBlock', 'static', SCORING.ADAPTER_SPECIFIC_HIGH));

        let img = $('#imgBlkFront').attr('src') || $('#landingImage').attr('src');
        if(img) fields.imagem.push(new ScoredField(img, 'amazon:landingImage', 'static', SCORING.ADAPTER_SPECIFIC_HIGH));

        return fields;
    }
};
