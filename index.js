const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = 3000;

async function scrapeGoogle(query, pages = 1) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const start = (pages - 1) * 10; // 10 results per page
    const url = `https://www.google.com/search?q=${query}&start=${start}`;
    await page.goto(url);

    const results = await page.evaluate(() => {
        let data = [];
        document.querySelectorAll('.tF2Cxc').forEach(item => {
            let title = item.querySelector('h3') ? item.querySelector('h3').innerText : null;
            let link = item.querySelector('a') ? item.querySelector('a').href : null;
            let description = item.querySelector('span') ? item.querySelector('span').innerText : null;
            let image = item.querySelector('img') ? item.querySelector('img').src : null;

            if (title && link) {
                data.push({
                    title,
                    link,
                    description,
                    image
                });
            }
        });
        return data;
    });

    await browser.close();
    return results;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/api/search', async (req, res) => {
    const keyword = req.query.keyword;
    const pages = req.query.pages || 1;
    if (!keyword) {
        return res.status(400).json({ error: 'Keyword is required.' });
    }

    try {
        const searchResults = await scrapeGoogle(keyword, pages);
        res.json(searchResults);
    } catch (error) {
        console.error('Error scraping Google:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// http://localhost:3000/api/search?keyword=tokoaki&pages=2