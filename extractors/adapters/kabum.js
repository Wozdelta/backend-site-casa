const cheerio = require('cheerio');

module.exports = {
    name: 'kabum',
    matchDomain: /kabum\.com\.br/,
    useHeadless: false, // Kabum normally allows static fetching beautifully
    
    async extractStatic(html, genericData) {
        const $ = cheerio.load(html);
        let nome = genericData.nome;
        let preco = genericData.preco;
        let imagem = genericData.imagem;

        // Titulo geralmente é o H1
        if(!nome) {
            nome = $('h1').first().text().trim();
        }

        // Preço à vista puro e limpo
        if(!preco) {
            // A Kabum costuma usar h4 class="finalPrice"
            const kPrice = $('.finalPrice').first().text().trim();
            if(kPrice) {
                preco = kPrice.replace('R$ ', '').replace('R$', '').trim();
            } else {
                // Tenta preco listado normal
                const altPrice = $('h4:contains("R$")').first().text().trim() || $('b:contains("R$")').first().text().trim();
                if(altPrice) preco = altPrice.replace('R$ ', '').trim();
            }
        }

        // Imagem 
        if(!imagem) {
            const imgEl = $('.carousel figure img').first() || $('.gallery figure img').first();
            if(imgEl) imagem = imgEl.attr('src');
        }

        return { nome, preco, imagem };
    }
};
