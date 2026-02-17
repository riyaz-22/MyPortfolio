const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema(
     {
          name: {
               type: String,
               required: [true, 'Name is required'],
               trim: true,
          },
          role: {
               type: String,
               trim: true,
          },
          company: {
               type: String,
               trim: true,
          },
          content: {
               type: String,
               required: [true, 'Testimonial content is required'],
               trim: true,
          },
          avatar: {
               type: String,
               trim: true,
          },
          rating: {
               type: Number,
               min: 1,
               max: 5,
               default: 5,
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

TestimonialSchema.index({ order: 1 });

module.exports = mongoose.model('Testimonial', TestimonialSchema);
