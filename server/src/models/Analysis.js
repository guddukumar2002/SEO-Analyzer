const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        index: true
    },
    analysis: {
        type: Object,
        required: true
    },
    scores: {
        overall: Number,
        categoryScores: Object
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Auto-delete analyses older than 30 days
analysisSchema.index({ createdAt: 1 }, { 
    expireAfterSeconds: 30 * 24 * 60 * 60 
});

module.exports = mongoose.model('Analysis', analysisSchema);