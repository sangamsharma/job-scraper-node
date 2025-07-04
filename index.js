// Entry point
import dotenv from 'dotenv';
dotenv.config();
const scrapeIndeed = require('./scrapers/scrape-indeed');
const scrapeSeek = require('./scrapers/scrape-seek');

(async () => {
  try {
    await scrapeIndeed();
    await scrapeSeek();
  } catch (err) {
    console.error('Scraping failed:', err);
  }
})();
