const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/seo-analyzer', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

// SIMPLE TEST ROUTE (Remove this if you have controllers)
app.post('/api/analyze', async (req, res) => {
    try {
        const { url } = req.body;
        
        console.log('📨 Received request for:', url);
        
        if (!url) {
            return res.status(400).json({ 
                success: false,
                error: 'URL is required' 
            });
        }
        
        // Return demo data for testing
        const demoResult = {
            success: true,
            url,
            analysis: {
                metaTags: {
                    title: {
                        content: 'Example Domain',
                        length: 14,
                        score: 85
                    },
                    description: {
                        content: 'Example domain for testing',
                        length: 26,
                        score: 75
                    }
                },
                headings: {
                    h1: [{ text: 'Example Domain', length: 14 }],
                    h2: [],
                    h1Count: 1,
                    total: 1,
                    score: 80
                },
                images: {
                    total: 1,
                    withAlt: 0,
                    withoutAlt: 1,
                    altTextRatio: 0,
                    score: 40
                },
                content: {
                    wordCount: 250,
                    readingTime: '1 min read',
                    paragraphs: 3,
                    readability: 65,
                    score: 70
                },
                urlStructure: {
                    isHTTPS: true,
                    protocol: 'https:',
                    hostname: 'example.com'
                },
                mobileFriendly: {
                    hasViewport: true,
                    score: 85
                },
                performance: {
                    loadTime: '1200ms',
                    statusCode: 200,
                    hasCaching: true,
                    hasCompression: true
                },
                links: {
                    internal: 5,
                    external: 2,
                    nofollow: 0,
                    score: 75
                }
            },
            scores: {
                overall: 72,
                grade: 'C',
                categoryScores: {
                    meta: 80,
                    headings: 80,
                    images: 40,
                    content: 70,
                    url: 85,
                    mobile: 85,
                    performance: 75,
                    technical: 70,
                    links: 75
                },
                recommendations: [
                    'Add alt text to images',
                    'Increase content length to at least 300 words',
                    'Add more internal links'
                ],
                strengths: ['HTTPS', 'Mobile Friendly', 'Good Meta Tags'],
                weaknesses: ['Images without alt text', 'Short content']
            },
            cached: false,
            timestamp: new Date().toISOString()
        };
        
        res.json(demoResult);
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'SEO Analyzer API',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'SEO Analyzer API is running!',
        endpoints: {
            analyze: 'POST /api/analyze',
            health: 'GET /health',
            test: 'GET /'
        },
        documentation: 'Send POST request to /api/analyze with { "url": "https://example.com" }'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Route not found',
        requested: req.originalUrl,
        available: ['POST /api/analyze', 'GET /health', 'GET /']
    });
});

// IMPORTANT: Export the app
module.exports = app;