const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection (optional, for caching)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/seo-analyzer')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Real SEO Analysis Functions
const analyzeWebsite = async (url) => {
  try {
    console.log(`🔍 Starting REAL analysis of: ${url}`);
    
    // Fetch website with realistic headers
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.google.com/',
        'DNT': '1'
      },
      timeout: 15000,
      maxRedirects: 5
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // 1. Analyze Meta Tags
    const title = $('title').text() || '';
    const description = $('meta[name="description"]').attr('content') || '';
    const keywords = $('meta[name="keywords"]').attr('content') || '';
    
    const metaScore = calculateMetaScore(title, description);
    
    // 2. Analyze Headings
    const h1Tags = [];
    const h2Tags = [];
    const h3Tags = [];
    
    $('h1').each((i, el) => h1Tags.push($(el).text().trim()));
    $('h2').each((i, el) => h2Tags.push($(el).text().trim()));
    $('h3').each((i, el) => h3Tags.push($(el).text().trim()));
    
    const headingScore = calculateHeadingScore(h1Tags, h2Tags, h3Tags);
    
    // 3. Analyze Images
    const images = [];
    let imagesWithAlt = 0;
    let imagesWithoutAlt = 0;
    
    $('img').each((i, el) => {
      const alt = $(el).attr('alt') || '';
      if (alt.trim()) {
        imagesWithAlt++;
      } else {
        imagesWithoutAlt++;
      }
      images.push({ src: $(el).attr('src'), alt });
    });
    
    const imageScore = calculateImageScore(imagesWithAlt, imagesWithoutAlt);
    
    // 4. Analyze Content
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = text.split(/\s+/).length;
    const paragraphs = $('p').length;
    
    const contentScore = calculateContentScore(wordCount, paragraphs);
    
    // 5. Analyze Links
    const links = [];
    let internalLinks = 0;
    let externalLinks = 0;
    
    $('a').each((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      
      if (href) {
        if (isInternalLink(href, url)) {
          internalLinks++;
        } else if (href.startsWith('http')) {
          externalLinks++;
        }
        links.push({ href, text });
      }
    });
    
    const linkScore = calculateLinkScore(internalLinks, externalLinks);
    
    // 6. Analyze URL Structure
    const urlObj = new URL(url);
    const urlScore = calculateURLScore(urlObj);
    
    // 7. Check Mobile Friendly
    const viewport = $('meta[name="viewport"]').attr('content') || '';
    const mobileScore = calculateMobileScore(viewport);
    
    // 8. Check Performance (simulated)
    const startTime = Date.now();
    await axios.head(url, { timeout: 5000 });
    const loadTime = Date.now() - startTime;
    const performanceScore = calculatePerformanceScore(loadTime);
    
    // 9. Check HTTPS
    const httpsScore = urlObj.protocol === 'https:' ? 100 : 30;
    
    // 10. Check Social Tags
    const hasOgTags = $('meta[property^="og:"]').length > 0;
    const hasTwitterTags = $('meta[name^="twitter:"]').length > 0;
    const socialScore = calculateSocialScore(hasOgTags, hasTwitterTags);
    
    // Calculate overall score
    const categoryScores = {
      meta: metaScore,
      headings: headingScore,
      images: imageScore,
      content: contentScore,
      links: linkScore,
      url: urlScore,
      mobile: mobileScore,
      performance: performanceScore,
      https: httpsScore,
      social: socialScore
    };
    
    const overallScore = calculateOverallScore(categoryScores);
    const grade = getGrade(overallScore);
    
    // Generate recommendations
    const recommendations = generateRecommendations({
      metaScore, title, description,
      headingScore, h1Tags,
      imageScore, imagesWithoutAlt,
      contentScore, wordCount,
      linkScore, internalLinks,
      urlScore, urlObj,
      mobileScore, viewport,
      httpsScore,
      socialScore
    });
    
    // Return complete analysis
    return {
      success: true,
      url,
      analysis: {
        metaTags: {
          title: { content: title, length: title.length, score: metaScore * 0.5 },
          description: { content: description, length: description.length, score: metaScore * 0.5 },
          keywords
        },
        headings: {
          h1: h1Tags,
          h2: h2Tags.slice(0, 10), // Limit to 10
          h3: h3Tags.slice(0, 5),  // Limit to 5
          h1Count: h1Tags.length,
          h2Count: h2Tags.length,
          h3Count: h3Tags.length,
          total: h1Tags.length + h2Tags.length + h3Tags.length,
          score: headingScore
        },
        images: {
          total: images.length,
          withAlt: imagesWithAlt,
          withoutAlt: imagesWithoutAlt,
          altTextRatio: images.length > 0 ? Math.round((imagesWithAlt / images.length) * 100) : 0,
          score: imageScore,
          sampleImages: images.slice(0, 5) // Return first 5 images
        },
        content: {
          wordCount,
          paragraphs,
          textPreview: text.substring(0, 500) + '...',
          score: contentScore
        },
        links: {
          internal: internalLinks,
          external: externalLinks,
          total: links.length,
          score: linkScore,
          sampleLinks: links.slice(0, 10) // Return first 10 links
        },
        urlStructure: {
          protocol: urlObj.protocol,
          hostname: urlObj.hostname,
          pathname: urlObj.pathname,
          isHTTPS: urlObj.protocol === 'https:',
          hasWWW: urlObj.hostname.startsWith('www.'),
          score: urlScore
        },
        mobileFriendly: {
          hasViewport: viewport.includes('width=device-width'),
          viewportContent: viewport,
          score: mobileScore
        },
        performance: {
          loadTime: `${loadTime}ms`,
          score: performanceScore
        },
        security: {
          isHTTPS: urlObj.protocol === 'https:',
          score: httpsScore
        },
        social: {
          hasOgTags,
          hasTwitterTags,
          score: socialScore
        }
      },
      scores: {
        overall: overallScore,
        grade,
        categoryScores,
        strengths: getStrengths(categoryScores),
        weaknesses: getWeaknesses(categoryScores)
      },
      recommendations,
      timestamp: new Date().toISOString(),
      cached: false
    };
    
  } catch (error) {
    console.error(`❌ Analysis failed for ${url}:`, error.message);
    throw new Error(`Failed to analyze website: ${error.message}`);
  }
};

