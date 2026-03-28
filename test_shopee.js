const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('shopee_test.html', 'utf8');
const $ = cheerio.load(html);

console.log('Title OG:', $('meta[property="og:title"]').attr('content'));
console.log('Title Tag:', $('title').text());
console.log('Image OG:', $('meta[property="og:image"]').attr('content'));

// Look for price everywhere:
let foundPrice = '';
$('*').each((i, el) => {
    const text = $(el).text();
    if(text.includes('R$') && text.length < 20) {
        if(!foundPrice) foundPrice = text.trim();
    }
});
console.log('Price Regex:', foundPrice);
