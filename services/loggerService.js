/**
 * Logger Service
 * Centraliza os painéis de debug no CLI pra desenvolvedores ou Docker logs.
 */
function logExtractionResults(urlNormalizada, tempoTotalMs, finalReport, statusTecnico) {
    console.log(`\n================= RELATÓRIO DE SCAPE =====================`);
    console.log(`[ALVO]     URL Normalizada:  ${urlNormalizada}`);
    console.log(`[STATUS]   Status Técnico:   ${statusTecnico.toUpperCase()}`);
    console.log(`[PERF]     Tempo Gasto:      ${tempoTotalMs}ms`);

    const ds = finalReport?.dados;
    const meta = finalReport?.metadata;

    console.log(`[RESULT]   Campos Ativos:    NOME = ${!!ds?.nome} | PRECO = ${!!ds?.preco} | IMG = ${!!ds?.imagem}`);

    if (meta?.nomeVencedor) {
        console.log(`   🔸 [NOME] Vencedor: Origem (${meta.nomeVencedor.origin}) | Layer (${meta.nomeVencedor.layer}) | Score (${meta.nomeVencedor.score})`);
    }

    if (meta?.precoVencedor) {
        console.log(`   🔸 [PRECO] Vencedor: Origem (${meta.precoVencedor.origin}) | Layer (${meta.precoVencedor.layer}) | Score (${meta.precoVencedor.score}) -> R$ ${ds?.preco}`);
    }

    if (meta?.imagemVencedor) {
        let val = meta.imagemVencedor.value;
        if(Array.isArray(val) && val.length > 0) val = val[0];
        
        console.log(`   🔸 [IMG] Vencedor: Origem (${meta.imagemVencedor.origin}) | Layer (${meta.imagemVencedor.layer}) | Score (${meta.imagemVencedor.score})`);
    }

    // Listando fracassados se houver debug
    // if(meta?.todasExtracoes) { ... } // Pode ser adicionado futuramente 
    console.log(`==========================================================\n`);
}

module.exports = {
    logExtractionResults
};
