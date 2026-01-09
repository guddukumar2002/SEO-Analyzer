const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  url: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  domain: {
    type: String,
    required: true,
    index: true
  },
  analysis: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  scores: {
    overall: Number,
    grade: String,
    categoryScores: mongoose.Schema.Types.Mixed,
    strengths: [String],
    weaknesses: [String]
  },
  recommendations: [{
    category: String,
    title: String,
    description: String,
    priority: String,
    fix: String,
    impact: String
  }],
  seoHealth: {
    status: String,
    issues: Number,
    warnings: Number,
    passed: Boolean
  },
  performance: {
    fetchTime: Number,
    status: Number,
    pageSize: Number,
    cacheStatus: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7 * 24 * 60 * 60 // Auto delete after 7 days
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
analysisSchema.index({ timestamp: -1 });
analysisSchema.index({ 'scores.overall': -1 });
analysisSchema.index({ domain: 1, timestamp: -1 });

// Virtual for SEO grade color
analysisSchema.virtual('gradeColor').get(function() {
  const grade = this.scores?.grade;
  const colors = {
    'A+': 'text-green-600',
    'A': 'text-green-600',
    'A-': 'text-green-500',
    'B+': 'text-blue-600',
    'B': 'text-blue-500',
    'B-': 'text-blue-400',
    'C+': 'text-yellow-600',
    'C': 'text-yellow-500',
    'C-': 'text-yellow-400',
    'D+': 'text-orange-600',
    'D': 'text-orange-500',
    'F': 'text-red-600'
  };
  return colors[grade] || 'text-gray-600';
});

// Virtual for SEO health badge
analysisSchema.virtual('healthBadge').get(function() {
  const status = this.seoHealth?.status;
  const badges = {
    'excellent': 'badge-success',
    'good': 'badge-info',
    'fair': 'badge-warning',
    'needs-work': 'badge-error',
    'unknown': 'badge-neutral'
  };
  return badges[status] || 'badge-neutral';
});

// Static method to get stats
analysisSchema.statics.getStats = async function() {
  const total = await this.countDocuments();
  const averageScore = await this.aggregate([
    { $group: { _id: null, avgScore: { $avg: '$scores.overall' } } }
  ]);
  
  const gradeDistribution = await this.aggregate([
    { $group: { _id: '$scores.grade', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  const topDomains = await this.aggregate([
    { $group: { _id: '$domain', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  return {
    total,
    averageScore: averageScore[0]?.avgScore || 0,
    gradeDistribution,
    topDomains,
    updatedAt: new Date()
  };
};

// Static method to get recent analyses
analysisSchema.statics.getRecent = async function(limit = 10) {
  return this.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('reportId url domain scores.overall scores.grade timestamp seoHealth');
};

const Analysis = mongoose.model('Analysis', analysisSchema);

module.exports = Analysis;