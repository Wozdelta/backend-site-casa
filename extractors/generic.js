const axios = require('axios');
const cheerio = require('cheerio');

async function fetchHtml(url) {
    try {
        // Usa um user agent real para evitar 403 berrantes e imita aceitar html.
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            timeout: 10000 // 10 sec para o request padrao senao joga pro headless
        });
        return response.data;
    } catch (error) {
        return null;
    }
}

function parseGenericSEO(html) {
    const $ = cheerio.load(html);
    let nome = '';
    let preco = '';
    let imagem = '';

    // 1. Procurar JSON-LD Universal
    $('script[type="application/ld+json"]').each((i, el) => {
        try {
            const data = JSON.parse($(el).html());
            const findProduct = (obj) => {
                if (!obj) return null;
                if (obj['@type'] === 'Product' || obj['@type'] === 'http://schema.org/Product') return obj;
                if (Array.isArray(obj)) {
                    for (let item of obj) { const p = findProduct(item); if (p) return p; }
                }
                if (typeof obj === 'object') {
                    for (let key in obj) { const p = findProduct(obj[key]); if (p) return p; }
                }
                return null;
            };
            const product = findProduct(data);
            if (product) {
                if (!nome && product.name) nome = product.name;
                if (!imagem && product.image) {
                   imagem = Array.isArray(product.image) ? product.image[0] : (product.image.url || product.image);
                }
                if (!preco && product.offers) {
                    const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
                    if (offer.price) preco = parseFloat(offer.price).toLocaleString('pt-BR', {minimumFractionDigits:2});
                }
            }
        } catch(e) {}
    });

    // 2. OpenGraph Ouro
    if(!nome) nome = $('meta[property="og:title"]').attr('content') || $('title').text();
    if(!imagem) imagem = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
    
    // Tenta preco basico OG
    if(!preco) {
        const p = $('meta[property="product:price:amount"]').attr('content');
        if (p) preco = parseFloat(p).toLocaleString('pt-BR', {minimumFractionDigits:2});
    }

    if(nome) {
        nome = nome.split(' | ')[0].split(' - ')[0]; // Limpa
    }

    return { nome, preco, imagem };
}

module.exports = {
    fetchHtml,
    parseGenericSEO
};
