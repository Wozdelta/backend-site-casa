const cheerio = require('cheerio');

module.exports = {
    name: 'casasbahia',
    matchDomain: /casasbahia\.com\.br/,
    useHeadless: true, 
    forceHeadless: true, 
    
    async extractStatic(html, genericData) {
        const $ = cheerio.load(html);
        let nome = genericData.nome;
        let preco = genericData.preco;
        let imagem = genericData.imagem;

        // Título Fallback
        if(!nome) {
            nome = $('h1').first().text().trim() || $('h1[data-testid="product-title"]').text().trim();
        }

        // Preço Específico
        if(!preco) {
            let cbPrice = $('#product-price').first().text().trim();
            if(!cbPrice) cbPrice = $('span[data-testid="product-price"]').first().text().trim();
            if(!cbPrice) cbPrice = $('.css-180msh, .product-price-value').first().text().trim();
            
            if(cbPrice) {
                preco = cbPrice.replace('R$', '').replace('por', '').trim();
            }
        }

        // Imagem 
        if(!imagem) {
            imagem = $('img[data-testid="product-image-large"]').attr('src') || $('.carousel img').attr('src');
        }

        return { nome, preco, imagem };
    }
};
