const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/portfolioController');
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
     .post(createPortfolioRules, validate, ctrl.createPortfolio)
     .get(ctrl.getPortfolio)
     .delete(ctrl.deletePortfolio);

// ─── Section-level operations ───────────────────────────────────

router
     .route('/section/:section')
     .get(sectionParamRule, validate, ctrl.getSection)
     .patch(sectionParamRule, validate, ctrl.updateSection);

// ─── Item-level operations on array sections ────────────────────

router
     .route('/section/:section/item')
     .post(sectionParamRule, validate, ctrl.addItemToSection);

router
     .route('/section/:section/item/:itemId')
     .patch(
          [...sectionParamRule, ...itemIdParamRule],
          validate,
          ctrl.updateItemInSection
     )
     .delete(
          [...sectionParamRule, ...itemIdParamRule],
          validate,
          ctrl.deleteItemFromSection
     );

// ─── Convenience: validated add for skills / projects ───────────

router.post(
     '/skills',
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
     socialLinkRules,
     validate,
     ctrl.addSocialLink
);

router.delete(
     '/social-links/:linkId',
     linkIdParamRule,
     validate,
     ctrl.deleteSocialLink
);

module.exports = router;
