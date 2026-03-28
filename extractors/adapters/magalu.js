const cheerio = require('cheerio');

module.exports = {
    name: 'magalu',
    matchDomain: /magazineluiza\.com\.br/,
    useHeadless: true, // Magalu uses strong bot protections sometimes and react server components. Better with JS evaluation fallback.
    
    async extractStatic(html, genericData) {
        const $ = cheerio.load(html);
        let nome = genericData.nome;
        let preco = genericData.preco;
        let imagem = genericData.imagem;

        if(!nome) nome = $('h1[data-testid="heading-product-title"]').text().trim();
        
        if(!preco) {
            const magaluPrice = $('p[data-testid="price-value"]').text().trim();
            if(magaluPrice) preco = magaluPrice.replace('R$ ', '');
        }

        if(!imagem) {
            imagem = $('img[data-testid="image-selected"]').attr('src');
        }

        return { nome, preco, imagem };
    }
};
