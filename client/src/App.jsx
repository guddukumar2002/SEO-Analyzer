import { useState } from 'react'
import './App.css'
import axios from 'axios'

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const analyzeSite = async () => {
    if (!url.trim()) {
      setError('Please enter a website URL')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      // Use proxy via vite.config.js or direct backend URL
      const response = await axios.get(`/api/analyze?url=${encodeURIComponent(url)}`)
      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze. Is the backend running?')
    }

    setLoading(false)
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+': case 'A': return '#10b981'
      case 'B': return '#f59e0b'
      case 'C': case 'D': return '#f97316'
      default: return '#ef4444'
    }
  }

  const prefillUrl = (prefilledUrl) => {
    setUrl(prefilledUrl)
    setTimeout(() => analyzeSite(), 100)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🔍 SEO Analyzer Pro</h1>
        <p className="subtitle">A complete Woorank clone for professional website analysis</p>
      </header>

      <main className="main">
        {/* INPUT SECTION */}
        <div className="card input-section">
          <h2>Analyze Your Website</h2>
          <p>Enter any website URL to get a detailed SEO report</p>

          <div className="input-group">
            <input
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && analyzeSite()}
              disabled={loading}
            />
            <button onClick={analyzeSite} disabled={loading}>
              {loading ? 'Analyzing...' : 'Analyze SEO'}
            </button>
          </div>

          <div className="quick-tests">
            <p>Try these test sites:</p>
            <div className="test-buttons">
              {['https://httpbin.org/html', 'https://example.com', 'https://stackoverflow.com'].map(testUrl => (
                <button key={testUrl} className="test-btn" onClick={() => prefillUrl(testUrl)}>
                  {new URL(testUrl).hostname}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="card loading-card">
            <div className="spinner"></div>
            <h3>Analyzing {url}</h3>
            <p>Checking meta tags, headings, images, technical SEO, and more...</p>
          </div>
        )}

        {/* RESULTS */}
        {result && (
          <div className="results-container">
            {/* HEADER */}
            <div className="card result-header">
              <h2>SEO Report for <span className="report-url">{result.url}</span></h2>
              <p className="report-date">Analyzed on {new Date(result.analyzedAt).toLocaleString()}</p>
            </div>

            {/* OVERALL SCORE */}
            <div className="card score-card">
              <div className="score-display">
                <div className="score-circle" style={{ borderColor: getScoreColor(result.score) }}>
                  <span className="score-number">{result.score}</span>
                  <span className="score-label">/100</span>
                </div>
                <div className="score-info">
                  <h3>Overall SEO Score</h3>
                  <div className="grade" style={{ color: getGradeColor(result.grade) }}>
                    Grade: <strong>{result.grade}</strong>
                  </div>
                  <div className="score-stats">
                    <div className="stat">
                      <span className="stat-value">{result.statistics.passedChecks}</span>
                      <span className="stat-label">Passed</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{result.statistics.failedChecks}</span>
                      <span className="stat-label">Failed</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{result.statistics.totalChecks}</span>
                      <span className="stat-label">Total</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RECOMMENDATIONS */}
            {result.recommendations.length > 0 && (
              <div className="card recommendations-card">
                <h3>💡 Recommendations</h3>
                <ul className="recommendations-list">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* DETAILED CHECKS */}
            <div className="card checks-card">
              <h3>Detailed Analysis ({result.checks.length} checks performed)</h3>
              <div className="checks-grid">
                {result.checks.map((check, idx) => (
                  <div key={idx} className={`check-item ${check.passed ? 'passed' : 'failed'}`}>
                    <div className="check-header">
                      <span className="check-name">{check.name}</span>
                      <span className="check-status">{check.passed ? '✅' : '❌'}</span>
                    </div>
                    <div className="check-category">{check.category}</div>
                    <div className="check-value">{check.value}</div>
                    <div className="check-weight">Weight: {check.weight} points</div>
                  </div>
                ))}
              </div>
            </div>

            {/* DETAILS */}
            <div className="card details-card">
              <h3>Technical Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <strong>Title:</strong>
                  <span>{result.details.meta.title}</span>
                </div>
                <div className="detail-item">
                  <strong>Description:</strong>
                  <span>{result.details.meta.description}</span>
                </div>
                <div className="detail-item">
                  <strong>H1 Tags:</strong>
                  <span>{result.details.headings.headings.h1.length} found</span>
                </div>
                <div className="detail-item">
                  <strong>Images:</strong>
                  <span>{result.details.images.total} total, {result.details.images.missingAlt} missing alt</span>
                </div>
                <div className="detail-item">
                  <strong>Word Count:</strong>
                  <span>{result.details.onpage.wordCount} words</span>
                </div>
                <div className="detail-item">
                  <strong>HTTPS:</strong>
                  <span className={result.details.technical.checks.find(c => c.name === 'HTTPS/SSL')?.passed ? 'good' : 'bad'}>
                    {result.details.technical.checks.find(c => c.name === 'HTTPS/SSL')?.passed ? 'Yes ✅' : 'No ❌'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>SEO Analyzer Pro v1.0 | Woorank Clone | Built for Assessment</p>
        <p className="footer-note">Backend running on port 5000 | Frontend on port 5173</p>
      </footer>
    </div>
  )
}

export default App