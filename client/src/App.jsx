import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const analyzeWebsite = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      console.log("🔍 Starting analysis for:", url);

      // Try multiple endpoints in case one fails
      const endpoints = [
        "http://localhost:5000/api/analyze", // New direct endpoint
        "http://localhost:5000/api/analysis/analyze", // Original endpoint
        "/api/analyze", // Proxy endpoint if using vite proxy
      ];

      let response = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await axios.post(
            endpoint,
            {
              url: url.startsWith("http") ? url : `https://${url}`,
            },
            {
              timeout: 30000, // 30 second timeout
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.data) {
            console.log(`✅ Success with endpoint: ${endpoint}`);
            break;
          }
        } catch (err) {
          lastError = err;
          console.log(`❌ Failed with ${endpoint}:`, err.message);
          continue;
        }
      }

      if (!response) {
        throw new Error(
          `All endpoints failed. Last error: ${lastError?.message || "Unknown"}`
        );
      }

      console.log("✅ API Response:", response.data);

      if (!response.data.success && response.data.error) {
        throw new Error(response.data.error);
      }

      setResult(response.data);
    } catch (err) {
      console.error("❌ API Error:", err);

      let errorMessage = "Analysis failed";

      if (err.response) {
        // Server responded with error status
        errorMessage = `Server Error (${err.response.status}): `;
        if (err.response.data && typeof err.response.data === "object") {
          errorMessage +=
            err.response.data.error ||
            err.response.data.message ||
            JSON.stringify(err.response.data);
        } else {
          errorMessage += err.response.data || "Unknown error";
        }
      } else if (err.request) {
        // Request was made but no response
        errorMessage = "No response from server. Please check:";
        errorMessage +=
          "\n1. Is backend server running? (Run: cd server && npm start)";
        errorMessage += "\n2. Check if port 5000 is available";
        errorMessage += "\n3. Check console for backend errors";
      } else {
        // Something happened in setting up the request
        errorMessage = `Request Error: ${err.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Test backend connection
  const testBackendConnection = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/analyze", {
        url: url.startsWith("http") ? url : `https://${url}`,
      });
      alert(
        `✅ Backend is running!\nStatus: ${response.data.status}\nService: ${response.data.service}`
      );
    } catch (err) {
      alert(
        `❌ Backend is NOT running!\nError: ${err.message}\n\nPlease start backend first:\ncd server\nnpm start`
      );
    }
  };

  // Safe rendering functions
  const renderScoreCard = () => {
    if (!result || !result.scores || result.scores.overall === undefined) {
      return (
        <div className="score-card">
          <h2>Overall SEO Score</h2>
          <div className="score-circle" style={{ background: "#ccc" }}>
            <span className="score-value">N/A</span>
          </div>
          <p className="score-grade">No score available</p>
        </div>
      );
    }

    const score = result.scores.overall;
    let grade = "";
    let gradeColor = "#666";

    if (score >= 90) {
      grade = "Excellent";
      gradeColor = "#28a745";
    } else if (score >= 70) {
      grade = "Good";
      gradeColor = "#17a2b8";
    } else if (score >= 50) {
      grade = "Fair";
      gradeColor = "#ffc107";
    } else {
      grade = "Needs Improvement";
      gradeColor = "#dc3545";
    }

    return (
      <div className="score-card">
        <h2>Overall SEO Score</h2>
        <div
          className="score-circle"
          style={{
            background: `linear-gradient(135deg, ${gradeColor} 0%, ${gradeColor}80 100%)`,
          }}
        >
          <span className="score-value">{score}/100</span>
        </div>
        <p
          className="score-grade"
          style={{ color: gradeColor, fontWeight: "bold" }}
        >
          {result.scores.grade || grade}
        </p>
        {result.cached && (
          <small style={{ color: "#666", fontStyle: "italic" }}>
            ⚡ Serving cached results (analyzed within last hour)
          </small>
        )}
      </div>
    );
  };

  const renderCategoryScores = () => {
    if (!result?.scores?.categoryScores) {
      return (
        <div className="categories">
          <h3>Category Scores</h3>
          <div className="category-grid">
            {[
              "meta",
              "headings",
              "images",
              "links",
              "content",
              "technical",
            ].map((category) => (
              <div key={category} className="category-item">
                <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                <div className="category-score">0/100</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: "0%" }}></div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ color: "#666", textAlign: "center", marginTop: "10px" }}>
            No category scores available
          </p>
        </div>
      );
    }

    const categories = result.scores.categoryScores;

    return (
      <div className="categories">
        <h3>Category Scores</h3>
        <div className="category-grid">
          {Object.entries(categories).map(([category, score]) => (
            <div key={category} className="category-item">
              <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
              <div className="category-score">{score}/100</div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${score}%`,
                    background:
                      score >= 70
                        ? "#28a745"
                        : score >= 50
                        ? "#ffc107"
                        : "#dc3545",
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDetailedAnalysis = () => {
    if (!result?.analysis) {
      return (
        <div className="detailed-analysis">
          <h3>Detailed Analysis</h3>
          <div className="analysis-section">
            <div className="analysis-item">
              <p style={{ textAlign: "center", color: "#666" }}>
                No analysis data available
              </p>
            </div>
          </div>
        </div>
      );
    }

    const analysis = result.analysis;

    return (
      <div className="detailed-analysis">
        <h3>Detailed Analysis</h3>

        {/* Meta Tags */}
        <div className="analysis-section">
          <h4>Meta Tags</h4>
          <div className="analysis-item">
            <div className="meta-tag-analysis">
              <div className="meta-tag-item">
                <strong>Title:</strong>{" "}
                <span
                  className={
                    analysis.metaTags?.title?.content
                      ? "has-content"
                      : "no-content"
                  }
                >
                  {analysis.metaTags?.title?.content || "Not found"}
                </span>
                <div className="meta-tag-stats">
                  <span className="stat">
                    Length:{" "}
                    <strong>{analysis.metaTags?.title?.length || 0}</strong>{" "}
                    chars
                  </span>
                  <span className="stat">
                    Score:{" "}
                    <strong>{analysis.metaTags?.title?.score || 0}/100</strong>
                  </span>
                </div>
              </div>

              <div className="meta-tag-item">
                <strong>Description:</strong>{" "}
                <span
                  className={
                    analysis.metaTags?.description?.content
                      ? "has-content"
                      : "no-content"
                  }
                >
                  {analysis.metaTags?.description?.content || "Not found"}
                </span>
                <div className="meta-tag-stats">
                  <span className="stat">
                    Length:{" "}
                    <strong>
                      {analysis.metaTags?.description?.length || 0}
                    </strong>{" "}
                    chars
                  </span>
                  <span className="stat">
                    Score:{" "}
                    <strong>
                      {analysis.metaTags?.description?.score || 0}/100
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Headings */}
        <div className="analysis-section">
          <h4>Headings Structure</h4>
          <div className="analysis-item">
            <div className="headings-summary">
              <div className="summary-item">
                <span className="summary-label">H1 Count:</span>
                <span
                  className={`summary-value ${
                    analysis.headings?.h1Count === 1 ? "good" : "bad"
                  }`}
                >
                  {analysis.headings?.h1Count || 0}
                  {analysis.headings?.h1Count === 1
                    ? " ✅"
                    : analysis.headings?.h1Count === 0
                    ? " ❌ (Missing)"
                    : analysis.headings?.h1Count > 1
                    ? " ⚠️ (Multiple)"
                    : ""}
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">Total Headings:</span>
                <span className="summary-value">
                  {analysis.headings?.total || 0}
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">Structure Score:</span>
                <span
                  className={`summary-value ${
                    (analysis.headings?.score || 0) >= 70
                      ? "good"
                      : (analysis.headings?.score || 0) >= 50
                      ? "warning"
                      : "bad"
                  }`}
                >
                  {analysis.headings?.score || 0}/100
                </span>
              </div>
            </div>

            {analysis.headings?.h1 && analysis.headings.h1.length > 0 && (
              <div className="headings-list">
                <strong>H1 Headings:</strong>
                {analysis.headings.h1.map((item, idx) => (
                  <div key={idx} className="heading-item">
                    <span className="heading-tag">H1</span>
                    <span className="heading-text">
                      {item.text?.substring(0, 100) || "No text"}...
                    </span>
                    <span className="heading-length">
                      ({item.length || 0} chars)
                    </span>
                  </div>
                ))}
              </div>
            )}

            {analysis.headings?.h2 && analysis.headings.h2.length > 0 && (
              <div className="headings-list">
                <strong>H2 Headings ({analysis.headings.h2.length}):</strong>
                {analysis.headings.h2.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="heading-item">
                    <span className="heading-tag">H2</span>
                    <span className="heading-text">
                      {item.text?.substring(0, 80) || "No text"}...
                    </span>
                    <span className="heading-length">
                      ({item.length || 0} chars)
                    </span>
                  </div>
                ))}
                {analysis.headings.h2.length > 3 && (
                  <div className="heading-item more-items">
                    ... and {analysis.headings.h2.length - 3} more H2 headings
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Images */}
        <div className="analysis-section">
          <h4>Images Analysis</h4>
          <div className="analysis-item">
            <div className="images-summary">
              <div className="summary-item">
                <span className="summary-label">Total Images:</span>
                <span className="summary-value">
                  {analysis.images?.total || 0}
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">With Alt Text:</span>
                <span
                  className={`summary-value ${
                    analysis.images?.withAlt === analysis.images?.total
                      ? "good"
                      : (analysis.images?.withAlt || 0) > 0
                      ? "warning"
                      : "bad"
                  }`}
                >
                  {analysis.images?.withAlt || 0}
                  {analysis.images?.withAlt === analysis.images?.total
                    ? " ✅"
                    : ""}
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">Without Alt Text:</span>
                <span
                  className={`summary-value ${
                    analysis.images?.withoutAlt ? "bad" : "good"
                  }`}
                >
                  {analysis.images?.withoutAlt || 0}
                  {analysis.images?.withoutAlt ? " ⚠️" : " ✅"}
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">Alt Text Ratio:</span>
                <span
                  className={`summary-value ${
                    (analysis.images?.altTextRatio || 0) >= 90
                      ? "good"
                      : (analysis.images?.altTextRatio || 0) >= 70
                      ? "warning"
                      : "bad"
                  }`}
                >
                  {analysis.images?.altTextRatio || 0}%
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">Image Score:</span>
                <span
                  className={`summary-value ${
                    (analysis.images?.score || 0) >= 80
                      ? "good"
                      : (analysis.images?.score || 0) >= 60
                      ? "warning"
                      : "bad"
                  }`}
                >
                  {analysis.images?.score || 0}/100
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="analysis-section">
          <h4>Content Analysis</h4>
          <div className="analysis-item">
            <div className="content-summary">
              <div className="summary-item">
                <span className="summary-label">Word Count:</span>
                <span
                  className={`summary-value ${
                    (analysis.content?.wordCount || 0) >= 500
                      ? "good"
                      : (analysis.content?.wordCount || 0) >= 300
                      ? "warning"
                      : "bad"
                  }`}
                >
                  {analysis.content?.wordCount || 0}
                  {(analysis.content?.wordCount || 0) >= 500
                    ? " ✅"
                    : (analysis.content?.wordCount || 0) >= 300
                    ? " ⚠️"
                    : " ❌"}
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">Reading Time:</span>
                <span className="summary-value">
                  {analysis.content?.readingTime || "N/A"}
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">Paragraphs:</span>
                <span className="summary-value">
                  {analysis.content?.paragraphs || 0}
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">Readability:</span>
                <span
                  className={`summary-value ${
                    (analysis.content?.readability || 0) >= 70
                      ? "good"
                      : (analysis.content?.readability || 0) >= 50
                      ? "warning"
                      : "bad"
                  }`}
                >
                  {analysis.content?.readability || 0}/100
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">Content Score:</span>
                <span
                  className={`summary-value ${
                    (analysis.content?.score || 0) >= 70
                      ? "good"
                      : (analysis.content?.score || 0) >= 50
                      ? "warning"
                      : "bad"
                  }`}
                >
                  {analysis.content?.score || 0}/100
                </span>
              </div>
            </div>

            {analysis.content?.topKeywords &&
              analysis.content.topKeywords.length > 0 && (
                <div className="keywords-section">
                  <strong>Top Keywords:</strong>
                  <div className="keywords-list">
                    {analysis.content.topKeywords
                      .slice(0, 5)
                      .map((keyword, idx) => (
                        <span key={idx} className="keyword-tag">
                          {keyword.word} ({keyword.count})
                        </span>
                      ))}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Technical SEO */}
        <div className="analysis-section">
          <h4>Technical SEO</h4>
          <div className="analysis-item">
            <div className="technical-grid">
              <div className="technical-item">
                <span className="technical-label">HTTPS:</span>
                <span
                  className={`technical-value ${
                    analysis.urlStructure?.isHTTPS ? "good" : "bad"
                  }`}
                >
                  {analysis.urlStructure?.isHTTPS ? "✅ Yes" : "❌ No"}
                </span>
              </div>

              <div className="technical-item">
                <span className="technical-label">Mobile Friendly:</span>
                <span
                  className={`technical-value ${
                    analysis.mobileFriendly?.hasViewport ? "good" : "bad"
                  }`}
                >
                  {analysis.mobileFriendly?.hasViewport ? "✅ Yes" : "❌ No"}
                </span>
              </div>

              <div className="technical-item">
                <span className="technical-label">Page Load Time:</span>
                <span
                  className={`technical-value ${
                    (parseInt(analysis.performance?.loadTime) || 5000) < 2000
                      ? "good"
                      : (parseInt(analysis.performance?.loadTime) || 5000) <
                        4000
                      ? "warning"
                      : "bad"
                  }`}
                >
                  {analysis.performance?.loadTime || "N/A"}
                </span>
              </div>

              <div className="technical-item">
                <span className="technical-label">Status Code:</span>
                <span
                  className={`technical-value ${
                    (analysis.performance?.statusCode || 0) === 200
                      ? "good"
                      : (analysis.performance?.statusCode || 0) < 400
                      ? "warning"
                      : "bad"
                  }`}
                >
                  {analysis.performance?.statusCode || "N/A"}
                </span>
              </div>

              <div className="technical-item">
                <span className="technical-label">Caching:</span>
                <span
                  className={`technical-value ${
                    analysis.performance?.hasCaching ? "good" : "bad"
                  }`}
                >
                  {analysis.performance?.hasCaching ? "✅ Yes" : "❌ No"}
                </span>
              </div>

              <div className="technical-item">
                <span className="technical-label">Compression:</span>
                <span
                  className={`technical-value ${
                    analysis.performance?.hasCompression ? "good" : "bad"
                  }`}
                >
                  {analysis.performance?.hasCompression ? "✅ Yes" : "❌ No"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="analysis-section">
          <h4>Links Analysis</h4>
          <div className="analysis-item">
            <div className="links-summary">
              <div className="summary-item">
                <span className="summary-label">Internal Links:</span>
                <span
                  className={`summary-value ${
                    (analysis.links?.internal || 0) >= 10
                      ? "good"
                      : (analysis.links?.internal || 0) >= 5
                      ? "warning"
                      : "bad"
                  }`}
                >
                  {analysis.links?.internal || 0}
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">External Links:</span>
                <span
                  className={`summary-value ${
                    (analysis.links?.external || 0) >= 3
                      ? "good"
                      : (analysis.links?.external || 0) >= 1
                      ? "warning"
                      : "bad"
                  }`}
                >
                  {analysis.links?.external || 0}
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">Nofollow Links:</span>
                <span className="summary-value">
                  {analysis.links?.nofollow || 0}
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">Link Score:</span>
                <span
                  className={`summary-value ${
                    (analysis.links?.score || 0) >= 70
                      ? "good"
                      : (analysis.links?.score || 0) >= 50
                      ? "warning"
                      : "bad"
                  }`}
                >
                  {analysis.links?.score || 0}/100
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {result.scores?.recommendations &&
          result.scores.recommendations.length > 0 && (
            <div className="analysis-section">
              <h4>Recommendations</h4>
              <div className="analysis-item recommendations">
                <ul>
                  {result.scores.recommendations.slice(0, 8).map((rec, idx) => (
                    <li key={idx}>
                      <span className="recommendation-icon">💡</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

        {/* Strengths & Weaknesses */}
        {result.scores && (
          <div className="analysis-section">
            <h4>SEO Summary</h4>
            <div className="analysis-item">
              {result.scores.strengths &&
                result.scores.strengths.length > 0 && (
                  <div className="strengths">
                    <h5 className="summary-title good">
                      <span className="icon">✅</span> Strengths
                    </h5>
                    <div className="tags">
                      {result.scores.strengths.map((strength, idx) => (
                        <span key={idx} className="tag good">
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {result.scores.weaknesses &&
                result.scores.weaknesses.length > 0 && (
                  <div className="weaknesses">
                    <h5 className="summary-title bad">
                      <span className="icon">⚠️</span> Areas to Improve
                    </h5>
                    <div className="tags">
                      {result.scores.weaknesses.map((weakness, idx) => (
                        <span key={idx} className="tag bad">
                          {weakness}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Analysis Info */}
        <div className="analysis-section info-section">
          <div className="analysis-item">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">URL Analyzed:</span>
                <span className="info-value">{result.url || url}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Analysis Time:</span>
                <span className="info-value">
                  {result.timestamp
                    ? new Date(result.timestamp).toLocaleString()
                    : "Just now"}
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">Cached:</span>
                <span className="info-value">
                  {result.cached ? "Yes ⚡" : "No"}
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">Success:</span>
                <span className="info-value">
                  {result.success !== false ? "✅ Yes" : "❌ No"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🔍 SEO Analyzer Pro</h1>
        <p>Woorank-like SEO analysis tool | Complete Website Audit</p>
        <button
          onClick={testBackendConnection}
          className="test-btn"
          title="Test backend connection"
        >
          🔌 Test Backend
        </button>
      </header>

      <main className="main">
        <div className="analyzer-card">
          <div className="input-section">
            <div className="input-group">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter website URL (e.g., https://example.com)"
                className="url-input"
                onKeyPress={(e) => e.key === "Enter" && analyzeWebsite()}
              />
              <button
                onClick={analyzeWebsite}
                disabled={loading}
                className="analyze-btn"
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span className="icon">🚀</span>
                    Analyze Website
                  </>
                )}
              </button>
            </div>

            <div className="example-urls">
              <small>Try: </small>
              {["example.com", "httpbin.org/html", "github.com"].map(
                (example) => (
                  <button
                    key={example}
                    onClick={() => setUrl(`https://${example}`)}
                    className="example-btn"
                  >
                    {example}
                  </button>
                )
              )}
            </div>
          </div>

          {error && (
            <div className="error">
              <div className="error-header">
                <span className="error-icon">❌</span>
                <strong>Error</strong>
              </div>
              <div className="error-body">
                {error.split("\n").map((line, idx) => (
                  <p key={idx} style={{ margin: "5px 0" }}>
                    {line}
                  </p>
                ))}
              </div>
              <div className="error-footer">
                <button onClick={() => setError("")} className="dismiss-btn">
                  Dismiss
                </button>
                <button onClick={testBackendConnection} className="action-btn">
                  Test Backend
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <h3>Analyzing Website...</h3>
              <p>This may take 10-30 seconds depending on the website</p>
              <div className="loading-steps">
                <div className="step active">Fetching website...</div>
                <div className="step">Analyzing HTML...</div>
                <div className="step">Checking SEO elements...</div>
                <div className="step">Calculating scores...</div>
                <div className="step">Generating report...</div>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="results">
              <div className="results-header">
                <h2>SEO Analysis Report</h2>
                <button onClick={() => window.print()} className="print-btn">
                  🖨️ Print Report
                </button>
              </div>

              {renderScoreCard()}
              {renderCategoryScores()}
              {renderDetailedAnalysis()}

              {/* Raw Data Toggle (for debugging) */}
              <details className="debug-section">
                <summary>
                  <span className="debug-icon">🐛</span>
                  Debug Information (Raw Data)
                </summary>
                <div className="debug-content">
                  <div className="debug-tabs">
                    <button className="debug-tab active">Response</button>
                    <button className="debug-tab">Request</button>
                    <button className="debug-tab">Console</button>
                  </div>
                  <pre className="debug-pre">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>🚀 SEO Analyzer Pro</h4>
            <p>Complete website SEO analysis tool</p>
            <p>Built with Node.js, React, and MongoDB</p>
          </div>

          <div className="footer-section">
            <h4>⚡ Features</h4>
            <ul>
              <li>Full SEO Audit</li>
              <li>Technical Analysis</li>
              <li>Performance Check</li>
              <li>Mobile Optimization</li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>ℹ️ Info</h4>
            <p>Results cached for 1 hour</p>
            <p>Analysis time: 5-30 seconds</p>
            <p>Version 1.0.0</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2024 SEO Analyzer Pro • Made with ❤️ for SEO Optimization</p>
          <p className="disclaimer">
            ⚠️ This tool provides SEO recommendations. Always consult with SEO
            experts for critical decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