// Helper Functions
function calculateMetaScore(title, description) {
  let score = 0;
  
  // Title score (0-50 points)
  if (title.length >= 50 && title.length <= 60) score += 50;
  else if (title.length >= 30 && title.length <= 70) score += 40;
  else if (title.length >= 20 && title.length <= 80) score += 30;
  else if (title.length > 0) score += 20;
  
  // Description score (0-50 points)
  if (description.length >= 120 && description.length <= 160) score += 50;
  else if (description.length >= 90 && description.length <= 200) score += 40;
  else if (description.length >= 50 && description.length <= 250) score += 30;
  else if (description.length > 0) score += 20;
  
  return Math.min(100, score);
}

function calculateHeadingScore(h1Tags, h2Tags, h3Tags) {
  let score = 0;
  
  // H1 check (40 points)
  if (h1Tags.length === 1) {
    score += 40;
    if (h1Tags[0].length >= 20 && h1Tags[0].length <= 70) score += 10;
  } else if (h1Tags.length === 0) {
    score -= 20;
  } else if (h1Tags.length > 1) {
    score -= 10;
  }
  
  // H2 check (30 points)
  if (h2Tags.length >= 2) score += 30;
  else if (h2Tags.length >= 1) score += 15;
  
  // H3 check (20 points)
  if (h3Tags.length >= 2) score += 20;
  else if (h3Tags.length >= 1) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

function calculateImageScore(withAlt, withoutAlt) {
  const total = withAlt + withoutAlt;
  if (total === 0) return 100; // No images is okay
  
  const ratio = withAlt / total;
  return Math.round(ratio * 100);
}

function calculateContentScore(wordCount, paragraphs) {
  let score = 0;
  
  // Word count (60 points)
  if (wordCount >= 1000) score += 60;
  else if (wordCount >= 500) score += 50;
  else if (wordCount >= 300) score += 40;
  else if (wordCount >= 150) score += 30;
  else if (wordCount >= 50) score += 20;
  else score += 10;
  
  // Paragraphs (40 points)
  if (paragraphs >= 10) score += 40;
  else if (paragraphs >= 5) score += 30;
  else if (paragraphs >= 3) score += 20;
  else if (paragraphs >= 1) score += 10;
  
  return Math.min(100, score);
}

function calculateLinkScore(internal, external) {
  let score = 50; // Base score
  
  // Internal links
  if (internal >= 20) score += 25;
  else if (internal >= 10) score += 20;
  else if (internal >= 5) score += 15;
  else if (internal >= 2) score += 5;
  else if (internal === 0) score -= 20;
  
  // External links (good to have some)
  if (external >= 3 && external <= 20) score += 15;
  else if (external > 0) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

function calculateURLScore(urlObj) {
  let score = 70; // Base score
  
  // HTTPS check
  if (urlObj.protocol === 'https:') score += 20;
  
  // URL length penalty
  const fullUrl = urlObj.href;
  if (fullUrl.length > 100) {
    const excess = Math.floor((fullUrl.length - 100) / 20);
    score -= Math.min(20, excess * 5);
  }
  
  // Check for query parameters
  if (urlObj.search) score -= 5;
  
  // Check for special characters
  if (/[%#&?]/.test(urlObj.pathname)) score -= 5;
  
  return Math.max(0, Math.min(100, score));
}

function calculateMobileScore(viewport) {
  if (viewport.includes('width=device-width')) return 90;
  if (viewport) return 60;
  return 30;
}

function calculatePerformanceScore(loadTime) {
  if (loadTime < 1000) return 100;
  if (loadTime < 2000) return 85;
  if (loadTime < 3000) return 70;
  if (loadTime < 5000) return 50;
  return 30;
}

function calculateSocialScore(hasOg, hasTwitter) {
  let score = 0;
  if (hasOg) score += 50;
  if (hasTwitter) score += 30;
  return score;
}

function calculateOverallScore(categoryScores) {
  const weights = {
    meta: 0.15,
    headings: 0.10,
    images: 0.08,
    content: 0.12,
    links: 0.08,
    url: 0.07,
    mobile: 0.10,
    performance: 0.10,
    https: 0.10,
    social: 0.10
  };
  
  let total = 0;
  let weightSum = 0;
  
  for (const [category, score] of Object.entries(categoryScores)) {
    if (weights[category]) {
      total += score * weights[category];
      weightSum += weights[category];
    }
  }
  
  return weightSum > 0 ? Math.round(total / weightSum) : 0;
}

function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function isInternalLink(href, baseUrl) {
  if (!href || href.startsWith('javascript:')) return false;
  if (href.startsWith('#') || href.startsWith('/')) return true;
  
  try {
    const url = new URL(href, baseUrl);
    const base = new URL(baseUrl);
    return url.hostname === base.hostname;
  } catch {
    return false;
  }
}

function generateRecommendations(data) {
  const recommendations = [];
  
  // Meta tags recommendations
  if (data.metaScore < 70) {
    if (!data.title || data.title.length === 0) {
      recommendations.push('Add a descriptive title tag (50-60 characters recommended)');
    }
    if (!data.description || data.description.length === 0) {
      recommendations.push('Add a compelling meta description (120-160 characters recommended)');
    }
    if (data.title && data.title.length > 60) {
      recommendations.push('Shorten your title tag (currently too long)');
    }
  }
  
  // Headings recommendations
  if (data.headingScore < 70) {
    if (data.h1Tags.length === 0) {
      recommendations.push('Add an H1 heading to your page');
    }
    if (data.h1Tags.length > 1) {
      recommendations.push('Use only one H1 heading per page');
    }
  }
  
  // Images recommendations
  if (data.imageScore < 80 && data.imagesWithoutAlt > 0) {
    recommendations.push(`Add alt text to ${data.imagesWithoutAlt} images`);
  }
  
  // Content recommendations
  if (data.contentScore < 70) {
    if (data.wordCount < 300) {
      recommendations.push('Add more content (aim for at least 300 words)');
    }
  }
  
  // Links recommendations
  if (data.linkScore < 70) {
    if (data.internalLinks < 5) {
      recommendations.push('Add more internal links to improve site structure');
    }
  }
  
  // URL recommendations
  if (data.urlScore < 70) {
    if (!data.urlObj.protocol === 'https:') {
      recommendations.push('Switch to HTTPS for better security and SEO');
    }
  }
  
  // Mobile recommendations
  if (data.mobileScore < 70) {
    if (!data.viewport) {
      recommendations.push('Add viewport meta tag for mobile responsiveness');
    }
  }
  
  // HTTPS recommendations
  if (data.httpsScore < 100) {
    recommendations.push('Enable HTTPS for better security and SEO ranking');
  }
  
  // Social recommendations
  if (data.socialScore < 50) {
    recommendations.push('Add Open Graph and Twitter Card meta tags for social sharing');
  }
  
  // If no recommendations, add general ones
  if (recommendations.length === 0) {
    recommendations.push(
      'Great job! Your website is well-optimized.',
      'Consider adding structured data (Schema.org) for rich results',
      'Regularly update your content to stay relevant'
    );
  }
  
  return recommendations.slice(0, 8); // Limit to 8 recommendations
}

function getStrengths(categoryScores) {
  const strengths = [];
  const threshold = 80;
  
  if (categoryScores.meta >= threshold) strengths.push('Meta Tags');
  if (categoryScores.headings >= threshold) strengths.push('Heading Structure');
  if (categoryScores.images >= threshold) strengths.push('Image Optimization');
  if (categoryScores.content >= threshold) strengths.push('Content Quality');
  if (categoryScores.links >= threshold) strengths.push('Link Profile');
  if (categoryScores.url >= threshold) strengths.push('URL Structure');
  if (categoryScores.mobile >= threshold) strengths.push('Mobile Friendliness');
  if (categoryScores.performance >= threshold) strengths.push('Performance');
  if (categoryScores.https >= threshold) strengths.push('HTTPS Security');
  if (categoryScores.social >= threshold) strengths.push('Social Media');
  
  return strengths.length > 0 ? strengths : ['Good foundation, room for improvement'];
}

function getWeaknesses(categoryScores) {
  const weaknesses = [];
  const threshold = 60;
  
  if (categoryScores.meta < threshold) weaknesses.push('Meta Tags');
  if (categoryScores.headings < threshold) weaknesses.push('Heading Structure');
  if (categoryScores.images < threshold) weaknesses.push('Image Optimization');
  if (categoryScores.content < threshold) weaknesses.push('Content Quality');
  if (categoryScores.links < threshold) weaknesses.push('Link Profile');
  if (categoryScores.url < threshold) weaknesses.push('URL Structure');
  if (categoryScores.mobile < threshold) weaknesses.push('Mobile Friendliness');
  if (categoryScores.performance < threshold) weaknesses.push('Performance');
  if (categoryScores.https < threshold) weaknesses.push('HTTPS Security');
  if (categoryScores.social < threshold) weaknesses.push('Social Media');
  
  return weaknesses.length > 0 ? weaknesses : ['All areas are adequately optimized'];
}

// API Routes
app.get('/', (req, res) => {
  res.json({
    message: '🚀 SEO Analyzer API - REAL ANALYSIS',
    endpoints: {
      analyze: 'POST /api/analyze',
      health: 'GET /health',
      test: 'GET /test'
    },
    note: 'This API performs REAL SEO analysis of any website'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'SEO Analyzer API',
    timestamp: new Date().toISOString(),
    features: ['Real SEO Analysis', '10+ Check Categories', 'Custom Scoring']
  });
});

app.get('/test', async (req, res) => {
  try {
    const testUrl = 'https://example.com';
    const result = await analyzeWebsite(testUrl);
    res.json({
      message: 'Test analysis successful!',
      testUrl,
      result: {
        overallScore: result.scores.overall,
        grade: result.scores.grade,
        categories: Object.keys(result.scores.categoryScores).length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
});

// MAIN ANALYSIS ENDPOINT
app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    // Validate URL format
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    
    try {
      new URL(targetUrl);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }
    
    console.log(`🎯 Starting REAL analysis for: ${targetUrl}`);
    
    // Perform analysis
    const result = await analyzeWebsite(targetUrl);
    
    console.log(`✅ Analysis completed for: ${targetUrl}`);
    console.log(`📊 Overall Score: ${result.scores.overall}/100 (${result.scores.grade})`);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
    
    // Try to provide helpful error message
    let errorMessage = 'Analysis failed';
    let statusCode = 500;
    
    if (error.message.includes('timeout')) {
      errorMessage = 'Website took too long to respond';
      statusCode = 408;
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Could not connect to the website. Please check the URL.';
      statusCode = 400;
    } else if (error.message.includes('403') || error.message.includes('401')) {
      errorMessage = 'Website blocked access. Try a different website.';
      statusCode = 403;
    } else if (error.message.includes('404')) {
      errorMessage = 'Website not found. Please check the URL.';
      statusCode = 404;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🚀 SEO ANALYZER API - REAL VERSION     ║
  ╚══════════════════════════════════════════╝
  
  ✅ Server:    http://localhost:${PORT}
  📊 Health:    http://localhost:${PORT}/health
  🔍 Test:      http://localhost:${PORT}/test
  📍 Endpoint:  POST http://localhost:${PORT}/api/analyze
  
  📡 Features:
  • Real website analysis (not demo data)
  • 10+ SEO categories checked
  • Custom scoring algorithm
  • Detailed recommendations
  • Mobile & performance checks
  
  ⚡ Ready to analyze any website!
  `);
});