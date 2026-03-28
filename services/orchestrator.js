const cacheService = require('./cacheService');
const genericExtractor = require('../extractors/generic');
const adapters = require('../extractors/adapters');
const headless = require('../extractors/headless');
const { determineWinner, generateMergeReport } = require('./mergeService');
const { logExtractionResults } = require('./loggerService');
const { normalizeUrl } = require('../utils/normalizer');
const { SCORING } = require('../utils/confidence');

async function processUrl(urlOriginal) {
    const startTime = Date.now();
    let statusTecnico = 'started';

    // 1. URL Normalization
    const url = normalizeUrl(urlOriginal);

    // 2. Persistent Cache
    const cached = cacheService.get(url);
    if (cached) {
        logExtractionResults(url, Date.now() - startTime, cached, 'CACHED');
        return cached;
    }

    let hostname;
    try {
        hostname = new URL(url).hostname;
    } catch(e) {
        statusTecnico = 'invalid_url';
        return generateErrorResponse(statusTecnico);
    }
    
    const adapter = adapters.getAdapter(hostname);
    
    // Este mapa é um balde onde todos os extratores (Estático, Headless, Adapter) vão jogar todos os ScoredFields!
    let allExtractions = {
        nome: [],
        preco: [],
        imagem: []
    };

    try {
        // [Fase 1] Requisição Dinamica Rápida Estática (Cheerio / DOM)
        if (!adapter || !adapter.forceHeadless) {
            const { data: htmlSource, status } = await genericExtractor.fetchHtml(url);
            statusTecnico = status;

            if (htmlSource) {
                // Generico extrai do JSON-LD, OG, etc
                const genericFields = genericExtractor.parseGenericSEO(htmlSource, 'static_generic');
                mergeArrays(allExtractions, genericFields);
                
                // Se o adapter roda estático, joga as regras customizadas tbm
                if (adapter && adapter.extractStatic) {
                    const adapterFields = await adapter.extractStatic(htmlSource, {});
                    mergeArrays(allExtractions, adapterFields);
                }
            }
        }

        // [Fase 2] Avaliação Tática: Ligar robô Headless?
        // Vamos verificar rapidamente se os melhores campos atuais alcançam um teto mínimo.
        let reportMock = generateMergeReport(allExtractions);
        const meta = reportMock.metadata;

        // Se obrigar Headless (ex: Shopee) OU Falhamos Nome/Preço OU Score de Preço tá um Lixo (< 30) -> Sobe Headless Chrome!
        const needsHeadless = (!meta.nomeVencedor || !meta.precoVencedor || meta.precoVencedor.score < 40) 
                              || (!adapter || adapter.useHeadless || adapter.forceHeadless);
        
        if (needsHeadless) {
            statusTecnico = statusTecnico === 'blocked' || statusTecnico === 'timeout' ? 'headless_forced' : 'headless_upgrade';
            console.log(`🤖 Iniciando Motor Headless Universal. Motivo: [${statusTecnico}]`);
            
            const fallbackAdapter = adapter || { name: 'genérico-robusto', useHeadless: true };
            const headlessFields = await headless.extractWithBrowser(url, fallbackAdapter);
            
            mergeArrays(allExtractions, headlessFields);
        }

        // [Fase Final] - Tribunal. Quem ganhou as maiores pontuações?
        const finalReport = generateMergeReport(allExtractions);
        
        // Formatar Resposta Clássica + Analytics pra não quebrar Front end
        const finalResponse = {
            nome: finalReport.dados.nome || '',
            preco: finalReport.dados.preco || '',
            imagem: finalReport.dados.imagem || '',
            url: url,
            origem: adapter ? adapter.name : 'generico',
            status: 'error',
            campos_preenchidos: [],

            // --- PAYLOAD RICO DE DEBUGGING PRA TELEMETRIA ----
            analytics: {
                statusTecnico: statusTecnico,
                tempoTotalMs: Date.now() - startTime,
                report: finalReport.metadata
            }
        };

        // Status 
        if(finalResponse.nome) finalResponse.campos_preenchidos.push('nome');
        if(finalResponse.preco) finalResponse.campos_preenchidos.push('preco');
        if(finalResponse.imagem) finalResponse.campos_preenchidos.push('imagem');

        if (finalResponse.campos_preenchidos.length === 3) finalResponse.status = 'success';
        else if (finalResponse.campos_preenchidos.length > 0) finalResponse.status = 'partial';
        else finalResponse.status = 'error';

        // Cache persistent
        if (finalResponse.status !== 'error') {
             cacheService.set(url, finalResponse);
        }

        logExtractionResults(url, finalResponse.analytics.tempoTotalMs, finalReport, statusTecnico);
        return finalResponse;

    } catch (err) {
        console.error("Erro critico na Orquestração Master:", err);
        return generateErrorResponse('parse_failed', err.message); 
    }
}

function mergeArrays(target, source) {
    if(!source) return;
    target.nome.push(...(source.nome || []));
    target.preco.push(...(source.preco || []));
    target.imagem.push(...(source.imagem || []));
}

function generateErrorResponse(statusCode, msg = '') {
    return {
        nome: '', preco: '', imagem: '', status: 'error', campos_preenchidos: [],
        analytics: { statusTecnico: statusCode, msg }
    };
}

module.exports = { processUrl };
