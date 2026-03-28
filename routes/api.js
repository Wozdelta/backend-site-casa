const express = require('express');
const router = express.Router();
const orchestrator = require('../services/orchestrator');

router.post('/scrape', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL é obrigatória' });
        
        console.log(`\n===========================================`);
        console.log(`Recebendo pedido para: ${url}`);
        const result = await orchestrator.processUrl(url);
        
        res.json(result);
    } catch (error) {
        console.error("Erro na request /scrape:", error);
        res.status(500).json({ 
            error: 'Erro interno no servidor de extração',
            details: error.message
        });
    }
});

module.exports = router;
