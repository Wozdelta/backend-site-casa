/**
 * Modelagem de Confidence Score (Confiança de Dados)
 * O sistema para de "sobrescrever" valores e passa a jogar as descobertas numa Arena.
 * Apenas o objeto com o melhor SCORING vence.
 */

const SCORING = {
    // 90-100: Alta Fidelidade (Dados estruturados ou Seletores nativos precisos testados)
    JSON_LD_PRODUCT: 95,
    JSON_LD_OFFER: 90,
    API_BACKDOOR: 99, 
    ADAPTER_SPECIFIC_HIGH: 92, // Se o arquivo magalu.js ler o preço primário do HTML
    
    // 70-89: Média-Alta Fidelidade (OpenGraph, Title, Seletores secundarios)
    OPEN_GRAPH: 80,
    TWITTER_CARD: 75,
    ADAPTER_SPECIFIC_FALLBACK: 70, // Ex: Leu o preço parcelado e multiplicou
    PAGE_TITLE_TAG: 65,

    // 40-69: Heurísticas Avançadas
    HEURISTIC_H1: 50,
    HEURISTIC_FIRST_IMG: 40,
    
    // 1-39: Desespero / Última Camada Regex
    REGEX_BODY_PRICE: 20
};

/**
 * Fabrica um Field padronizado pra Merge Arena
 */
class ScoredField {
    constructor(value, origin, layer, score) {
        this.value = value;
        this.origin = origin; // ex: 'json-ld:product.name', 'og:title'
        this.layer = layer; // ex: 'static', 'headless', 'heuristic'
        this.score = score || 0;
    }
}

module.exports = {
    SCORING,
    ScoredField
};
