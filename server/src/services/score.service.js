class ScoreService {
  calculate(categoryResults) {
    let totalScore = 0;
    let maxPossibleScore = 0;
    const allChecks = [];

    // Combine all checks from every category
    const categories = ['meta', 'headings', 'images', 'urlStructure', 'technical', 'onpage', 'authority'];
    categories.forEach(category => {
      if (categoryResults[category] && categoryResults[category].checks) {
        categoryResults[category].checks.forEach(check => {
          allChecks.push({
            ...check,
            category
          });
          maxPossibleScore += check.weight;
          if (check.passed) {
            totalScore += check.weight;
          }
        });
      }
    });

    // Calculate percentage
    const overallScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

    // Get Grade
    const grade = this._getGrade(overallScore);

    // Generate recommendations
    const recommendations = this._getRecommendations(allChecks);

    return {
      score: overallScore,
      grade,
      checks: allChecks,
      recommendations,
      stats: {
        totalChecks: allChecks.length,
        passedChecks: allChecks.filter(c => c.passed).length,
        failedChecks: allChecks.filter(c => !c.passed).length
      }
    };
  }

  _getGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  _getRecommendations(checks) {
    const recs = [];
    const failedHighWeight = checks.filter(c => !c.passed && c.weight >= 10);

    failedHighWeight.forEach(check => {
      switch (check.name) {
        case 'Title Length':
          recs.push('✏️  Write a title between 50-60 characters.');
          break;
        case 'Description Length':
          recs.push('📝  Craft a meta description between 120-160 characters.');
          break;
        case 'H1 Count':
          recs.push('🏷️  Use exactly one H1 tag per page.');
          break;
        case 'HTTPS/SSL':
          recs.push('🔒  Install an SSL certificate to enable HTTPS.');
          break;
        case 'Image Alt Tags':
          recs.push('🖼️  Add descriptive alt text to all images.');
          break;
        case 'Content Length':
          recs.push('📄  Increase your page content to at least 300 words.');
          break;
      }
    });

    if (recs.length === 0) {
      recs.push('✅  Great job! Your page follows core SEO best practices.');
    }

    return recs.slice(0, 5); // Top 5 recommendations
  }
}

module.exports = new ScoreService();