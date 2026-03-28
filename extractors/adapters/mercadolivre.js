const cheerio = require('cheerio');

module.exports = {
    name: 'mercadolivre',
    matchDomain: /mercadolivre\.com\.br|produto\.mercadolivre/,
    useHeadless: false, // ML usually allows classic bots well structured
    
    // Fallback estatico 
    async extractStatic(html, genericData) {
        const $ = cheerio.load(html);
        let nome = genericData.nome;
        let preco = genericData.preco;
        let imagem = genericData.imagem;

        // Se checagem generica falhou pro Titulo
        if(!nome) {
            nome = $('.ui-pdp-title').text().trim();
        }

        // Preço exato do ML que o Genérico sofre
        if(!preco) {
            const inteiro = $('.ui-pdp-price__second-line .andes-money-amount__fraction').first().text().trim();
            const centavos = $('.ui-pdp-price__second-line .andes-money-amount__cents').first().text().trim();
            if(inteiro) preco = centavos ? `${inteiro},${centavos}` : `${inteiro},00`;
        }

        // Imagem principal fallback
        if(!imagem) {
            imagem = $('img.ui-pdp-image.ui-pdp-gallery__figure__image').attr('src');
            // Ou tenta o link da imagem primeira do gallery data
            if(!imagem) imagem = $('.ui-pdp-gallery img').attr('src');
            // Remove wedsites resize
            if(imagem) imagem = imagem.replace('w_400', 'w_1000').replace('w_800', 'w_1000');
        }

        return { nome, preco, imagem };
    }
};
