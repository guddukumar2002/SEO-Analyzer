const cheerio = require('cheerio');

class SEOAnalyzer {
  analyze(html, url) {
    const $ = cheerio.load(html);
    const results = {};

    // 1. SEO AUDIT
    results.meta = this._analyzeMetaTags($);
    results.headings = this._analyzeHeadings($);
    results.images = this._analyzeImages($);
    results.urlStructure = this._analyzeURL(url);

    // 2. TECHNICAL SEO
    results.technical = this._analyzeTechnical($, url);

    // 3. ON-PAGE SEO
    results.onpage = this._analyzeOnPage($, url);

    // 4. AUTHORITY SIGNALS (Basic)
    results.authority = this._analyzeAuthority(url);

    return results;
  }

  _analyzeMetaTags($) {
    const title = $('title').text() || 'Not Found';
    const description = $('meta[name="description"]').attr('content') || 'Not Found';
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const ogDescription = $('meta[property="og:description"]').attr('content');

    const checks = [];
    // Title length check (50-60 chars optimal)
    if (title.length >= 50 && title.length <= 60) {
      checks.push({ name: 'Title Length', passed: true, value: `${title.length} chars`, weight: 10 });
    } else {
      checks.push({ name: 'Title Length', passed: false, value: `${title.length} chars (aim for 50-60)`, weight: 10 });
    }

    // Description length check (120-160 chars optimal)
    if (description.length >= 120 && description.length <= 160) {
      checks.push({ name: 'Description Length', passed: true, value: `${description.length} chars`, weight: 10 });
    } else {
      checks.push({ name: 'Description Length', passed: false, value: `${description.length} chars (aim for 120-160)`, weight: 10 });
    }

    return { title, description, ogTitle, ogDescription, checks };
  }

  _analyzeHeadings($) {
    const headings = { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] };
    const checks = [];

    // Collect all headings
    for (let i = 1; i <= 6; i++) {
      $(`h${i}`).each((index, el) => {
        headings[`h${i}`].push($(el).text().trim());
      });
    }

    // H1 check (exactly 1 is best)
    if (headings.h1.length === 1) {
      checks.push({ name: 'H1 Count', passed: true, value: 'Exactly 1 H1 found', weight: 15 });
    } else if (headings.h1.length > 1) {
      checks.push({ name: 'H1 Count', passed: false, value: `${headings.h1.length} H1s found (should be 1)`, weight: 15 });
    } else {
      checks.push({ name: 'H1 Count', passed: false, value: 'No H1 tag found', weight: 15 });
    }

    // Heading hierarchy check
    if (headings.h1.length > 0 && headings.h2.length > 0) {
      checks.push({ name: 'Heading Hierarchy', passed: true, value: 'Good H1 → H2 structure', weight: 5 });
    } else {
      checks.push({ name: 'Heading Hierarchy', passed: false, value: 'Poor heading structure', weight: 5 });
    }

    return { headings, checks };
  }

  _analyzeImages($) {
    const images = [];
    let missingAlt = 0;

    $('img').each((index, el) => {
      const src = $(el).attr('src') || 'No src';
      const alt = $(el).attr('alt') || '';
      images.push({ src, alt });
      if (!alt.trim()) missingAlt++;
    });

    const checks = [];
    if (missingAlt === 0 && images.length > 0) {
      checks.push({ name: 'Image Alt Tags', passed: true, value: `All ${images.length} images have alt text`, weight: 10 });
    } else if (images.length === 0) {
      checks.push({ name: 'Image Alt Tags', passed: true, value: 'No images found', weight: 10 });
    } else {
      checks.push({ name: 'Image Alt Tags', passed: false, value: `${missingAlt} images missing alt text`, weight: 10 });
    }

    return { total: images.length, missingAlt, checks };
  }

  _analyzeURL(url) {
    const urlObj = new URL(url);
    const checks = [];

    // Check for query parameters
    if (urlObj.search.length > 0) {
      checks.push({ name: 'Clean URL', passed: false, value: 'Contains query parameters (?...)', weight: 5 });
    } else {
      checks.push({ name: 'Clean URL', passed: true, value: 'No query parameters', weight: 5 });
    }

    // Check URL length
    if (url.length <= 100) {
      checks.push({ name: 'URL Length', passed: true, value: `${url.length} chars`, weight: 5 });
    } else {
      checks.push({ name: 'URL Length', passed: false, value: `${url.length} chars (too long)`, weight: 5 });
    }

    return { path: urlObj.pathname, checks };
  }

  _analyzeTechnical($, url) {
    const checks = [];

    // HTTPS Check
    if (url.startsWith('https://')) {
      checks.push({ name: 'HTTPS/SSL', passed: true, value: 'Secure connection', weight: 20 });
    } else {
      checks.push({ name: 'HTTPS/SSL', passed: false, value: 'Not secure (HTTP)', weight: 20 });
    }

    // Viewport for Mobile
    const viewport = $('meta[name="viewport"]').attr('content') || '';
    if (viewport.includes('width=device-width')) {
      checks.push({ name: 'Mobile Viewport', passed: true, value: 'Mobile-friendly', weight: 10 });
    } else {
      checks.push({ name: 'Mobile Viewport', passed: false, value: 'Not mobile-optimized', weight: 10 });
    }

    // Canonical Tag
    const canonical = $('link[rel="canonical"]').attr('href');
    if (canonical) {
      checks.push({ name: 'Canonical Tag', passed: true, value: 'Present', weight: 5 });
    }

    return { checks };
  }

  _analyzeOnPage($, url) {
    const bodyText = $('body').text();
    const wordCount = bodyText.trim().split(/\s+/).length;

    const internalLinks = [];
    const externalLinks = [];
    const baseDomain = new URL(url).hostname;

    $('a[href]').each((index, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      if (href.startsWith('/') || href.startsWith('./') || href.includes(baseDomain)) {
        internalLinks.push(href);
      } else if (href.startsWith('http')) {
        externalLinks.push(href);
      }
    });

    const checks = [];
    // Content Length
    if (wordCount >= 300) {
      checks.push({ name: 'Content Length', passed: true, value: `${wordCount} words`, weight: 15 });
    } else {
      checks.push({ name: 'Content Length', passed: false, value: `${wordCount} words (aim for 300+)`, weight: 15 });
    }

    // Internal Links
    if (internalLinks.length >= 3) {
      checks.push({ name: 'Internal Links', passed: true, value: `${internalLinks.length} found`, weight: 5 });
    } else {
      checks.push({ name: 'Internal Links', passed: false, value: `${internalLinks.length} found (aim for 3+)`, weight: 5 });
    }

    return { wordCount, internalLinks: internalLinks.length, externalLinks: externalLinks.length, checks };
  }

  _analyzeAuthority(url) {
    const domain = new URL(url).hostname;
    const checks = [];

    // Simple domain age check (demo logic)
    const oldDomains = ['wikipedia.org', 'stackoverflow.com', 'github.com'];
    if (oldDomains.some(d => domain.includes(d))) {
      checks.push({ name: 'Domain Age', passed: true, value: 'Established domain', weight: 5 });
    }

    // SSL check (already in technical, but repeated for authority)
    if (url.startsWith('https://')) {
      checks.push({ name: 'SSL Certificate', passed: true, value: 'HTTPS enabled', weight: 5 });
    }

    return { checks };
  }
}

module.exports = new SEOAnalyzer();