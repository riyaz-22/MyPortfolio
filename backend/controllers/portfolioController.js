const Portfolio = require('../models/Portfolio');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/sendResponse');
const { SECTIONS } = require('../config/constants');

// ─────────────────────────────────────────────────────────────────
// @desc    Create portfolio
// @route   POST /api/portfolio
// ─────────────────────────────────────────────────────────────────
exports.createPortfolio = asyncHandler(async (req, res) => {
     // Only one active portfolio allowed — guard against duplicates
     const existing = await Portfolio.findOne({ isActive: true });
     if (existing) {
          throw new ApiError(
               409,
               'An active portfolio already exists. Update it instead.'
          );
     }

     const portfolio = await Portfolio.create(req.body);
     sendResponse(res, 201, portfolio, 'Portfolio created successfully');
});

// ─────────────────────────────────────────────────────────────────
// @desc    Get active portfolio
// @route   GET /api/portfolio
// ─────────────────────────────────────────────────────────────────
exports.getPortfolio = asyncHandler(async (req, res) => {
     const portfolio = await Portfolio.findOne({ isActive: true });
     if (!portfolio) {
          throw new ApiError(404, 'Portfolio not found');
     }
     sendResponse(res, 200, portfolio, 'Portfolio fetched successfully');
});

// ─────────────────────────────────────────────────────────────────
// @desc    Get a specific section of the portfolio
// @route   GET /api/portfolio/section/:section
// ─────────────────────────────────────────────────────────────────
exports.getSection = asyncHandler(async (req, res) => {
     const { section } = req.params;

     if (!SECTIONS.includes(section)) {
          throw new ApiError(
               400,
               `Invalid section. Allowed: ${SECTIONS.join(', ')}`
          );
     }

     const portfolio = await Portfolio.findOne({ isActive: true }).select(
          section
     );
     if (!portfolio) {
          throw new ApiError(404, 'Portfolio not found');
     }

     sendResponse(
          res,
          200,
          portfolio[section],
          `${section} fetched successfully`
     );
});

// ─────────────────────────────────────────────────────────────────
// @desc    Update a specific section (partial update)
// @route   PATCH /api/portfolio/section/:section
// ─────────────────────────────────────────────────────────────────
exports.updateSection = asyncHandler(async (req, res) => {
     const { section } = req.params;

     if (!SECTIONS.includes(section)) {
          throw new ApiError(
               400,
               `Invalid section. Allowed: ${SECTIONS.join(', ')}`
          );
     }

     const updateData = {};

     // For nested object sections (personalDetails, resume) we merge keys
     if (section === 'personalDetails' || section === 'resume') {
          for (const [key, value] of Object.entries(req.body)) {
               updateData[`${section}.${key}`] = value;
          }
     } else {
          // Array sections — replace the whole array
          updateData[section] = req.body[section] || req.body;
     }

     const portfolio = await Portfolio.findOneAndUpdate(
          { isActive: true },
          { $set: updateData },
          { new: true, runValidators: true }
     );

     if (!portfolio) {
          throw new ApiError(404, 'Portfolio not found');
     }

     sendResponse(
          res,
          200,
          portfolio[section],
          `${section} updated successfully`
     );
});

// ─────────────────────────────────────────────────────────────────
// @desc    Add an item to an array section (skills, projects, etc.)
// @route   POST /api/portfolio/section/:section/item
// ─────────────────────────────────────────────────────────────────
exports.addItemToSection = asyncHandler(async (req, res) => {
     const { section } = req.params;
     const arraySections = ['skills', 'projects', 'experience', 'education'];

     if (!arraySections.includes(section)) {
          throw new ApiError(
               400,
               `Cannot add items to "${section}". Allowed: ${arraySections.join(', ')}`
          );
     }

     // Handle socialLinks as a special nested array
     const portfolio = await Portfolio.findOneAndUpdate(
          { isActive: true },
          { $push: { [section]: req.body } },
          { new: true, runValidators: true }
     );

     if (!portfolio) {
          throw new ApiError(404, 'Portfolio not found');
     }

     sendResponse(
          res,
          201,
          portfolio[section],
          `Item added to ${section} successfully`
     );
});

