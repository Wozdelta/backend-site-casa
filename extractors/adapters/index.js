const fs = require('fs');
const path = require('path');

const adapters = [];

// Auto-carrega todos os adapters JS (amazon.js, mercadolivre.js, etc)
fs.readdirSync(__dirname).forEach(file => {
    if (file !== 'index.js' && file.endsWith('.js')) {
        const adapter = require(path.join(__dirname, file));
        adapters.push(adapter);
    }
});

function getAdapter(hostname) {
    for (let adapter of adapters) {
        // O adapter.matchDomain é um regex ou string que verifica se essa regra atende
        if (adapter.matchDomain.test(hostname)) {
            return adapter;
        }
    }
    return null;
}

module.exports = { getAdapter };
