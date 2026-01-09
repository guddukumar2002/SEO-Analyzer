const express = require('express');
const router = express.Router();
const { analyzeWebsite } = require('../controllers/analysis.controller');
const Analysis = require('../models/Analysis');

// Analyze website
router.post('/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
        example: { "url": "https://example.com" }
      });
    }
    
    console.log(`🎯 SEO Analysis Request: ${url}`);
    
    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format',
        message: 'Please enter a valid URL including http:// or https://'
      });
    }
    
    const result = await analyzeWebsite(url);
    
    // Add success status
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json({
      success: true,
      ...result,
      message: 'SEO analysis completed successfully'
    });
    
  } catch (error) {
    console.error('🔥 API Error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get analysis history
router.get('/history', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [analyses, total] = await Promise.all([
      Analysis.find()
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('reportId url domain scores.overall scores.grade timestamp seoHealth performance.fetchTime'),
      Analysis.countDocuments()
    ]);
    
    res.json({
      success: true,
      data: analyses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.json({
      success: false,
      data: [],
      note: 'Database not available'
    });
  }
});

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Analysis.getStats();
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    res.json({
      success: false,
      total: 0,
      averageScore: 0,
      message: 'Statistics unavailable'
    });
  }
});

// Get specific report by ID
router.get('/report/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const report = await Analysis.findOne({ reportId: id });
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    res.json({
      success: true,
      ...report.toObject()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report'
    });
  }
});

// Search analyses
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }
    
    const results = await Analysis.find({
      $or: [
        { url: { $regex: q, $options: 'i' } },
        { domain: { $regex: q, $options: 'i' } }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(10)
    .select('reportId url domain scores.overall scores.grade timestamp');
    
    res.json({
      success: true,
      query: q,
      count: results.length,
      results
    });
  } catch (error) {
    res.json({
      success: false,
      results: []
    });
  }
});

module.exports = router;