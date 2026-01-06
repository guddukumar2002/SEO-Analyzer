const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import controllers
const { analyzeWebsite, getHealth } = require('./controllers/analyze.controller');

// API Routes
app.get('/api/health', getHealth);
app.get('/api/analyze', analyzeWebsite);

// Root - Documentation
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>SEO Analyzer Pro API</title></head>
    <body style="font-family: Arial; padding: 40px; max-width: 800px; margin: 0 auto;">
      <h1>🔍 SEO Analyzer Pro API</h1>
      <p>A complete Woorank clone for SEO analysis.</p>
      <h3>📚 Endpoints:</h3>
      <ul>
        <li><code>GET /api/health</code> - Check API status</li>
        <li><code>GET /api/analyze?url=https://example.com</code> - Analyze a website</li>
      </ul>
      <h3>✅ Test These URLs:</h3>
      <p>
        <a href="/api/analyze?url=https://httpbin.org/html" target="_blank">httpbin.org/html</a> |
        <a href="/api/analyze?url=https://example.com" target="_blank">example.com</a> |
        <a href="/api/analyze?url=https://stackoverflow.com" target="_blank">stackoverflow.com</a>
      </p>
    </body>
    </html>
  `);
});

module.exports = app;