const crawlerService = require('../services/crawler.service');
const analyzerService = require('../services/analyzer.service');
const scoreService = require('../services/score.service');

const analyzeController = {
  getHealth: (req, res) => {
    res.json({
      status: 'operational',
      service: 'SEO Analyzer Pro API',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  },

  analyzeWebsite: async (req, res) => {
    try {
      const { url } = req.query;

      if (!url) {
        return res.status(400).json({
          error: 'Please provide a URL. Example: /api/analyze?url=https://example.com'
        });
      }

      console.log(`▶️  Analysis requested for: ${url}`);

      // STEP 1: Fetch the website HTML
      const html = await crawlerService.fetchHTML(url);

      // STEP 2: Run all SEO analysis
      const analysisResults = analyzerService.analyze(html, url);

      // STEP 3: Calculate score and recommendations
      const scoreResult = scoreService.calculate(analysisResults);

      // STEP 4: Prepare final response
      const response = {
        success: true,
        url: url,
        analyzedAt: new Date().toISOString(),
        score: scoreResult.score,
        grade: scoreResult.grade,
        checks: scoreResult.checks,
        recommendations: scoreResult.recommendations,
        statistics: scoreResult.stats,
        details: {
          meta: analysisResults.meta,
          headings: analysisResults.headings,
          images: analysisResults.images,
          technical: analysisResults.technical,
          onpage: analysisResults.onpage
        }
      };

      res.json(response);

    } catch (error) {
      console.error('❌ Analysis error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        suggestion: 'Please try a different URL like https://httpbin.org/html'
      });
    }
  }
};

module.exports = analyzeController;