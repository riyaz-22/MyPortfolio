const Service = require('../models/Service');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/sendResponse');

exports.getAll = asyncHandler(async (_req, res) => {
     const services = await Service.find().sort('order');
     sendResponse(res, 200, services, 'Services fetched');
});

exports.create = asyncHandler(async (req, res) => {
     const service = await Service.create(req.body);
     sendResponse(res, 201, service, 'Service created');
});

exports.update = asyncHandler(async (req, res) => {
     const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true,
     });
     if (!service) throw new ApiError(404, 'Service not found');
     sendResponse(res, 200, service, 'Service updated');
});

exports.remove = asyncHandler(async (req, res) => {
     const service = await Service.findByIdAndDelete(req.params.id);
     if (!service) throw new ApiError(404, 'Service not found');
     sendResponse(res, 200, null, 'Service deleted');
});

exports.reorder = asyncHandler(async (req, res) => {
     const { items } = req.body; // [{ id, order }]
     const ops = items.map((i) => ({
          updateOne: {
               filter: { _id: i.id },
               update: { $set: { order: i.order } },
          },
     }));
     await Service.bulkWrite(ops);
     const services = await Service.find().sort('order');
     sendResponse(res, 200, services, 'Order updated');
});
