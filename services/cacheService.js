const cache = new Map();

module.exports = {
    get: (url) => cache.get(url),
    set: (url, data) => {
        // Simple cache
        console.log(`Salvando [${url}] no cache...`);
        cache.set(url, data);
    }
};
