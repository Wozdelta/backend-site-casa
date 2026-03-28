const cacheService = require('./cacheService');
const genericExtractor = require('../extractors/generic');
const adapters = require('../extractors/adapters');
const headless = require('../extractors/headless');

async function processUrl(url) {
    // 1. Verificacao de Cache (Super Rapido)
    const cached = cacheService.get(url);
    if (cached) {
        console.log('📦 Encontrado em cache. Retornando instante!');
        return cached;
    }

    // 2. Extrair Hostname para Identificacao
    let hostname;
    try {
        hostname = new URL(url).hostname;
    } catch(e) {
        throw new Error("URL inválida.");
    }
    
    const adapter = adapters.getAdapter(hostname);
    
    // Payload padronizado exigido
    let result = {
        nome: '',
        preco: '',
        imagem: '',
        url: url,
        origem: adapter ? adapter.name : 'generico',
        status: 'error',
        campos_preenchidos: []
    };

    try {
        console.log(`🧭 Iniciando Cascata -> Dominio: ${hostname}`);
        
        let extractedData = {};
        
        // Se a loja não requerer obrigatoriamente Puppeteer pra funcionar, tenta rápido com `fetch` (Cheerio)
        let htmlSource = null;
        if (!adapter || !adapter.forceHeadless) {
            console.log('⚡ Camada 1: Tentando Request Rápido Estático (Axios + Cheerio)...');
            htmlSource = await genericExtractor.fetchHtml(url);
            if(htmlSource) {
                const genericData = genericExtractor.parseGenericSEO(htmlSource);
                extractedData = { ...extractedData, ...genericData };
                
                if (adapter && adapter.extractStatic) {
                    const adapterStatic = await adapter.extractStatic(htmlSource, extractedData);
                    extractedData = { ...extractedData, ...adapterStatic };
                }
            } else {
                console.log('❌ Request Estático retornou vázio ou foi bloqueado pelo Anti-Bot (403).');
            }
        }

        // Se o dominio exige Headless (ex: Shopee) ou se falhamos em capturar Nome e Preço (Defesa Implacável)
        // Vamos engatilhar o Puppeteer (Motor Pesado e Lento, mas que lê a tela idêntica a um Humano real)
        const needsHeadless = (!extractedData.nome || !extractedData.preco) 
                              && (!adapter || adapter.useHeadless || adapter.forceHeadless || !adapter);
        
        if (needsHeadless) {
            console.log(`🤖 Camada 2: Dados insuficientes / Anti-bot detectado. Ligando O Motor Universal Headless Browser...`);
            // Passamos um adapter fake-generico se for null
            const fallbackAdapter = adapter || { name: 'genérico-robusto', useHeadless: true };
            const headlessData = await headless.extractWithBrowser(url, fallbackAdapter);
            
            // O Headless pode ter encontrado algo que a Camada 1 não achou
            if (headlessData.nome) extractedData.nome = headlessData.nome;
            if (headlessData.preco) extractedData.preco = headlessData.preco;
            if (headlessData.imagem) extractedData.imagem = headlessData.imagem;
        }

        // Merge dos resultados
        result.nome = extractedData.nome || '';
        result.preco = extractedData.preco || '';
        result.imagem = extractedData.imagem || '';

        // Filtro Limpador Global de Formatação Errônea (ex: Mercado Livre/Amazon enviando 2899,,00)
        if (result.preco) {
            result.preco = result.preco.replace(/,,/g, ',');
            result.preco = result.preco.replace(/\.,/g, ',');
        }

        // Status Final
        const preenchidos = [];
        if(result.nome) preenchidos.push('nome');
        if(result.preco) preenchidos.push('preco');
        if(result.imagem) preenchidos.push('imagem');
        result.campos_preenchidos = preenchidos;

        if (preenchidos.length === 3) result.status = 'success';
        else if (preenchidos.length > 0) result.status = 'partial';
        else result.status = 'error';

        // Salvar em cache (Apenas Sucesso ou Parcial bom)
        if (result.status !== 'error') {
            cacheService.set(url, result);
        }

        return result;

    } catch (err) {
        console.error("Erro critico no processUrl:", err);
        return result; 
    }
}

module.exports = { processUrl };
