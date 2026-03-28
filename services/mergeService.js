/**
 * Merge Service (O Funil Ouro).
 * Recebe todas as pontuações extraídas em todas as camadas possíveis.
 * Filtra dados nulos ou estragados. Retorna o Objeto Final Mais Confiável e Metricas.
 */

function determineWinner(fieldsArray) {
    if (!fieldsArray || fieldsArray.length === 0) return null;
    
    // Sort descending by score
    const valid = fieldsArray.filter(f => {
        if (!f.value) return false;
        // Se for string vazia, ou "undefined" literall
        if (typeof f.value === 'string' && (f.value.trim() === '' || f.value === 'undefined')) return false;
        return true;
    });

    if (valid.length === 0) return null;

    valid.sort((a, b) => b.score - a.score);
    return valid[0]; // The highest score
}

/**
 * Normaliza o preço vencedor focado no Brasil (ex: "US$ 10.99", "189,90", "1.500,00", "5000")
 * Se der erro, tenta devolver puro.
 */
function normalizePrice(priceStr) {
    if(typeof priceStr !== 'string') return priceStr;
    
    let str = priceStr.toUpperCase().replace('R$', '').trim();
    // Limpeza pesada p/ "R$1.500,90", "1500.90", "2899,,00" e Amazon ", "
    str = str.replace(/,,/g, ',');
    str = str.replace(/\.,/g, ',');
    
    // Regex pra extrair só digitos, pontuação
    const m = str.match(/[0-9.,]+/);
    if (!m) return str;
    
    return m[0]; // Traz os numeros 
}


function generateMergeReport(extractionsMap) {
    // extractionsMap ex: { nome: [ScoredField, ScoredField ...], preco: [...], imagem: [...] }
    
    const finalReport = {
        dados: {
            nome: '',
            preco: '',
            imagem: ''
        },
        metadata: {
            nomeVencedor: null, // ScoredField Object do ganhador
            precoVencedor: null,
            imagemVencedor: null,
            todasExtrações: extractionsMap
        }
    };

    const winnerName = determineWinner(extractionsMap.nome);
    if(winnerName) {
        finalReport.dados.nome = winnerName.value;
        finalReport.metadata.nomeVencedor = winnerName;
    }

    const winnerPrice = determineWinner(extractionsMap.preco);
    if(winnerPrice) {
        finalReport.dados.preco = normalizePrice(winnerPrice.value);
        finalReport.metadata.precoVencedor = winnerPrice;
    }

    const winnerImage = determineWinner(extractionsMap.imagem);
    if(winnerImage) {
        // Amazon costuma colocar "data:image/base64" num slider, evitar se tiver URL melhor. O sorting faria isso com pontuação.
        let val = winnerImage.value;
        if(Array.isArray(val)) val = val[0]; // Pega primeira se for array
        
        finalReport.dados.imagem = val;
        finalReport.metadata.imagemVencedor = winnerImage;
    }

    return finalReport;
}

module.exports = {
    generateMergeReport
};
