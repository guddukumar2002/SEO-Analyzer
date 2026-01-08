const cheerio = require('cheerio');
const axios = require('axios');
const { URL } = require('url');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const UserAgent = require('user-agents');

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

class SEOService {
    constructor() {
        // Realistic user agents
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
    }

    async analyzeWebsite(url) {
        let html = '';
        let finalUrl = url;
        
        try {
            // Try multiple methods to get website content
            html = await this.fetchWithMultipleMethods(url);
            
            if (!html || html.length < 100) {
                throw new Error('Failed to fetch content');
            }
            
            const $ = cheerio.load(html);
            
            // Get actual final URL after redirects
            finalUrl = this.extractCanonicalUrl($) || url;
            
            return await this.performFullAnalysis($, finalUrl, html);
            
        } catch (error) {
            console.error(`❌ Failed to analyze ${url}:`, error.message);
            // Last resort: try with puppeteer
            return await this.analyzeWithPuppeteer(url);
        }
    }

    async fetchWithMultipleMethods(url) {
        const methods = [
            this.fetchWithRandomUserAgent.bind(this),
            this.fetchWithBrowserHeaders.bind(this),
            this.fetchWithDelayedRequest.bind(this)
        ];

        for (const method of methods) {
            try {
                const html = await method(url);
                if (html && html.length > 1000) {
                    console.log(`✅ Success with ${method.name}`);
                    return html;
                }
            } catch (error) {
                // Try next method
                continue;
            }
        }
        throw new Error('All fetch methods failed');
    }

