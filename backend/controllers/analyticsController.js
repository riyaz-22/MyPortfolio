const Analytics = require('../models/Analytics');
const Portfolio = require('../models/Portfolio');
const Contact = require('../models/ContactSubmission');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/analytics/summary
exports.getSummary = asyncHandler(async (req, res) => {
    // Basic aggregates from existing data + analytics events
    const portfolio = await Portfolio.findOne({ isActive: true }).lean();
    const totalProjects = (portfolio?.projects || []).length;
    const featuredProjects = (portfolio?.projects || []).filter(p => p.featured).length;
    const publishedProjects = totalProjects; // projects array assumed published

    const skillsCount = (portfolio?.skills || []).length;
    const experienceCount = (portfolio?.experience || []).length;
    const educationCount = (portfolio?.education || []).length;
    const servicesCount = await require('../models/Service').countDocuments();

    const resumeDownloads = await Analytics.countDocuments({ type: 'download', 'meta.fileType': 'resume' });
    const resumeViews = await Analytics.countDocuments({ type: 'resume_view' });

    const totalMessages = await Contact.countDocuments();
    const unreadMessages = await Contact.countDocuments({ isRead: false });

    const lastPortfolioUpdate = portfolio?.updatedAt || null;

    // Visitors — simple counts from analytics collection
    const totalVisits = await Analytics.countDocuments({ type: 'visit' });
    const uniqueVisitors = await Analytics.distinct('meta.sessionId', { type: 'visit' }).then(a => a.length).catch(() => 0);

    res.json({
        success: true,
        data: {
            totalProjects,
            featuredProjects,
            publishedProjects,
            skillsCount,
            experienceCount,
            educationCount,
            servicesCount,
            resumeDownloads,
            resumeViews,
            totalMessages,
            unreadMessages,
            lastPortfolioUpdate,
            totalVisits,
            uniqueVisitors,
        }
    });
});

// GET /api/analytics/visits?days=30
exports.getVisits = asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const results = await Analytics.aggregate([
        { $match: { type: 'visit', createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);
    res.json({ success: true, data: results });
});
