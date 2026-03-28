/**
 * Utilitário de Normalização de URLs para o Backend Scraper
 * - Remove UTMs, ref, gclid, fbclid e outros parâmetros de rastreio genéricos.
 * - Uniformiza URLs (http -> https).
 * - Traz regras específicas por e-commerce (ex: limpeza dura na Amazon /dp/).
 */

const REMOVE_PARAMS = [
    'ref', 'ref_', 'src', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term',
    'utm_content', 'gclid', 'fbclid', 'igshid', 'zanpid', 'sellerId', 'srsltid',
    's_kwcid', 'sc_src', 'sc_campaign'
];

function normalizeUrl(rawUrl) {
    let urlObj;
    
    // Fallback pra garantir o protocolo
    if (!rawUrl.startsWith('http')) {
        rawUrl = 'https://' + rawUrl;
    }
    
    try {
        urlObj = new URL(rawUrl);
    } catch(e) {
        return rawUrl; // Retorna suja se falhar violentamente o parser
    }

    urlObj.protocol = 'https:'; // Força https pro cache não duplicar http vs https
    urlObj.hash = ''; // Remove hash completo (#description)

    // Remove tracking queries gerais
    const paramsToDelete = [];
    urlObj.searchParams.forEach((val, key) => {
        const lowerKey = key.toLowerCase();
        if (REMOVE_PARAMS.includes(lowerKey) || lowerKey.startsWith('utm_') || lowerKey.startsWith('s_kwcid')) {
            paramsToDelete.push(key);
        }
    });

    paramsToDelete.forEach(k => urlObj.searchParams.delete(k));

    let cleanUrl = urlObj.toString();

    // ---- Regras Específicas por Domínio ----

    // Amazon: https://www.amazon.com.br/dp/B08N5M.../ref=XYZ -> https://www.amazon.com.br/dp/B08N5M...
    if (urlObj.hostname.includes('amazon.')) {
        const dpMatch = cleanUrl.match(/\/(dp|gp\/product)\/([A-Z0-9]{10})/i);
        if (dpMatch) {
            cleanUrl = `https://${urlObj.hostname}/dp/${dpMatch[2]}`;
        }
    }

    // Mercado Livre: remover tracking longo após o ID do produto ou ?searchVariation
    if (urlObj.hostname.includes('mercadolivre.com')) {
        // ML as vezes coloca id na URL inteira: /MLB-1234-produto -> fica limpo já com o URL params delete
        // Remover trailing tracking se sobrar
        cleanUrl = cleanUrl.split('#')[0].split('?')[0]; 
    }
    
    // Shopee: A shopee as vezes tem ID na query ou no patch...
    // Deixa padrão mas garante que as variações estão limpas. Remove ?xpt=
    if (urlObj.hostname.includes('shopee.')) {
        if (urlObj.searchParams.has('xpt')) {
            urlObj.searchParams.delete('xpt');
            cleanUrl = urlObj.toString();
        }
    }

    return cleanUrl;
}

module.exports = {
    normalizeUrl
};
