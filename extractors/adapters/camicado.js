module.exports = {
    name: 'camicado',
    matchDomain: /camicado\.com\.br/,
    useHeadless: true, // Se o axios barrar, o Headless rola e salva a pátria

    async extractStatic(html, genericData) {
        let { nome, preco, imagem } = genericData;
        const cheerio = require('cheerio');
        const $ = cheerio.load(html);

        if (!preco) {
            // Tenta achar com o seletor visual nativo novo
            const val = $('.best-price').first().text().trim() ||
                        $('.sales-price').first().text().trim() ||
                        $('[data-testid="product-price"]').text().trim();
            if (val) {
                preco = val.replace(/[R$\s]/g, '').trim();
            }
        }

        if (!nome) {
            nome = $('h1').first().text().trim();
        }

        return { nome, preco, imagem };
    }
};
