const ContactSubmission = require('../models/ContactSubmission');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/sendResponse');

// ── Public: submit contact form ──────────────────────────────────
exports.submit = asyncHandler(async (req, res) => {
     const { name, email, subject, message } = req.body;
     const submission = await ContactSubmission.create({ name, email, subject, message });
     sendResponse(res, 201, submission, 'Message sent successfully');
});

// ── Admin: list all submissions ──────────────────────────────────
exports.getAll = asyncHandler(async (req, res) => {
     const { page = 1, limit = 20, isRead, search } = req.query;
     const filter = {};

     if (isRead !== undefined) filter.isRead = isRead === 'true';
     if (search) {
          filter.$or = [
               { name: { $regex: search, $options: 'i' } },
               { email: { $regex: search, $options: 'i' } },
               { subject: { $regex: search, $options: 'i' } },
               { message: { $regex: search, $options: 'i' } },
          ];
     }

     const total = await ContactSubmission.countDocuments(filter);
     const submissions = await ContactSubmission.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(Number(limit));

     sendResponse(res, 200, {
          submissions,
          pagination: {
               total,
               page: Number(page),
               pages: Math.ceil(total / limit),
          },
     }, 'Submissions fetched');
});

// ── Admin: get single ────────────────────────────────────────────
exports.getOne = asyncHandler(async (req, res) => {
     const sub = await ContactSubmission.findById(req.params.id);
     if (!sub) throw new ApiError(404, 'Submission not found');
     sendResponse(res, 200, sub, 'Submission fetched');
});

// ── Admin: mark read / unread ────────────────────────────────────
exports.toggleRead = asyncHandler(async (req, res) => {
     const sub = await ContactSubmission.findById(req.params.id);
     if (!sub) throw new ApiError(404, 'Submission not found');
     sub.isRead = !sub.isRead;
     await sub.save();
     sendResponse(res, 200, sub, `Marked as ${sub.isRead ? 'read' : 'unread'}`);
});

// ── Admin: toggle star ───────────────────────────────────────────
exports.toggleStar = asyncHandler(async (req, res) => {
     const sub = await ContactSubmission.findById(req.params.id);
     if (!sub) throw new ApiError(404, 'Submission not found');
     sub.isStarred = !sub.isStarred;
     await sub.save();
     sendResponse(res, 200, sub, `${sub.isStarred ? 'Starred' : 'Unstarred'}`);
});

// ── Admin: delete ────────────────────────────────────────────────
exports.remove = asyncHandler(async (req, res) => {
     const sub = await ContactSubmission.findByIdAndDelete(req.params.id);
     if (!sub) throw new ApiError(404, 'Submission not found');
     sendResponse(res, 200, null, 'Submission deleted');
});

// ── Admin: unread count ──────────────────────────────────────────
exports.unreadCount = asyncHandler(async (_req, res) => {
     const count = await ContactSubmission.countDocuments({ isRead: false });
     sendResponse(res, 200, { count }, 'Unread count');
});
