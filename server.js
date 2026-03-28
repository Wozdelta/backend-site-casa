const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Main scrape route
app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`🤖 Scraper Backend rodando na porta ${PORT}`);
});
