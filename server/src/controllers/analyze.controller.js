const seoService = require('../services/seo.service');
const scoreService = require('../services/score.service');
const Analysis = require('../models/Analysis');

exports.analyzeWebsite = async (req, res) => {
    try {
        const { url } = req.body;
        
        console.log(`▶️  Analysis requested for: ${url}`);
        
        if (!url) {
            return res.status(400).json({ 
                success: false,
                error: 'URL is required' 
            });
        }
        
        // Validate URL format
        let formattedUrl = url.trim();
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
            formattedUrl = 'https://' + formattedUrl;
        }
        
        try {
            new URL(formattedUrl);
        } catch (error) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid URL format' 
            });
        }
        
        // Check if analysis already exists (cache for 1 hour)
        const existingAnalysis = await Analysis.findOne({ 
            url: formattedUrl,
            createdAt: { 
                $gt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour cache
            }
        });
        
        if (existingAnalysis) {
            console.log(`✅ Serving cached analysis for: ${formattedUrl}`);
            return res.json({
                success: true,
                url: formattedUrl,
                analysis: existingAnalysis.analysis,
                scores: existingAnalysis.scores,
                cached: true,
                timestamp: existingAnalysis.createdAt
            });
        }
        
        // Perform analysis
        const analysis = await seoService.analyzeWebsite(formattedUrl);
        const scores = scoreService.calculateOverallScore(analysis);
        
        // Save to database
        const newAnalysis = new Analysis({
            url: formattedUrl,
            analysis,
            scores,
            createdAt: new Date()
        });
        
        await newAnalysis.save();
        
        console.log(`✅ Analysis completed for: ${formattedUrl}`);
        
        res.json({
            success: true,
            url: formattedUrl,
            analysis,
            scores,
            cached: false,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Analysis error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Analysis failed', 
            details: error.message 
        });
    }
};

exports.getAnalysisHistory = async (req, res) => {
    try {
        const analyses = await Analysis.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .select('url scores.overall createdAt');
        
        res.json({
            success: true,
            count: analyses.length,
            analyses
        });
    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch history' 
        });
    }
};

// Simple test endpoint
exports.testEndpoint = (req, res) => {
    res.json({
        message: 'SEO Analyzer API is working!',
        endpoints: {
            analyze: 'POST /api/analyze',
            history: 'GET /api/history',
            health: 'GET /api/health'
        },
        timestamp: new Date().toISOString()
    });
};

// Health check
exports.healthCheck = (req, res) => {
    res.json({
        status: 'healthy',
        service: 'SEO Analyzer API',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
};