import { chromium } from 'playwright-extra';
import StealthPlugin from 'playwright-extra-plugin-stealth';
import dotenv from 'dotenv';
import pool from '../db.js';

dotenv.config();
chromium.use(StealthPlugin());

async function retry(fn, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`Attempt ${attempt} failed:`, err);
      if (attempt === retries) throw err;
    }
  }
}

async function scrapeIndeed() {
  const proxy = process.env.PROXY ? { proxy: { server: process.env.PROXY } } : {};
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(proxy);
  const page = await context.newPage();
  const results = [];

  for (let start = 0; start < 30; start += 10) {
    const url = `https://au.indeed.com/jobs?q=IT&l=Australia&start=${start}`;
    console.log(`Scraping: ${url}`);

    await retry(async () => {
      await page.goto(url, { timeout: 60000 });
      await page.waitForSelector('.job_seen_beacon', { timeout: 15000 });

      const jobs = await page.$$eval('.job_seen_beacon', cards =>
        cards.map(card => {
          const title = card.querySelector('h2 a')?.innerText || '';
          const href = card.querySelector('h2 a')?.href || '';
          const company = card.querySelector('.companyName')?.innerText || '';
          const location = card.querySelector('.companyLocation')?.innerText || '';
          return { title, company, location, url: href };
        })
      );

      results.push(...jobs);
    });

    await page.waitForTimeout(Math.random() * 3000 + 2000);
  }

  for (const job of results) {
    try {
      await pool.query(
        'INSERT INTO jobs(title, company, location, url) VALUES ($1, $2, $3, $4) ON CONFLICT (url) DO NOTHING',
        [job.title, job.company, job.location, job.url]
      );
    } catch (err) {
      console.error('DB Insert Error:', err);
    }
  }

  console.log(`Saved ${results.length} Indeed jobs.`);
  await browser.close();
}

export default scrapeIndeed;
