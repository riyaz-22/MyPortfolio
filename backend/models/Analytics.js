const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
     type: { type: String, required: true }, // e.g., 'visit','download','resume_view','message'
     ip: String,
     sessionId: String,
     meta: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Analytics', AnalyticsSchema);
