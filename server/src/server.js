const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`
    🚀 SEO Analyzer Backend Started!
    ✅ Local:   http://localhost:${PORT}
    📊 API Docs: http://localhost:${PORT}
    🔍 Test:     http://localhost:${PORT}/health
    
    🔗 MongoDB: ${process.env.MONGODB_URI ? 'Connected' : 'Using local'}
    📍 Environment: ${process.env.NODE_ENV || 'development'}
    `);
});