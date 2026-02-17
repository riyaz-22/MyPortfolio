const Testimonial = require('../models/Testimonial');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/sendResponse');

exports.getAll = asyncHandler(async (_req, res) => {
     const testimonials = await Testimonial.find().sort('order');
     sendResponse(res, 200, testimonials, 'Testimonials fetched');
});

exports.create = asyncHandler(async (req, res) => {
     const testimonial = await Testimonial.create(req.body);
     sendResponse(res, 201, testimonial, 'Testimonial created');
});

exports.update = asyncHandler(async (req, res) => {
     const testimonial = await Testimonial.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true, runValidators: true }
     );
     if (!testimonial) throw new ApiError(404, 'Testimonial not found');
     sendResponse(res, 200, testimonial, 'Testimonial updated');
});

exports.remove = asyncHandler(async (req, res) => {
     const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
     if (!testimonial) throw new ApiError(404, 'Testimonial not found');
     sendResponse(res, 200, null, 'Testimonial deleted');
});

exports.reorder = asyncHandler(async (req, res) => {
     const { items } = req.body;
     const ops = items.map((i) => ({
          updateOne: {
               filter: { _id: i.id },
               update: { $set: { order: i.order } },
          },
     }));
     await Testimonial.bulkWrite(ops);
     const testimonials = await Testimonial.find().sort('order');
     sendResponse(res, 200, testimonials, 'Order updated');
});
