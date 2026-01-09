import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const API_BASE = "https://seo-analyzer-backend-19sjvoes0-guddu-kumars-projects-9014a0ff.vercel.app";

  const analyzeWebsite = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setActiveTab('overview');

    try {
      const response = await axios.post(`${API_BASE}/api/analyze`, { url });
      
      if (response.data.success) {
        setResult(response.data);
        fetchHistory();
      } else {
        setError(response.data.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/history`);
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch history');
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getGradeColor = (grade) => {
    if (!grade) return '#6b7280';
    if (grade.includes('A+')) return '#10b981';
    if (grade.includes('A')) return '#22c55e';
    if (grade.includes('B')) return '#3b82f6';
    if (grade.includes('C')) return '#f59e0b';
    if (grade.includes('D')) return '#f97316';
    return '#ef4444';
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#22c55e';
    if (score >= 70) return '#3b82f6';
    if (score >= 60) return '#f59e0b';
    if (score >= 50) return '#f97316';
    return '#ef4444';
  };

  const getCategoryName = (category) => {
    const names = {
      meta: 'Meta Tags',
      headings: 'Headings',
      images: 'Images',
      content: 'Content',
      links: 'Links',
      technical: 'Technical SEO',
      social: 'Social Media',
      mobile: 'Mobile',
      security: 'Security'
    };
    return names[category] || category;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      meta: '🏷️',
      headings: '📑',
      images: '🖼️',
      content: '📝',
      links: '🔗',
      technical: '⚙️',
      social: '📱',
      mobile: '📱',
      security: '🔒'
    };
    return icons[category] || '📊';
  };

  const getIssueLevel = (score) => {
    if (score >= 80) return { level: 'success', text: 'Good' };
    if (score >= 60) return { level: 'warning', text: 'Needs Improvement' };
    return { level: 'error', text: 'Critical' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg">
                  <span className="text-xl">🔍</span>
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900">SEO Analyzer Pro</h1>
                  <p className="text-xs text-gray-600">Professional SEO Analysis Tool</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a href="https://woorank.com" target="_blank" rel="noopener noreferrer" 
                className="text-sm text-gray-600 hover:text-gray-900">
                Compare with Woorank
              </a>
              <div className="text-sm text-gray-500">
                Backend: {API_BASE.replace('http://', '')}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Professional SEO Analysis Like Woorank
            </h1>
            <p className="text-blue-100 mb-6">
              Analyze any website for SEO performance. Get detailed insights on meta tags, 
              content quality, technical SEO, mobile optimization, and security.
            </p>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyze Your Website</h2>
            <p className="text-gray-600">Enter a website URL to get comprehensive SEO analysis</p>
          </div>

          <form onSubmit={analyzeWebsite} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-lg"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </span>
                ) : (
                  'Analyze SEO'
                )}
              </button>
            </div>

            {/* Quick Examples */}
            <div>
              <p className="text-sm text-gray-600 mb-3">Try these popular websites:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { url: 'https://google.com', label: 'Google' },
                  { url: 'https://github.com', label: 'GitHub' },
                  { url: 'https://stackoverflow.com', label: 'StackOverflow' },
                  { url: 'https://amazon.com', label: 'Amazon' },
                  { url: 'https://example.com', label: 'Example' }
                ].map((example) => (
                  <button
                    key={example.url}
                    type="button"
                    onClick={() => {
                      setUrl(example.url);
                      setError('');
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors"
                  >
                    {example.label}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-red-600">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-red-800 font-medium">{error}</p>
                  <p className="text-red-600 text-sm mt-1">Make sure the backend server is running</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            {/* Result Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">SEO Analysis Report</h2>
                  <div className="mt-2 flex items-center gap-4 flex-wrap">
                    <p className="text-gray-600 break-all">{result.url}</p>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {result.domain}
                    </span>
                    {result.cached && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Cached Result
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div 
                    className="text-5xl md:text-6xl font-bold mb-2"
                    style={{ color: getGradeColor(result.scores.grade) }}
                  >
                    {result.scores.overall}
                  </div>
                  <div 
                    className="text-xl font-bold mb-3 px-6 py-2 rounded-full"
                    style={{ 
                      backgroundColor: `${getGradeColor(result.scores.grade)}20`,
                      color: getGradeColor(result.scores.grade)
                    }}
                  >
                    {result.scores.grade}
                  </div>
                  <div className="text-sm text-gray-600">
                    Overall SEO Score
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b">
              <div className="flex overflow-x-auto">
                {['overview', 'details', 'recommendations', 'technical'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-4 font-medium text-sm whitespace-nowrap ${activeTab === tab 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Score Cards */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">SEO Score Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {result.scores.categoryScores && Object.entries(result.scores.categoryScores).map(([category, score]) => {
                        const issue = getIssueLevel(score);
                        return (
                          <div key={category} className="bg-gray-50 p-4 rounded-xl hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{getCategoryIcon(category)}</span>
                                <span className="font-medium text-gray-900">{getCategoryName(category)}</span>
                              </div>
                              <div 
                                className="text-2xl font-bold"
                                style={{ color: getScoreColor(score) }}
                              >
                                {Math.round(score)}
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                              <div
                                className="h-2 rounded-full"
                                style={{ 
                                  width: `${score}%`,
                                  backgroundColor: getScoreColor(score)
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                issue.level === 'success' ? 'bg-green-100 text-green-800' :
                                issue.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {issue.text}
                              </span>
                              <span className="text-xs text-gray-500">
                                {Math.round(score)}/100
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        Strengths
                      </h3>
                      <div className="space-y-3">
                        {result.strengths?.map((strength, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                            <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-800">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        Areas for Improvement
                      </h3>
                      <div className="space-y-3">
                        {result.weaknesses?.map((weakness, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-800">{weakness}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && result.analysis && (
                <div className="space-y-8">
                  {/* Meta Information */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-xl">🏷️</span>
                      Meta Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Title Tag</h4>
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-gray-800">{result.analysis.meta?.title || 'Not found'}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Length: {result.analysis.meta?.title?.length || 0} characters
                            {result.analysis.meta?.title?.length >= 30 && result.analysis.meta?.title?.length <= 60 
                              ? ' ✅ Optimal' 
                              : ' ⚠️ Should be 30-60 characters'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Meta Description</h4>
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-gray-800">{result.analysis.meta?.description || 'Not found'}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Length: {result.analysis.meta?.description?.length || 0} characters
                            {result.analysis.meta?.description?.length >= 120 && result.analysis.meta?.description?.length <= 160 
                              ? ' ✅ Optimal' 
                              : ' ⚠️ Should be 120-160 characters'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Analysis */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-xl">📝</span>
                      Content Analysis
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">{result.analysis.content?.wordCount || 0}</div>
                        <div className="text-gray-700">Word Count</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {result.analysis.content?.wordCount >= 300 ? '✅ Good' : '⚠️ Add more content'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">{result.analysis.content?.paragraphs || 0}</div>
                        <div className="text-gray-700">Paragraphs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">{result.analysis.headings?.h1 || 0}</div>
                        <div className="text-gray-700">H1 Headings</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {result.analysis.headings?.h1 === 1 ? '✅ Perfect' : '⚠️ Should have exactly 1'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Images Analysis */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-xl">🖼️</span>
                      Images Analysis
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">{result.analysis.images?.total || 0}</div>
                        <div className="text-gray-700">Total Images</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">{result.analysis.images?.withAlt || 0}</div>
                        <div className="text-gray-700">With Alt Text</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600 mb-2">{result.analysis.images?.withoutAlt || 0}</div>
                        <div className="text-gray-700">Without Alt Text</div>
                        {result.analysis.images?.withoutAlt > 0 && (
                          <div className="text-sm text-red-500 mt-1">⚠️ Needs attention</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations Tab */}
              {activeTab === 'recommendations' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">SEO Recommendations</h3>
                  <div className="space-y-4">
                    {result.recommendations?.map((rec, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                            {index + 1}
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-800">{rec}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              Priority: {index < 2 ? 'High' : index < 4 ? 'Medium' : 'Low'}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                              Impact: {index < 2 ? 'High' : 'Medium'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Tab */}
              {activeTab === 'technical' && result.analysis && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Technical Details</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Technical SEO */}
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <span>⚙️</span>
                        Technical SEO
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">HTTPS</span>
                          <span className={`font-medium ${result.analysis.technical?.isHTTPS ? 'text-green-600' : 'text-red-600'}`}>
                            {result.analysis.technical?.isHTTPS ? '✅ Enabled' : '❌ Not Enabled'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Structured Data</span>
                          <span className={`font-medium ${result.analysis.technical?.hasSchema ? 'text-green-600' : 'text-yellow-600'}`}>
                            {result.analysis.technical?.hasSchema ? '✅ Found' : '⚠️ Not Found'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Canonical URL</span>
                          <span className={`font-medium ${result.analysis.technical?.canonical ? 'text-green-600' : 'text-yellow-600'}`}>
                            {result.analysis.technical?.canonical ? '✅ Set' : '⚠️ Not Set'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Viewport Meta Tag</span>
                          <span className={`font-medium ${result.analysis.technical?.viewport ? 'text-green-600' : 'text-red-600'}`}>
                            {result.analysis.technical?.viewport ? '✅ Present' : '❌ Missing'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Links Analysis */}
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <span>🔗</span>
                        Links Analysis
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Links</span>
                          <span className="font-medium text-gray-900">{result.analysis.links?.total || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Internal Links</span>
                          <span className="font-medium text-green-600">{result.analysis.links?.internal || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">External Links</span>
                          <span className="font-medium text-blue-600">{result.analysis.links?.external || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Social Media */}
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <span>📱</span>
                        Social Media
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Open Graph Tags</span>
                          <span className={`font-medium ${result.analysis.social?.hasOgTags ? 'text-green-600' : 'text-yellow-600'}`}>
                            {result.analysis.social?.hasOgTags ? '✅ Found' : '⚠️ Not Found'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Twitter Cards</span>
                          <span className={`font-medium ${result.analysis.social?.hasTwitter ? 'text-green-600' : 'text-yellow-600'}`}>
                            {result.analysis.social?.hasTwitter ? '✅ Found' : '⚠️ Not Found'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Performance */}
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <span>🚀</span>
                        Performance
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Analysis Time</span>
                          <span className="font-medium text-gray-900">
                            {result.performance?.fetchTime ? `${result.performance.fetchTime}ms` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Page Status</span>
                          <span className="font-medium text-green-600">
                            {result.performance?.status || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Report Generated</span>
                          <span className="font-medium text-gray-900">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Analyses</h2>
            <button 
              onClick={fetchHistory}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
            >
              Refresh History
            </button>
          </div>
          
          {history.length > 0 ? (
            <div className="overflow-hidden rounded-lg border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Website
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Analyzed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.domain}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{item.url}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div 
                          className="text-xl font-bold"
                          style={{ color: getGradeColor(item.grade) }}
                        >
                          {item.score}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span 
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={{ 
                            backgroundColor: `${getGradeColor(item.grade)}20`,
                            color: getGradeColor(item.grade)
                          }}
                        >
                          {item.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setUrl(item.url);
                            if (result) {
                              setResult(null);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                        >
                          Re-analyze
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="text-gray-400 text-4xl mb-4">📊</div>
              <p className="text-gray-500">No analysis history yet</p>
              <p className="text-gray-400 text-sm mt-2">Analyze some websites to see history here</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">SEO Analyzer Pro</h3>
              <p className="text-gray-600 text-sm">
                Professional SEO analysis tool built with Node.js, React, and MongoDB.
                Provides accurate, Woorank-like analysis for any website.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✅ Real-time SEO analysis</li>
                <li>✅ 10+ SEO categories checked</li>
                <li>✅ Professional scoring algorithm</li>
                <li>✅ Detailed recommendations</li>
                <li>✅ History tracking</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">API Endpoints</h3>
              <div className="space-y-2 text-sm">
                <code className="bg-gray-100 px-2 py-1 rounded text-gray-800">POST /api/analyze</code>
                <code className="bg-gray-100 px-2 py-1 rounded text-gray-800">GET /api/history</code>
                <code className="bg-gray-100 px-2 py-1 rounded text-gray-800">GET /health</code>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>SEO Analyzer Pro v2.0 • Built for professional SEO analysis • Not affiliated with Woorank</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;