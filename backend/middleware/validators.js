const { body, param } = require('express-validator');
const { SECTIONS, SKILL_CATEGORIES, PROFICIENCY_LEVELS } = require('../config/constants');
const ApiError = require('../utils/ApiError');

/**
 * Middleware that checks express-validator results and throws ApiError
 */
const validate = (req, _res, next) => {
     const { validationResult } = require('express-validator');
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
          const messages = errors.array().map((e) => e.msg);
          throw new ApiError(400, messages.join('. '));
     }
     next();
};

// ─── Validation Chains ──────────────────────────────────────────

const createPortfolioRules = [
     body('personalDetails.firstName')
          .notEmpty()
          .withMessage('First name is required')
          .trim(),
     body('personalDetails.lastName')
          .notEmpty()
          .withMessage('Last name is required')
          .trim(),
     body('personalDetails.title')
          .notEmpty()
          .withMessage('Professional title is required')
          .trim(),
     body('personalDetails.email')
          .notEmpty()
          .withMessage('Email is required')
          .isEmail()
          .withMessage('Invalid email format')
          .normalizeEmail(),
];

const sectionParamRule = [
     param('section')
          .isIn(SECTIONS)
          .withMessage(`Section must be one of: ${SECTIONS.join(', ')}`),
];

const itemIdParamRule = [
     param('itemId').isMongoId().withMessage('Invalid item ID format'),
];

const addSkillRules = [
     body('category')
          .isIn(SKILL_CATEGORIES)
          .withMessage(`Category must be one of: ${SKILL_CATEGORIES.join(', ')}`),
     body('name').notEmpty().withMessage('Skill name is required').trim(),
     body('proficiency')
          .isIn(PROFICIENCY_LEVELS)
          .withMessage(
               `Proficiency must be one of: ${PROFICIENCY_LEVELS.join(', ')}`
          ),
];

const addProjectRules = [
     body('title').notEmpty().withMessage('Project title is required').trim(),
     body('description')
          .notEmpty()
          .withMessage('Project description is required')
          .trim(),
     body('techStack')
          .isArray({ min: 1 })
          .withMessage('At least one technology is required'),
];

const socialLinkRules = [
     body('platform').notEmpty().withMessage('Platform name is required').trim(),
     body('url')
          .notEmpty()
          .withMessage('URL is required')
          .isURL()
          .withMessage('Invalid URL format'),
];

const linkIdParamRule = [
     param('linkId').isMongoId().withMessage('Invalid link ID format'),
];

module.exports = {
     validate,
     createPortfolioRules,
     sectionParamRule,
     itemIdParamRule,
     addSkillRules,
     addProjectRules,
     socialLinkRules,
     linkIdParamRule,
};
