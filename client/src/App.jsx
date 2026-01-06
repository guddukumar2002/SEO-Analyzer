import { useState } from 'react'
import './App.css'

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const analyzeSite = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/analyze?url=${encodeURIComponent(url)}`
      )
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError('Analysis failed. Make sure backend is running on port 5000.')
    }
    
    setLoading(false)
  }

  // Inline styles
  const styles = {
    app: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    },
    title: {
      color: 'white',
      marginBottom: '0.5rem'
    },
    subtitle: {
      color: '#e0e0e0',
      marginBottom: '2rem'
    },
    inputSection: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '2rem'
    },
    urlInput: {
      flex: '1',
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      border: '2px solid #ddd',
      borderRadius: '8px',
      outline: 'none'
    },
    analyzeBtn: {
      padding: '0.75rem 2rem',
      background: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer'
    },
    disabledBtn: {
      background: '#ccc',
      cursor: 'not-allowed'
    },
    error: {
      background: '#ffebee',
      color: '#c62828',
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1rem',
      borderLeft: '4px solid #c62828'
    },
    result: {
      background: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: '12px',
      padding: '2rem',
      marginTop: '2rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      color: 'black'
    },
    score: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    },
    scoreSpan: {
      color: '#007bff',
      fontSize: '2rem'
    },
    scoreBar: {
      height: '20px',
      background: '#f0f0f0',
      borderRadius: '10px',
      overflow: 'hidden',
      marginTop: '1rem'
    },
    scoreFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #4caf50, #8bc34a)',
      transition: 'width 0.5s ease'
    },
    instructions: {
      background: 'rgba(255, 255, 255, 0.1)',
      padding: '1.5rem',
      borderRadius: '8px',
      marginTop: '2rem',
      color: 'white'
    },
    note: {
      background: '#fff3cd',
      border: '1px solid #ffc107',
      color: '#856404',
      padding: '0.75rem',
      borderRadius: '6px',
      marginTop: '1rem'
    }
  }

  return (
    <div style={styles.app}>
      <h1 style={styles.title}>🔍 SEO Analyzer Tool</h1>
      <p style={styles.subtitle}>WooRank Clone - Enter website URL to analyze</p>
      
      <div style={styles.inputSection}>
        <input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={styles.urlInput}
        />
        <button 
          onClick={analyzeSite} 
          disabled={loading || !url}
          style={loading || !url ? {...styles.analyzeBtn, ...styles.disabledBtn} : styles.analyzeBtn}
        >
          {loading ? 'Analyzing...' : 'Analyze SEO'}
        </button>
      </div>
      
      {error && <div style={styles.error}>{error}</div>}
      
      {result && (
        <div style={styles.result}>
          <h2>Results for: {result.url}</h2>
          <div style={{margin: '1.5rem 0'}}>
            <div style={styles.score}>SEO Score: <span style={styles.scoreSpan}>{result.score}/100</span></div>
            <div style={styles.scoreBar}>
              <div 
                style={{...styles.scoreFill, width: `${result.score}%`}}
              ></div>
            </div>
          </div>
          <p>{result.message}</p>
          
          <div style={{background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginTop: '1.5rem'}}>
            <p>✅ Backend running: http://localhost:5000</p>
            <p>📊 Test: <a href="http://localhost:5000/api/health" target="_blank">Health Check</a></p>
          </div>
        </div>
      )}
      
      {!result && (
        <div style={styles.instructions}>
          <h3>How to use:</h3>
          <ol>
            <li>Enter any website URL (e.g., https://google.com)</li>
            <li>Click "Analyze SEO" button</li>
            <li>Wait for results</li>
          </ol>
          <div style={styles.note}>
            <strong>Note:</strong> Make sure backend server is running
          </div>
        </div>
      )}
    </div>
  )
}

export default App