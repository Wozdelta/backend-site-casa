const cheerio = require('cheerio');

module.exports = {
    name: 'havan',
    matchDomain: /havan\.com\.br/,
    useHeadless: false, 
    
    async extractStatic(html, genericData) {
        const $ = cheerio.load(html);
        let nome = genericData.nome;
        let preco = genericData.preco;
        let imagem = genericData.imagem;

        // Se Metatags Genéricas e SEO não contiverem o H1 limpo
        if(!nome) {
            nome = $('h1').first().text().trim() || $('.vtex-store-components-3-x-productNameContainer span').text().trim();
        }

        // Preço da VTEX (Plataforma padrão de grandes varejos que a Havan usa)
        if(!preco) {
            const vtPrice = $('.vtex-store-components-3-x-sellingPriceValue').first().text().trim() || $('.vtex-product-price-1-x-sellingPriceValue').first().text().trim();
            const altPrice = $('.price-tag').first().text().trim() || $('.price-best-price').last().text().trim();

            const finalP = vtPrice || altPrice;
            if(finalP) {
                 preco = finalP.replace('R$', '').trim();
            }
        }

        // Imagem VTEX Padrao
        if(!imagem) {
            imagem = $('.vtex-store-components-3-x-productImageTag').attr('src') || $('img.vtex-store-components-3-x-imageElement').attr('src');
        }

        return { nome, preco, imagem };
    }
};
