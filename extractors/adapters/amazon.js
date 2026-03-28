const cheerio = require('cheerio');

module.exports = {
    name: 'amazon',
    matchDomain: /amazon\.com\.br/,
    useHeadless: true, // Amazon é fortíssima em block anti-scrap, muitas vezes dá 503 e pede CAPTCHA, então Headless em caso de falha é bom.
    
    // Amazon muda os seletores constantemente. O Genérico quase sempre funciona aqui (OG Tags).
    async extractStatic(html, genericData) {
        const $ = cheerio.load(html);
        let nome = genericData.nome;
        let preco = genericData.preco;
        let imagem = genericData.imagem;

        if(!nome) nome = $('#productTitle').text().trim();
        
        if(!preco) {
            const pt = $('.a-price-whole').first().text().trim();
            const fr = $('.a-price-fraction').first().text().trim();
            if(pt) preco = pt.replace(/\./g, '').replace(/,/g, '') + (fr ? `,${fr}` : ',00');
        }

        if(!imagem) {
            imagem = $('#landingImage').attr('data-old-hires') || $('#landingImage').attr('src');
        }

        return { nome, preco, imagem };
    }
};
