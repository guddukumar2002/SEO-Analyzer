const axios = require('axios');
const cheerio = require('cheerio');

class CrawlerService {
  constructor() {
    this.blockedSites = ['google.com', 'facebook.com', 'youtube.com'];
  }

  async fetchHTML(url) {
    const domain = new URL(url).hostname;

    // Agar yeh blocked sites mein se hai, toh special demo data return karo
    if (this.blockedSites.some(site => domain.includes(site))) {
      console.log(`ℹ️  ${domain} is blocked for bots. Returning demo analysis.`);
      return this.getDemoHTML(domain);
    }

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error.message);
      throw new Error(`Website fetch failed: ${error.message}`);
    }
  }

  getDemoHTML(domain) {
    // Different demo HTML for different sites
    const demoSites = {
      'google.com': `<!DOCTYPE html><html><head>
        <title>Google - Search Engine</title>
        <meta name="description" content="Search the world's information, including webpages, images, videos and more.">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head><body>
        <h1>Google Search</h1>
        <img src="/logo.png" alt="Google Logo">
        <p>Search the world's information</p>
        </body></html>`
    };
    return demoSites[domain] || `<!DOCTYPE html><html><head><title>${domain}</title></head><body><h1>Demo Page for ${domain}</h1></body></html>`;
  }
}

module.exports = new CrawlerService();