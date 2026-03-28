/**
 * Cache Service Avançado com Persistência em Disco e Expiração (TTL de 24 horas)
 * Evolução saindo da RAM e salvando estados de falhas para análise.
 */
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '..', 'cache_db.json');
const TTL_HOURS = 24;

// Carregamos na RAM para velocidade, sincronizamos no disco 
let db = {};

// Startup Hook (Lê do disco ao ligar o Backend na Render)
function loadDB() {
    try {
        if(fs.existsSync(CACHE_FILE)) {
            const raw = fs.readFileSync(CACHE_FILE, 'utf8');
            db = JSON.parse(raw);
            console.log(`[CacheService] Carregou DB do disco! Chaves salvas: ${Object.keys(db).length}`);
        } else {
            console.log('[CacheService] Banco JSON zerado. Iniciando...');
        }
    } catch(e) {
        console.error('[CacheService] Erro ao carregar cache do disco:', e.message);
        db = {};
    }
}
loadDB();

/**
 * Persiste cache sincronamente (pra não perder se o script explodir)
 */
function saveDB() {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(db, null, 2));
    } catch(e) {
        console.error('[CacheService] Falhou em salvar no HD as raspagens', e);
    }
}

/**
 * Pega um valor e valída o Tempo de Vida
 */
function get(urlHash) { // Normalizada
    // Busca na Tabela Hash 
    const record = db[urlHash];
    if(!record) return null;

    // Time Travel validation
    const now = Date.now();
    const diff = now - record.timestamp;
    const hours = diff / (1000 * 60 * 60);
    
    // Se o preço for muito antigo, force o scraper a readquirir o preço hoje! Vence rápido no e-commerce!
    if(hours >= TTL_HOURS) {
         console.log(`[CacheService] Chave ${urlHash} expurgada por tempo.`);
         delete db[urlHash];
         saveDB(); // Expurga cache
         return null; 
    }
    
    return record.payload; // O Payload final Rico
}

function set(urlHash, payload) {
    db[urlHash] = {
        timestamp: Date.now(),
        payload: payload
    };
    saveDB();
}

module.exports = {
    get,
    set
};
