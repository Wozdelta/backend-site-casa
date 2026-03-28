const axios = require('axios');
const cheerio = require('cheerio');
const { SCORING, ScoredField } = require('../utils/confidence');

async function fetchHtml(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            timeout: 12000 // Aumentado um pouco a tolerancia
        });
        return { data: response.data, status: 'parsed_ok' };
    } catch (error) {
        if (error.response && [403, 429].includes(error.response.status)) {
            return { data: null, status: 'blocked' };
        }
        if (error.code === 'ECONNABORTED') return { data: null, status: 'timeout' };
        return { data: null, status: 'request_failed' };
    }
}

/**
 * Escaneia o HTML e devolve o Mapa de Extrações preenchido com Scores de Confiança.
 */
function parseGenericSEO(html, originLayer = 'static') {
    const $ = cheerio.load(html);
    
    // Arrays de pontuadores onde tudo cai num balde de concorrência.
    const fields = { nome: [], preco: [], imagem: [] };
    
    // [HEURÍSTICA LIXO] Titulo de página genérico 
    let t = $('title').text().trim();
    if (t) fields.nome.push(new ScoredField(t.split(' | ')[0].split(' - ')[0], 'page:title', originLayer, SCORING.PAGE_TITLE_TAG));
    let tH1 = $('h1').first().text().trim();
    if (tH1) fields.nome.push(new ScoredField(tH1, 'heuristic:h1', originLayer, SCORING.HEURISTIC_H1));

    // [OPEN GRAPH E TWITTER] - Alta qualidade e super comum no Brasil
    let ogTitle = $('meta[property="og:title"]').attr('content');
    if (ogTitle) fields.nome.push(new ScoredField(ogTitle.split(' | ')[0], 'og:title', originLayer, SCORING.OPEN_GRAPH));
    let twitterTitle = $('meta[name="twitter:title"]').attr('content');
    if (twitterTitle) fields.nome.push(new ScoredField(twitterTitle, 'twitter:title', originLayer, SCORING.TWITTER_CARD));

    let ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) fields.imagem.push(new ScoredField(ogImage, 'og:image', originLayer, SCORING.OPEN_GRAPH));
    let twitterImage = $('meta[name="twitter:image"]').attr('content');
    if (twitterImage) fields.imagem.push(new ScoredField(twitterImage, 'twitter:image', originLayer, SCORING.TWITTER_CARD));

    let ogPrice = $('meta[property="product:price:amount"]').attr('content');
    if (ogPrice) fields.preco.push(new ScoredField(ogPrice, 'og:product:price', originLayer, SCORING.OPEN_GRAPH));


    // [ESTRUTURA JSON-LD SCHEMA.ORG] - Grau Diamante Padrão do Google
    $('script[type="application/ld+json"]').each((i, el) => {
        try {
            const data = JSON.parse($(el).html());
            
            const findProduct = (obj) => {
                if (!obj) return null;
                // Busca em Grafo (Ex: YoastSEO cria "@graph": [ Product, WebPage, Organization ])
                if (obj['@graph'] && Array.isArray(obj['@graph'])) {
                    for (let node of obj['@graph']) if (node['@type'] === 'Product') return node;
                }
                
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
                if (product.name) fields.nome.push(new ScoredField(product.name, 'json-ld:product.name', originLayer, SCORING.JSON_LD_PRODUCT));
                
                if (product.image) {
                   const imgVal = Array.isArray(product.image) ? product.image[0] : (product.image.url || product.image);
                   if (typeof imgVal === 'string') fields.imagem.push(new ScoredField(imgVal, 'json-ld:product.image', originLayer, SCORING.JSON_LD_PRODUCT));
                }
                
                // Tratar Price / Offers Aggregate
                if (product.offers) {
                    const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
                    
                    if (offer.price) {
                        fields.preco.push(new ScoredField(""+offer.price, 'json-ld:offer.price', originLayer, SCORING.JSON_LD_OFFER));
                    } else if (offer.lowPrice) {
                        // Trata AggregateOffer trazendo o Menor (lowPrice)
                        fields.preco.push(new ScoredField(""+offer.lowPrice, 'json-ld:aggregate.lowPrice', originLayer, SCORING.JSON_LD_OFFER));
                    }
                }
            }
        } catch(e) {}
    });

    // [HEURISTICA DE DESESPERO - PREÇO VIA REGEX NO BODY INTEIRO]
    if (fields.preco.length === 0) {
        // Busca R$ seguido de numeros e virgula no body sem javascript
        const bodyText = $('body').text().replace(/\s+/g, ' ');
        const regexBR = /(?:R\$|BRL)\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/g;
        let match;
        let foundPrices = [];
        let count = 0;
        while ((match = regexBR.exec(bodyText)) !== null && count < 3) {
            foundPrices.push(match[1]);
            count++;
        }
        if (foundPrices.length > 0) {
            // O primeiro preço encontrado costuma ser o correto ou menu, pegamos como lixo 20 pts
            fields.preco.push(new ScoredField(foundPrices[0], 'heuristic:regex-body', originLayer, SCORING.REGEX_BODY_PRICE));
        }
    }

    // [HEURISTICA DE DESESPERO - IMAGENS NA EXTREMIDADE HTML]
    if (fields.imagem.length === 0) {
        let firstImg = $('img').first().attr('src');
        if (firstImg && firstImg.startsWith('http')) {
            fields.imagem.push(new ScoredField(firstImg, 'heuristic:first-img-body', originLayer, SCORING.HEURISTIC_FIRST_IMG));
        }
    }

    // Retorna o Mapping Completo! Nenhuma decisão é tomada aqui. O `mergeService` vira o juiz!
    return fields;
}

module.exports = {
    fetchHtml,
    parseGenericSEO
};