// ─────────────────────────────────────────────────────────────────
// @desc    Update an item inside an array section
// @route   PATCH /api/portfolio/section/:section/item/:itemId
// ─────────────────────────────────────────────────────────────────
exports.updateItemInSection = asyncHandler(async (req, res) => {
     const { section, itemId } = req.params;
     const arraySections = ['skills', 'projects', 'experience', 'education'];

     if (!arraySections.includes(section)) {
          throw new ApiError(
               400,
               `Cannot update items in "${section}". Allowed: ${arraySections.join(', ')}`
          );
     }

     // Build $set for each field provided
     const updateFields = {};
     for (const [key, value] of Object.entries(req.body)) {
          updateFields[`${section}.$[elem].${key}`] = value;
     }

     const portfolio = await Portfolio.findOneAndUpdate(
          { isActive: true },
          { $set: updateFields },
          {
               new: true,
               runValidators: true,
               arrayFilters: [{ 'elem._id': itemId }],
          }
     );

     if (!portfolio) {
          throw new ApiError(404, 'Portfolio not found');
     }

     const updatedItem = portfolio[section].id(itemId);
     if (!updatedItem) {
          throw new ApiError(404, `Item with id ${itemId} not found in ${section}`);
     }

     sendResponse(res, 200, updatedItem, `Item in ${section} updated successfully`);
});

// ─────────────────────────────────────────────────────────────────
// @desc    Delete an item from an array section
// @route   DELETE /api/portfolio/section/:section/item/:itemId
// ─────────────────────────────────────────────────────────────────
exports.deleteItemFromSection = asyncHandler(async (req, res) => {
     const { section, itemId } = req.params;
     const arraySections = ['skills', 'projects', 'experience', 'education'];

     if (!arraySections.includes(section)) {
          throw new ApiError(
               400,
               `Cannot delete items from "${section}". Allowed: ${arraySections.join(', ')}`
          );
     }

     const portfolio = await Portfolio.findOneAndUpdate(
          { isActive: true },
          { $pull: { [section]: { _id: itemId } } },
          { new: true }
     );

     if (!portfolio) {
          throw new ApiError(404, 'Portfolio not found');
     }

     sendResponse(
          res,
          200,
          portfolio[section],
          `Item removed from ${section} successfully`
     );
});

// ─────────────────────────────────────────────────────────────────
// @desc    Add a social link
// @route   POST /api/portfolio/social-links
// ─────────────────────────────────────────────────────────────────
exports.addSocialLink = asyncHandler(async (req, res) => {
     const portfolio = await Portfolio.findOneAndUpdate(
          { isActive: true },
          { $push: { 'personalDetails.socialLinks': req.body } },
          { new: true, runValidators: true }
     );

     if (!portfolio) {
          throw new ApiError(404, 'Portfolio not found');
     }

     sendResponse(
          res,
          201,
          portfolio.personalDetails.socialLinks,
          'Social link added successfully'
     );
});

// ─────────────────────────────────────────────────────────────────
// @desc    Delete a social link
// @route   DELETE /api/portfolio/social-links/:linkId
// ─────────────────────────────────────────────────────────────────
exports.deleteSocialLink = asyncHandler(async (req, res) => {
     const { linkId } = req.params;

     const portfolio = await Portfolio.findOneAndUpdate(
          { isActive: true },
          { $pull: { 'personalDetails.socialLinks': { _id: linkId } } },
          { new: true }
     );

     if (!portfolio) {
          throw new ApiError(404, 'Portfolio not found');
     }

     sendResponse(
          res,
          200,
          portfolio.personalDetails.socialLinks,
          'Social link removed successfully'
     );
});

// ─────────────────────────────────────────────────────────────────
// @desc    Delete entire portfolio
// @route   DELETE /api/portfolio
// ─────────────────────────────────────────────────────────────────
exports.deletePortfolio = asyncHandler(async (req, res) => {
     const portfolio = await Portfolio.findOneAndDelete({ isActive: true });
     if (!portfolio) {
          throw new ApiError(404, 'Portfolio not found');
     }
     sendResponse(res, 200, null, 'Portfolio deleted successfully');
});