    async fetchWithRandomUserAgent(url) {
        const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0'
            },
            timeout: 10000,
            maxRedirects: 5,
            validateStatus: (status) => status < 500
        });
        
        return response.data;
    }

    async fetchWithBrowserHeaders(url) {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://www.google.com/',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0'
            },
            timeout: 15000
        });
        
        return response.data;
    }

    async fetchWithDelayedRequest(url) {
        // Add random delay to appear more human
        await this.delay(1000 + Math.random() * 2000);
        
        return await this.fetchWithRandomUserAgent(url);
    }

    async analyzeWithPuppeteer(url) {
        let browser;
        try {
            console.log(`🔍 Using Puppeteer for: ${url}`);
            
            browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--disable-blink-features=AutomationControlled'
                ]
            });
            
            const page = await browser.newPage();
            
            // Set realistic viewport
            await page.setViewport({ width: 1366, height: 768 });
            
            // Set random user agent
            const userAgent = new UserAgent({ deviceCategory: 'desktop' });
            await page.setUserAgent(userAgent.toString());
            
            // Block unnecessary resources for speed
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const resourceType = req.resourceType();
                if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });
            
            // Navigate with timeout
            await page.goto(url, { 
                waitUntil: 'networkidle2', 
                timeout: 30000 
            });
            
            // Wait a bit for JavaScript to execute
            await this.delay(2000);
            
            // Get HTML content
            const html = await page.content();
            
            await browser.close();
            
            const $ = cheerio.load(html);
            return await this.performFullAnalysis($, url, html);
            
        } catch (error) {
            if (browser) await browser.close();
            console.error(`❌ Puppeteer failed for ${url}:`, error.message);
            throw error;
        }
    }

    async performFullAnalysis($, url, html) {
        const startTime = Date.now();
        
        // Run all analyses in parallel for speed
        const [
            metaTags,
            headings,
            images,
            links,
            content,
            urlStructure,
            mobileFriendly,
            performance,
            social,
            technical
        ] = await Promise.all([
            this.analyzeMetaTags($),
            this.analyzeHeadings($),
            this.analyzeImages($),
            this.analyzeLinks($, url),
            this.analyzeContent($, html),
            this.analyzeURL(url),
            this.checkMobileFriendly($),
            this.checkPerformance(url, startTime),
            this.analyzeSocialTags($),
            this.analyzeTechnicalSEO($, url)
        ]);
        
        return {
            metaTags,
            headings,
            images,
            links,
            content,
            urlStructure,
            mobileFriendly,
            performance,
            social,
            technical,
            timestamp: new Date().toISOString()
        };
    }

    extractCanonicalUrl($) {
        const canonical = $('link[rel="canonical"]').attr('href');
        const ogUrl = $('meta[property="og:url"]').attr('content');
        return canonical || ogUrl || null;
    }

    analyzeMetaTags($) {
        const title = $('title').text().trim();
        const description = $('meta[name="description"]').attr('content') || '';
        const keywords = $('meta[name="keywords"]').attr('content') || '';
        
        // Get all meta tags
        const metaTags = {};
        $('meta').each((i, el) => {
            const name = $(el).attr('name') || $(el).attr('property') || $(el).attr('itemprop');
            const content = $(el).attr('content');
            if (name && content) {
                metaTags[name] = content;
            }
        });
        
        // Check for duplicate titles
        const titleCount = $('title').length;
        
        return {
            title: {
                content: title,
                length: title.length,
                hasTitle: title.length > 0,
                isDuplicate: titleCount > 1,
                score: this.calculateTitleScore(title)
            },
            description: {
                content: description,
                length: description.length,
                hasDescription: description.length > 0,
                score: this.calculateDescriptionScore(description)
            },
            keywords: {
                content: keywords,
                hasKeywords: keywords.length > 0
            },
            metaTagsCount: Object.keys(metaTags).length,
            allMetaTags: metaTags
        };
    }

    analyzeHeadings($) {
        const headings = { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] };
        const headingStructure = [];
        
        $('h1, h2, h3, h4, h5, h6').each((i, el) => {
            const tagName = $(el).prop('tagName').toLowerCase();
            const text = $(el).text().trim();
            const length = text.length;
            
            headings[tagName].push({ text, length });
            headingStructure.push({ tag: tagName, text: text.substring(0, 100) });
        });
        
        // Check heading hierarchy
        const hierarchyIssues = this.checkHeadingHierarchy(headings);
        
        return {
            ...headings,
            structure: headingStructure,
            hierarchyIssues,
            total: Object.values(headings).flat().length,
            h1Count: headings.h1.length,
            hasH1: headings.h1.length > 0,
            multipleH1: headings.h1.length > 1,
            score: this.calculateHeadingScore(headings)
        };
    }

    checkHeadingHierarchy(headings) {
        const issues = [];
        
        // Check if H1 exists
        if (headings.h1.length === 0) {
            issues.push('No H1 tag found');
        } else if (headings.h1.length > 1) {
            issues.push(`Multiple H1 tags found (${headings.h1.length})`);
        }
        
        // Check heading order
        let lastLevel = 0;
        const allHeadings = [];
        
        for (let i = 1; i <= 6; i++) {
            if (headings[`h${i}`].length > 0) {
                allHeadings.push({ level: i, count: headings[`h${i}`].length });
            }
        }
        
        // Check for skipping levels
        for (let i = 0; i < allHeadings.length - 1; i++) {
            if (allHeadings[i + 1].level > allHeadings[i].level + 1) {
                issues.push(`Heading level skipped from H${allHeadings[i].level} to H${allHeadings[i + 1].level}`);
            }
        }
        
        return issues;
    }

    analyzeImages($) {
        const images = [];
        let missingAlt = 0;
        let missingSrc = 0;
        let largeImages = 0;
        
        $('img').each((i, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src');
            const alt = $(el).attr('alt') || '';
            const width = $(el).attr('width');
            const height = $(el).attr('height');
            
            if (!src) missingSrc++;
            if (!alt.trim()) missingAlt++;
            
            // Check if image might be too large
            if (src && src.includes('.jpg') || src.includes('.png')) {
                const isLarge = src.includes('large') || src.includes('big') || 
                               (width && parseInt(width) > 2000) || 
                               (height && parseInt(height) > 2000);
                if (isLarge) largeImages++;
            }
            
            images.push({ 
                src: src || 'No source', 
                alt, 
                hasAlt: alt.trim().length > 0,
                width,
                height
            });
        });
        
        const totalImages = images.length;
        const altTextRatio = totalImages > 0 ? ((totalImages - missingAlt) / totalImages) * 100 : 100;
        
        return {
            total: totalImages,
            withAlt: totalImages - missingAlt,
            withoutAlt: missingAlt,
            missingSrc: missingSrc,
            largeImages: largeImages,
            images: images.slice(0, 20), // Limit response size
            altTextRatio: Math.round(altTextRatio),
            score: Math.round(altTextRatio)
        };
    }

    analyzeLinks($, baseUrl) {
        const internalLinks = [];
        const externalLinks = [];
        const brokenLinks = []; // Would need actual checking
        const nofollowLinks = [];
        
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            const rel = $(el).attr('rel') || '';
            const title = $(el).attr('title') || '';
            const isNofollow = rel.includes('nofollow');
            
            if (href && href !== '#' && !href.startsWith('javascript:')) {
                const isInternal = this.isInternalLink(href, baseUrl);
                const linkType = this.getLinkType(href);
                
                const linkObj = { 
                    href, 
                    text: text || '[No text]', 
                    isInternal,
                    linkType,
                    isNofollow,
                    hasTitle: title.length > 0,
                    title
                };
                
                if (isInternal) {
                    internalLinks.push(linkObj);
                } else {
                    externalLinks.push(linkObj);
                }
                
                if (isNofollow) {
                    nofollowLinks.push(linkObj);
                }
            }
        });
        
        // Calculate link diversity score
        const uniqueInternal = [...new Set(internalLinks.map(l => l.href))].length;
        const uniqueExternal = [...new Set(externalLinks.map(l => l.href))].length;
        
        return {
            internal: internalLinks.length,
            external: externalLinks.length,
            nofollow: nofollowLinks.length,
            uniqueInternal,
            uniqueExternal,
            internalLinks: internalLinks.slice(0, 15),
            externalLinks: externalLinks.slice(0, 15),
            nofollowLinks: nofollowLinks.slice(0, 10),
            hasInternalLinks: internalLinks.length > 0,
            hasExternalLinks: externalLinks.length > 0,
            internalExternalRatio: externalLinks.length > 0 ? 
                (internalLinks.length / externalLinks.length).toFixed(2) : 'N/A',
            score: this.calculateLinkScore(internalLinks, externalLinks)
        };
    }

    getLinkType(href) {
        if (!href) return 'unknown';
        if (href.includes('mailto:')) return 'email';
        if (href.includes('tel:')) return 'phone';
        if (href.includes('#')) return 'anchor';
        if (href.startsWith('javascript:')) return 'javascript';
        if (href.includes('.pdf')) return 'pdf';
        if (href.includes('.doc') || href.includes('.docx')) return 'document';
        return 'standard';
    }

    analyzeContent($, html) {
        // Remove unwanted elements
        $('script, style, nav, footer, header, iframe, noscript').remove();
        
        // Get text content
        const text = $.text().replace(/\s+/g, ' ').trim();
        
        // Count words
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const wordCount = words.length;
        
        // Count paragraphs
        const paragraphs = $('p').length;
        
        // Count sentences (approximate)
        const sentences = text.split(/[.!?]+/).length - 1;
        
        // Calculate readability (Flesch-Kincaid approximation)
        const syllables = this.countSyllables(text);
        const readabilityScore = this.calculateReadability(wordCount, sentences, syllables);
        
        // Check for keyword density (basic)
        const commonKeywords = ['the', 'and', 'for', 'with', 'this', 'that', 'have', 'from'];
        const keywordDensity = {};
        words.slice(0, 50).forEach(word => {
            const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
            if (cleanWord.length > 3 && !commonKeywords.includes(cleanWord)) {
                keywordDensity[cleanWord] = (keywordDensity[cleanWord] || 0) + 1;
            }
        });
        
        // Get top keywords
        const topKeywords = Object.entries(keywordDensity)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, count]) => ({ word, count }));
        
        return {
            wordCount,
            paragraphs,
            sentences,
            readability: readabilityScore,
            topKeywords,
            textPreview: text.substring(0, 500) + '...',
            score: this.calculateContentScore(wordCount, paragraphs, readabilityScore)
        };
    }

    countSyllables(text) {
        // Basic syllable counting
        const words = text.toLowerCase().split(/\s+/);
        let syllableCount = 0;
        
        words.forEach(word => {
            word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
            word = word.replace(/^y/, '');
            const syllables = word.match(/[aeiouy]{1,2}/g);
            syllableCount += syllables ? syllables.length : 1;
        });
        
        return syllableCount;
    }

    calculateReadability(wordCount, sentences, syllables) {
        if (sentences === 0 || wordCount === 0) return 0;
        
        // Flesch Reading Ease Score
        const fleschScore = 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount);
        
        // Convert to 0-100 scale
        return Math.max(0, Math.min(100, fleschScore));
    }

    analyzeURL(url) {
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            const search = urlObj.search;
            const hash = urlObj.hash;
            
            let score = 70; // Base score
            
            // HTTPS check (+20 if yes)
            if (urlObj.protocol === 'https:') score += 20;
            
            // URL length (-1 for every 20 chars over 100)
            const totalLength = urlObj.href.length;
            if (totalLength > 100) {
                const excess = Math.floor((totalLength - 100) / 20);
                score -= Math.min(20, excess);
            }
            
            // Check for query parameters (-5 if too many)
            if (search) {
                const params = new URLSearchParams(search);
                if (params.size > 3) score -= 5;
            }
            
            // Check for hash (-5 if has hash)
            if (hash) score -= 5;
            
            // Check for uppercase letters (-5)
            if (/[A-Z]/.test(path)) score -= 5;
            
            // Check for special characters (-2 each)
            const specialChars = ['%20', '%2F', '%3F', '%3D', '%26'];
            specialChars.forEach(char => {
                if (path.includes(char)) score -= 2;
            });
            
            // Check for file extensions in path
            const fileExtensions = ['.php', '.asp', '.aspx', '.jsp', '.cfm'];
            fileExtensions.forEach(ext => {
                if (path.includes(ext)) score -= 3;
            });
            
            // Check for keywords in URL (+5 if found)
            const urlKeywords = urlObj.href.toLowerCase();
            const goodKeywords = ['blog', 'article', 'news', 'guide', 'tutorial'];
            goodKeywords.forEach(keyword => {
                if (urlKeywords.includes(keyword)) score += 5;
            });
            
            return {
                protocol: urlObj.protocol,
                hostname: urlObj.hostname,
                pathname: path,
                searchParams: search,
                hash: hash,
                fullUrl: urlObj.href,
                length: totalLength,
                isHTTPS: urlObj.protocol === 'https:',
                hasWWW: urlObj.hostname.startsWith('www.'),
                hasUppercase: /[A-Z]/.test(path),
                hasSpecialChars: specialChars.some(char => path.includes(char)),
                hasFileExtension: fileExtensions.some(ext => path.includes(ext)),
                score: Math.max(0, Math.min(100, score))
            };
            
        } catch (error) {
            return {
                protocol: 'unknown',
                hostname: 'invalid',
                pathname: '/',
                fullUrl: url,
                length: url.length,
                isHTTPS: false,
                score: 30
            };
        }
    }

    async checkMobileFriendly($) {
        const viewport = $('meta[name="viewport"]').attr('content') || '';
        const hasViewport = viewport.includes('width=device-width');
        
        // Check for touch icons
        const hasAppleTouchIcon = $('link[rel="apple-touch-icon"]').length > 0;
        const hasThemeColor = $('meta[name="theme-color"]').length > 0;
        
        // Check for mobile-specific CSS
        const hasMediaQueries = $('link[rel="stylesheet"]').filter((i, el) => {
            const href = $(el).attr('href') || '';
            return href.includes('mobile') || href.includes('responsive');
        }).length > 0;
        
        // Check font sizes (basic check)
        const smallFonts = $('*').filter((i, el) => {
            const fontSize = $(el).css('font-size');
            return fontSize && parseInt(fontSize) < 12;
        }).length;
        
        let score = 60; // Base score
        
        if (hasViewport) score += 20;
        if (hasAppleTouchIcon) score += 10;
        if (hasThemeColor) score += 5;
        if (hasMediaQueries) score += 5;
        if (smallFonts === 0) score += 5;
        
        return {
            hasViewport,
            viewportContent: viewport,
            hasAppleTouchIcon,
            hasThemeColor,
            hasMediaQueries,
            smallFontsCount: smallFonts,
            isResponsive: hasViewport || hasMediaQueries,
            score: Math.min(100, score)
        };
    }

    async checkPerformance(url, startTime) {
        try {
            const response = await axios.head(url, {
                timeout: 8000,
                validateStatus: () => true
            });
            
            const headers = response.headers;
            const loadTime = Date.now() - startTime;
            
            let score = 0;
            if (loadTime < 1000) score = 100;
            else if (loadTime < 2000) score = 90;
            else if (loadTime < 3000) score = 75;
            else if (loadTime < 5000) score = 50;
            else score = 30;
            
            // Check for caching headers
            const hasCacheControl = !!headers['cache-control'];
            const hasExpires = !!headers['expires'];
            const hasETag = !!headers['etag'];
            
            if (hasCacheControl) score += 5;
            if (hasETag) score += 5;
            
            // Check for compression
            const hasGzip = headers['content-encoding'] === 'gzip';
            const hasBrotli = headers['content-encoding'] === 'br';
            if (hasGzip || hasBrotli) score += 5;
            
            return {
                loadTime: `${loadTime}ms`,
                statusCode: response.status,
                cacheControl: headers['cache-control'] || 'Not set',
                contentEncoding: headers['content-encoding'] || 'Not set',
                hasCaching: hasCacheControl || hasExpires,
                hasCompression: hasGzip || hasBrotli,
                server: headers['server'] || 'Unknown',
                score: Math.min(100, score)
            };
            
        } catch (error) {
            return {
                loadTime: 'N/A',
                statusCode: 0,
                score: 20
            };
        }
    }

    analyzeSocialTags($) {
        const socialTags = {
            facebook: {},
            twitter: {},
            linkedin: {},
            og: {}
        };
        
        // Open Graph tags
        $('meta[property^="og:"]').each((i, el) => {
            const property = $(el).attr('property');
            const content = $(el).attr('content');
            if (property && content) {
                socialTags.og[property.replace('og:', '')] = content;
            }
        });
        
        // Twitter Cards
        $('meta[name^="twitter:"]').each((i, el) => {
            const name = $(el).attr('name');
            const content = $(el).attr('content');
            if (name && content) {
                socialTags.twitter[name.replace('twitter:', '')] = content;
            }
        });
        
        // Facebook
        $('meta[property^="fb:"]').each((i, el) => {
            const property = $(el).attr('property');
            const content = $(el).attr('content');
            if (property && content) {
                socialTags.facebook[property.replace('fb:', '')] = content;
            }
        });
        
        // LinkedIn specific
        $('meta[name="linkedin:"]').each((i, el) => {
            const name = $(el).attr('name');
            const content = $(el).attr('content');
            if (name && content) {
                socialTags.linkedin[name.replace('linkedin:', '')] = content;
            }
        });
        
        const hasOgTags = Object.keys(socialTags.og).length > 0;
        const hasTwitterTags = Object.keys(socialTags.twitter).length > 0;
        
        return {
            ...socialTags,
            hasOgTags,
            hasTwitterTags,
            score: this.calculateSocialScore(socialTags)
        };
    }

    analyzeTechnicalSEO($, url) {
        const technical = {
            robots: {},
            sitemap: false,
            canonical: false,
            structuredData: false,
            schema: {}
        };
        
        // Check robots meta tag
        const robotsMeta = $('meta[name="robots"]').attr('content');
        if (robotsMeta) {
            technical.robots.meta = robotsMeta;
            technical.robots.hasNoindex = robotsMeta.includes('noindex');
            technical.robots.hasNofollow = robotsMeta.includes('nofollow');
        }
        
        // Check canonical
        technical.canonical = $('link[rel="canonical"]').length > 0;
        
        // Check for sitemap in robots.txt (would need separate fetch)
        // Check for structured data
        const scriptTags = $('script[type="application/ld+json"]');
        technical.structuredData = scriptTags.length > 0;
        
        if (scriptTags.length > 0) {
            scriptTags.each((i, el) => {
                try {
                    const json = JSON.parse($(el).html());
                    if (json['@type']) {
                        technical.schema[json['@type']] = (technical.schema[json['@type']] || 0) + 1;
                    }
                } catch (e) {
                    // Invalid JSON
                }
            });
        }
        
        // Check for hreflang
        technical.hasHreflang = $('link[rel="alternate"][hreflang]').length > 0;
        
        // Check for amphtml
        technical.hasAmp = $('link[rel="amphtml"]').length > 0;
        
        return technical;
    }

    // Helper methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    isInternalLink(href, baseUrl) {
        if (!href || href.startsWith('javascript:')) return false;
        if (href.startsWith('#') || href.startsWith('/') || href.startsWith('./')) return true;
        
        try {
            const url = new URL(href, baseUrl);
            const base = new URL(baseUrl);
            return url.hostname === base.hostname;
        } catch {
            return false;
        }
    }

    calculateTitleScore(title) {
        if (!title) return 0;
        const length = title.length;
        let score = 0;
        
        if (length >= 50 && length <= 60) score = 100;
        else if (length >= 40 && length <= 70) score = 85;
        else if (length >= 30 && length <= 80) score = 70;
        else if (length >= 20 && length <= 90) score = 50;
        else score = 30;
        
        // Bonus for keyword at beginning
        if (title.length > 0) {
            const firstWord = title.split(' ')[0];
            if (firstWord.length >= 3) score += 5;
        }
        
        return Math.min(100, score);
    }

    calculateDescriptionScore(description) {
        if (!description) return 0;
        const length = description.length;
        let score = 0;
        
        if (length >= 120 && length <= 160) score = 100;
        else if (length >= 100 && length <= 180) score = 85;
        else if (length >= 80 && length <= 200) score = 70;
        else if (length >= 50 && length <= 250) score = 50;
        else score = 30;
        
        // Check for call to action
        const ctas = ['learn', 'discover', 'find', 'get', 'buy', 'shop', 'visit', 'try'];
        if (ctas.some(cta => description.toLowerCase().includes(cta))) {
            score += 5;
        }
        
        return Math.min(100, score);
    }

    calculateHeadingScore(headings) {
        let score = 0;
        
        // H1 check (40 points)
        if (headings.h1.length === 1) {
            score += 40;
            const h1Text = headings.h1[0].text;
            if (h1Text.length >= 20 && h1Text.length <= 70) {
                score += 10;
            }
        } else if (headings.h1.length === 0) {
            score -= 30;
        } else {
            score -= 20; // Multiple H1s
        }
        
        // H2 check (30 points)
        if (headings.h2.length >= 2 && headings.h2.length <= 5) {
            score += 30;
        } else if (headings.h2.length >= 1) {
            score += 15;
        }
        
        // H3 check (20 points)
        if (headings.h3.length >= 2) {
            score += 20;
        } else if (headings.h3.length >= 1) {
            score += 10;
        }
        
        // Overall structure (10 points)
        const totalHeadings = Object.values(headings).flat().length;
        if (totalHeadings >= 5 && totalHeadings <= 15) {
            score += 10;
        }
        
        return Math.max(0, Math.min(100, score));
    }

    calculateLinkScore(internalLinks, externalLinks) {
        let score = 50;
        
        const internalCount = internalLinks.length;
        const externalCount = externalLinks.length;
        
        // Internal links scoring
        if (internalCount >= 20) score += 30;
        else if (internalCount >= 10) score += 20;
        else if (internalCount >= 5) score += 10;
        else if (internalCount === 0) score -= 20;
        
        // External links scoring (balanced approach)
        if (externalCount >= 5 && externalCount <= 20) score += 15;
        else if (externalCount > 0) score += 5;
        
        // Penalize if too many external links
        if (externalCount > 30) score -= 10;
        
        // Check for nofollow ratio
        const nofollowCount = internalLinks.filter(l => l.isNofollow).length + 
                             externalLinks.filter(l => l.isNofollow).length;
        const totalLinks = internalCount + externalCount;
        
        if (totalLinks > 0) {
            const nofollowRatio = nofollowCount / totalLinks;
            if (nofollowRatio > 0.5) score -= 10; // Too many nofollow
        }
        
        return Math.max(0, Math.min(100, score));
    }

    calculateContentScore(wordCount, paragraphs, readability) {
        let score = 0;
        
        // Word count (40 points)
        if (wordCount >= 1000) score += 40;
        else if (wordCount >= 500) score += 30;
        else if (wordCount >= 300) score += 20;
        else if (wordCount >= 150) score += 10;
        else score += 5;
        
        // Paragraphs (30 points)
        if (paragraphs >= 10) score += 30;
        else if (paragraphs >= 5) score += 20;
        else if (paragraphs >= 3) score += 15;
        else if (paragraphs >= 1) score += 5;
        
        // Readability (30 points)
        if (readability >= 80) score += 30;
        else if (readability >= 60) score += 20;
        else if (readability >= 40) score += 10;
        else score += 5;
        
        return Math.min(100, score);
    }

    calculateSocialScore(socialTags) {
        let score = 0;
        
        const ogTags = Object.keys(socialTags.og);
        const twitterTags = Object.keys(socialTags.twitter);
        
        if (ogTags.includes('title') && ogTags.includes('description')) score += 40;
        else if (ogTags.length >= 2) score += 20;
        else if (ogTags.length >= 1) score += 10;
        
        if (twitterTags.includes('card') && twitterTags.includes('title')) score += 30;
        else if (twitterTags.length >= 2) score += 15;
        else if (twitterTags.length >= 1) score += 5;
        
        return Math.min(100, score);
    }
}

module.exports = new SEOService();