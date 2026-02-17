const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/portfolioController');
const { protect } = require('../middleware/auth');
const {
     validate,
     createPortfolioRules,
     sectionParamRule,
     itemIdParamRule,
     addSkillRules,
     addProjectRules,
     socialLinkRules,
     linkIdParamRule,
} = require('../middleware/validators');

// ─── Portfolio CRUD ─────────────────────────────────────────────

router
     .route('/')
     .post(protect, createPortfolioRules, validate, ctrl.createPortfolio)
     .get(ctrl.getPortfolio)
     .delete(protect, ctrl.deletePortfolio);

// ─── Section-level operations ───────────────────────────────────

router
     .route('/section/:section')
     .get(sectionParamRule, validate, ctrl.getSection)
     .patch(protect, sectionParamRule, validate, ctrl.updateSection);

// ─── Item-level operations on array sections ────────────────────

router
     .route('/section/:section/item')
     .post(protect, sectionParamRule, validate, ctrl.addItemToSection);

router
     .route('/section/:section/item/:itemId')
     .patch(
          protect,
          [...sectionParamRule, ...itemIdParamRule],
          validate,
          ctrl.updateItemInSection
     )
     .delete(
          protect,
          [...sectionParamRule, ...itemIdParamRule],
          validate,
          ctrl.deleteItemFromSection
     );

// ─── Convenience: validated add for skills / projects ───────────

router.post(
     '/skills',
     protect,
     addSkillRules,
     validate,
     (req, res, next) => {
          req.params.section = 'skills';
          next();
     },
     ctrl.addItemToSection
);

router.post(
     '/projects',
     protect,
     addProjectRules,
     validate,
     (req, res, next) => {
          req.params.section = 'projects';
          next();
     },
     ctrl.addItemToSection
);

// ─── Social links ───────────────────────────────────────────────

router.post(
     '/social-links',
     protect,
     socialLinkRules,
     validate,
     ctrl.addSocialLink
);

router.delete(
     '/social-links/:linkId',
     protect,
     linkIdParamRule,
     validate,
     ctrl.deleteSocialLink
);

module.exports = router;
