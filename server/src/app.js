const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'SEO Analyzer API is running',
    timestamp: new Date().toISOString()
  });
});

// Real SEO Analysis function
async function analyzeWebsite(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'SEO-Analyzer-Bot/1.0'
      }
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Extract data
    const title = $('title').text() || 'Not found';
    const description = $('meta[name="description"]').attr('content') || 'Not found';
    const keywords = $('meta[name="keywords"]').attr('content') || 'Not found';
    const h1Tags = [];
    const h2Tags = [];
    const imagesWithoutAlt = [];
    
    $('h1').each((i, el) => {
      h1Tags.push($(el).text().trim());
    });
    
    $('h2').each((i, el) => {
      h2Tags.push($(el).text().trim());
    });
    
    $('img').each((i, el) => {
      if (!$(el).attr('alt')) {
        imagesWithoutAlt.push($(el).attr('src') || 'No src');
      }
    });
    
    // Check HTTPS
    const hasHTTPS = url.startsWith('https://');
    
    // Check viewport for mobile
    const viewport = $('meta[name="viewport"]').attr('content') || '';
    const isMobileFriendly = viewport.includes('width=device-width');
    
    // Calculate score
    let score = 100;
    const checks = [];
    
    // Title check
    if (title && title.length > 10 && title.length < 60) {
      checks.push({ name: 'Title', passed: true, value: `${title.length} characters ✓` });
    } else {
      score -= 15;
      checks.push({ name: 'Title', passed: false, value: title ? `${title.length} chars (should be 10-60)` : 'Missing ✗' });
    }
    
    // Description check
    if (description && description.length > 50 && description.length < 160) {
      checks.push({ name: 'Description', passed: true, value: `${description.length} characters ✓` });
    } else {
      score -= 10;
      checks.push({ name: 'Description', passed: false, value: description ? `${description.length} chars (should be 50-160)` : 'Missing ✗' });
    }
    
    // H1 check
    if (h1Tags.length === 1) {
      checks.push({ name: 'H1 Tag', passed: true, value: `1 H1 found ✓` });
    } else if (h1Tags.length > 1) {
      score -= 10;
      checks.push({ name: 'H1 Tag', passed: false, value: `${h1Tags.length} H1s (should be 1) ✗` });
    } else {
      score -= 20;
      checks.push({ name: 'H1 Tag', passed: false, value: 'No H1 tag ✗' });
    }
    
    // HTTPS check
    if (hasHTTPS) {
      checks.push({ name: 'HTTPS', passed: true, value: 'Secure ✓' });
    } else {
      score -= 20;
      checks.push({ name: 'HTTPS', passed: false, value: 'Not secure (HTTP) ✗' });
    }
    
    // Images alt check
    if (imagesWithoutAlt.length === 0) {
      checks.push({ name: 'Image Alt Tags', passed: true, value: 'All images have alt text ✓' });
    } else {
      score -= Math.min(imagesWithoutAlt.length, 10);
      checks.push({ name: 'Image Alt Tags', passed: false, value: `${imagesWithoutAlt.length} images without alt text ✗` });
    }
    
    // Mobile friendly check
    if (isMobileFriendly) {
      checks.push({ name: 'Mobile Friendly', passed: true, value: 'Responsive ✓' });
    } else {
      score -= 10;
      checks.push({ name: 'Mobile Friendly', passed: false, value: 'Not mobile friendly ✗' });
    }
    
    // H2 tags count
    if (h2Tags.length > 0) {
      checks.push({ name: 'H2 Tags', passed: true, value: `${h2Tags.length} H2s found ✓` });
    } else {
      checks.push({ name: 'H2 Tags', passed: false, value: 'No H2 tags ✗' });
    }
    
    // Ensure score is between 0-100
    score = Math.max(0, Math.min(100, score));
    
    return {
      success: true,
      url: url,
      score: score,
      checks: checks,
      details: {
        title: title.substring(0, 100) + (title.length > 100 ? '...' : ''),
        description: description.substring(0, 150) + (description.length > 150 ? '...' : ''),
        h1Count: h1Tags.length,
        h2Count: h2Tags.length,
        imagesWithoutAlt: imagesWithoutAlt.length,
        hasHTTPS: hasHTTPS,
        mobileFriendly: isMobileFriendly,
        analyzedAt: new Date().toISOString()
      }
    };
    
  } catch (error) {
    throw new Error(`Failed to analyze: ${error.message}`);
  }
}

// SEO Analysis endpoint
app.get('/api/analyze', async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({ 
      error: 'URL required. Example: /api/analyze?url=https://example.com' 
    });
  }
  
  try {
    const result = await analyzeWebsite(url);
    res.json(result);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SEO Analyzer API</title>
        <style>
          body { font-family: Arial; padding: 40px; max-width: 800px; margin: 0 auto; }
          .endpoint { background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 10px 0; }
          code { background: #e0e0e0; padding: 2px 6px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>🔍 SEO Analyzer API</h1>
        <p>Real SEO analysis backend</p>
        
        <h3>Test these URLs:</h3>
        <ul>
          <li><a href="/api/analyze?url=https://google.com" target="_blank">Analyze Google</a></li>
          <li><a href="/api/analyze?url=https://github.com" target="_blank">Analyze GitHub</a></li>
          <li><a href="/api/analyze?url=https://example.com" target="_blank">Analyze Example.com</a></li>
        </ul>
      </body>
    </html>
  `);
});

module.exports = app;