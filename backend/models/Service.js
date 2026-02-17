const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema(
     {
          title: {
               type: String,
               required: [true, 'Service title is required'],
               trim: true,
          },
          description: {
               type: String,
               required: [true, 'Service description is required'],
               trim: true,
          },
          icon: {
               type: String,
               trim: true,
          },
          order: {
               type: Number,
               default: 0,
          },
          isActive: {
               type: Boolean,
               default: true,
          },
     },
     { timestamps: true }
);

ServiceSchema.index({ order: 1 });

module.exports = mongoose.model('Service', ServiceSchema);
