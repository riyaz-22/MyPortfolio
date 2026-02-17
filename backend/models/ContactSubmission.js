const mongoose = require('mongoose');

const ContactSubmissionSchema = new mongoose.Schema(
     {
          name: {
               type: String,
               required: [true, 'Name is required'],
               trim: true,
          },
          email: {
               type: String,
               required: [true, 'Email is required'],
               trim: true,
               lowercase: true,
          },
          subject: {
               type: String,
               trim: true,
               default: '',
          },
          message: {
               type: String,
               required: [true, 'Message is required'],
               trim: true,
          },
          isRead: {
               type: Boolean,
               default: false,
          },
          isStarred: {
               type: Boolean,
               default: false,
          },
     },
     { timestamps: true }
);

ContactSubmissionSchema.index({ isRead: 1, createdAt: -1 });

module.exports = mongoose.model('ContactSubmission', ContactSubmissionSchema);
