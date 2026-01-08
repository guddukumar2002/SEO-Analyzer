class ScoreService {
    calculateOverallScore(analysis) {
        // Weights for different categories
        const weights = {
            meta: 0.25,      // Meta tags importance
            headings: 0.15,  // Heading structure
            images: 0.10,    // Image optimization
            links: 0.10,     // Link profile
            content: 0.15,   // Content quality
            url: 0.05,       // URL structure
            mobile: 0.05,    // Mobile friendliness
            performance: 0.05, // Page speed
            technical: 0.05, // Technical SEO
            social: 0.05     // Social media
        };
        
        let totalScore = 0;
        let weightSum = 0;
        
        // Meta tags score
        if (analysis.metaTags) {
            const metaScore = (analysis.metaTags.title.score + analysis.metaTags.description.score) / 2;
            totalScore += metaScore * weights.meta;
            weightSum += weights.meta;
        }
        
        // Headings score
        if (analysis.headings?.score !== undefined) {
            totalScore += analysis.headings.score * weights.headings;
            weightSum += weights.headings;
        }
        
        // Images score
        if (analysis.images?.score !== undefined) {
            totalScore += analysis.images.score * weights.images;
            weightSum += weights.images;
        }
        
        // Links score
        if (analysis.links?.score !== undefined) {
            totalScore += analysis.links.score * weights.links;
            weightSum += weights.links;
        }
        
        // Content score
        if (analysis.content?.score !== undefined) {
            totalScore += analysis.content.score * weights.content;
            weightSum += weights.content;
        }
        
        // URL score
        if (analysis.urlStructure?.score !== undefined) {
            totalScore += analysis.urlStructure.score * weights.url;
            weightSum += weights.url;
        }
        
        // Mobile score
        if (analysis.mobileFriendly?.score !== undefined) {
            totalScore += analysis.mobileFriendly.score * weights.mobile;
            weightSum += weights.mobile;
        }
        
        // Performance score
        if (analysis.performance?.score !== undefined) {
            totalScore += analysis.performance.score * weights.performance;
            weightSum += weights.performance;
        }
        
        // Technical SEO score
        if (analysis.technical) {
            const technicalScore = this.calculateTechnicalScore(analysis.technical);
            totalScore += technicalScore * weights.technical;
            weightSum += weights.technical;
        }
        
        // Social score
        if (analysis.social?.score !== undefined) {
            totalScore += analysis.social.score * weights.social;
            weightSum += weights.social;
        }
        
        // Normalize score
        const normalizedScore = weightSum > 0 ? totalScore / weightSum : 0;
        
        // Round and ensure within bounds
        const finalScore = Math.max(0, Math.min(100, Math.round(normalizedScore)));
        
        // Calculate individual category scores
        const categoryScores = {
            meta: analysis.metaTags ? Math.round((analysis.metaTags.title.score + analysis.metaTags.description.score) / 2) : 0,
            headings: analysis.headings?.score || 0,
            images: analysis.images?.score || 0,
            links: analysis.links?.score || 0,
            content: analysis.content?.score || 0,
            url: analysis.urlStructure?.score || 0,
            mobile: analysis.mobileFriendly?.score || 0,
            performance: analysis.performance?.score || 0,
            technical: analysis.technical ? this.calculateTechnicalScore(analysis.technical) : 0,
            social: analysis.social?.score || 0
        };
        
        // Get grade
        const grade = this.getGrade(finalScore);
        
        // Get recommendations
        const recommendations = this.generateRecommendations(analysis, categoryScores);
        
        return {
            overall: finalScore,
            grade: grade,
            categoryScores: categoryScores,
            recommendations: recommendations.slice(0, 5), // Top 5 recommendations
            strengths: this.getStrengths(categoryScores),
            weaknesses: this.getWeaknesses(categoryScores)
        };
    }
    
    calculateTechnicalScore(technical) {
        let score = 50; // Base score
        
        if (technical.canonical) score += 15;
        if (!technical.robots.hasNoindex) score += 15;
        if (technical.structuredData) score += 10;
        if (technical.hasHreflang) score += 10;
        
        return Math.min(100, score);
    }
    
    getGrade(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }
    
    generateRecommendations(analysis, scores) {
        const recommendations = [];
        
        // Meta tags recommendations
        if (scores.meta < 70) {
            if (!analysis.metaTags?.title?.content) {
                recommendations.push('Add a descriptive title tag (50-60 characters)');
            }
            if (!analysis.metaTags?.description?.content) {
                recommendations.push('Add a compelling meta description (120-160 characters)');
            }
            if (analysis.metaTags?.title?.length > 60) {
                recommendations.push('Shorten your title tag (currently too long)');
            }
        }
        
        // Headings recommendations
        if (scores.headings < 70) {
            if (analysis.headings?.h1Count === 0) {
                recommendations.push('Add an H1 heading to the page');
            }
            if (analysis.headings?.multipleH1) {
                recommendations.push('Use only one H1 heading per page');
            }
            if (analysis.headings?.total < 3) {
                recommendations.push('Add more subheadings (H2, H3) to structure content');
            }
        }
        
        // Images recommendations
        if (scores.images < 70) {
            if (analysis.images?.withoutAlt > 0) {
                recommendations.push(`Add alt text to ${analysis.images.withoutAlt} images`);
            }
        }
        
        // Content recommendations
        if (scores.content < 70) {
            if (analysis.content?.wordCount < 300) {
                recommendations.push('Add more content (aim for at least 300 words)');
            }
        }
        
        // URL recommendations
        if (scores.url < 70) {
            if (!analysis.urlStructure?.isHTTPS) {
                recommendations.push('Switch to HTTPS for better security and SEO');
            }
            if (analysis.urlStructure?.hasUppercase) {
                recommendations.push('Use lowercase letters in URLs');
            }
        }
        
        // Mobile recommendations
        if (scores.mobile < 70) {
            if (!analysis.mobileFriendly?.hasViewport) {
                recommendations.push('Add viewport meta tag for mobile responsiveness');
            }
        }
        
        // Performance recommendations
        if (scores.performance < 70) {
            if (!analysis.performance?.hasCaching) {
                recommendations.push('Implement browser caching for faster load times');
            }
        }
        
        // Technical recommendations
        if (scores.technical < 70) {
            if (!analysis.technical?.canonical) {
                recommendations.push('Add canonical URL to avoid duplicate content');
            }
            if (!analysis.technical?.structuredData) {
                recommendations.push('Add structured data (Schema.org) for rich results');
            }
        }
        
        // Social recommendations
        if (scores.social < 70) {
            if (!analysis.social?.hasOgTags) {
                recommendations.push('Add Open Graph tags for better social sharing');
            }
        }
        
        return recommendations;
    }
    
    getStrengths(scores) {
        const strengths = [];
        Object.entries(scores).forEach(([category, score]) => {
            if (score >= 80) {
                strengths.push(category);
            }
        });
        return strengths;
    }
    
    getWeaknesses(scores) {
        const weaknesses = [];
        Object.entries(scores).forEach(([category, score]) => {
            if (score < 60) {
                weaknesses.push(category);
            }
        });
        return weaknesses;
    }
}

module.exports = new ScoreService();