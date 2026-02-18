const mongoose = require('mongoose');
const { SKILL_CATEGORIES, PROFICIENCY_LEVELS, PROJECT_TYPES } = require('../config/constants');

// ─── Sub-Schemas ────────────────────────────────────────────────

const SocialLinkSchema = new mongoose.Schema(
     {
          platform: {
               type: String,
               required: [true, 'Platform name is required'],
               trim: true,
          },
          url: {
               type: String,
               required: [true, 'URL is required'],
               trim: true,
          },
          icon: {
               type: String,
               trim: true,
          },
     },
     { _id: true }
);

const SkillSchema = new mongoose.Schema(
     {
          category: {
               type: String,
               required: [true, 'Skill category is required'],
               enum: {
                    values: SKILL_CATEGORIES,
                    message: '{VALUE} is not a valid category',
               },
               trim: true,
          },
          name: {
               type: String,
               required: [true, 'Skill name is required'],
               trim: true,
          },
          proficiency: {
               type: String,
               required: [true, 'Proficiency level is required'],
               enum: {
                    values: PROFICIENCY_LEVELS,
                    message: '{VALUE} is not a valid proficiency level',
               },
          },
          icon: {
               type: String,
               trim: true,
          },
     },
     { _id: true }
);

const ProjectSchema = new mongoose.Schema(
     {
          title: {
               type: String,
               required: [true, 'Project title is required'],
               trim: true,
          },
          projectType: {
               type: String,
               required: [true, 'Project type is required'],
               enum: {
                    values: PROJECT_TYPES,
                    message: '{VALUE} is not a valid project type',
               },
               default: 'Web',
          },
          description: {
               type: String,
               required: [true, 'Project description is required'],
               trim: true,
          },
          techStack: {
               type: [String],
               required: [true, 'Tech stack is required'],
               validate: {
                    validator: (v) => v.length > 0,
                    message: 'At least one technology is required',
               },
          },
          githubUrl: {
               type: String,
               trim: true,
          },
          liveUrl: {
               type: String,
               trim: true,
          },
          images: {
               type: [String],
               default: [],
          },
          featured: {
               type: Boolean,
               default: false,
          },
          order: {
               type: Number,
               default: 0,
          },
     },
     { _id: true, timestamps: true }
);

const ExperienceSchema = new mongoose.Schema(
     {
          company: {
               type: String,
               required: [true, 'Company name is required'],
               trim: true,
          },
          role: {
               type: String,
               required: [true, 'Role is required'],
               trim: true,
          },
          startDate: {
               type: Date,
               required: [true, 'Start date is required'],
          },
          endDate: {
               type: Date,
               default: null,
          },
          current: {
               type: Boolean,
               default: false,
          },
          description: {
               type: String,
               trim: true,
          },
          responsibilities: {
               type: [String],
               default: [],
          },
          location: {
               type: String,
               trim: true,
          },
          order: {
               type: Number,
               default: 0,
          },
     },
     { _id: true }
);

const EducationSchema = new mongoose.Schema(
     {
          institution: {
               type: String,
               required: [true, 'Institution name is required'],
               trim: true,
          },
          degree: {
               type: String,
               required: [true, 'Degree is required'],
               trim: true,
          },
          field: {
               type: String,
               trim: true,
          },
          startYear: {
               type: Number,
               required: [true, 'Start year is required'],
          },
          endYear: {
               type: Number,
          },
          grade: {
               type: String,
               trim: true,
          },
          description: {
               type: String,
               trim: true,
          },
          order: {
               type: Number,
               default: 0,
          },
     },
     { _id: true }
);

// ─── Main Portfolio Schema ──────────────────────────────────────

const PortfolioSchema = new mongoose.Schema(
     {
          personalDetails: {
               firstName: {
                    type: String,
                    required: [true, 'First name is required'],
                    trim: true,
               },
               lastName: {
                    type: String,
                    required: [true, 'Last name is required'],
                    trim: true,
               },
               title: {
                    type: String,
                    required: [true, 'Professional title is required'],
                    trim: true,
               },
               bio: {
                    type: String,
                    trim: true,
               },
               email: {
                    type: String,
                    required: [true, 'Email is required'],
                    trim: true,
                    lowercase: true,
                    match: [
                         /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                         'Please enter a valid email address',
                    ],
               },
               phone: {
                    type: String,
                    trim: true,
               },
               location: {
                    type: String,
                    trim: true,
               },
               avatar: {
                    type: String,
                    trim: true,
               },
               socialLinks: {
                    type: [SocialLinkSchema],
                    default: [],
               },
          },

          skills: {
               type: [SkillSchema],
               default: [],
          },

          projects: {
               type: [ProjectSchema],
               default: [],
          },

          experience: {
               type: [ExperienceSchema],
               default: [],
          },

          education: {
               type: [EducationSchema],
               default: [],
          },

          resume: {
               fileUrl: {
                    type: String,
                    trim: true,
               },
               lastUpdated: {
                    type: Date,
                    default: Date.now,
               },
          },

          isActive: {
               type: Boolean,
               default: true,
          },
     },
     {
          timestamps: true,
          toJSON: { virtuals: true },
          toObject: { virtuals: true },
     }
);

// ─── Virtuals ───────────────────────────────────────────────────

PortfolioSchema.virtual('personalDetails.fullName').get(function () {
     if (this.personalDetails) {
          return `${this.personalDetails.firstName} ${this.personalDetails.lastName}`;
     }
     return '';
});

// ─── Indexes ────────────────────────────────────────────────────

PortfolioSchema.index({ isActive: 1 });
PortfolioSchema.index({ 'projects.featured': 1 });

module.exports = mongoose.model('Portfolio', PortfolioSchema);
