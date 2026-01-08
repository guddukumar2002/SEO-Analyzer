const express = require('express');
const router = express.Router();
const analyzeController = require('../controllers/analyze.controller');

// Test endpoint
router.get('/test', analyzeController.testEndpoint);

// Analyze website
router.post('/analyze', analyzeController.analyzeWebsite);

// Get analysis history
router.get('/history', analyzeController.getAnalysisHistory);

// Health check
router.get('/health', analyzeController.healthCheck);

module.exports = router;