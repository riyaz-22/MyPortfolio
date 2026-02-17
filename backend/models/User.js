const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
     {
          name: {
               type: String,
               required: [true, 'Name is required'],
               trim: true,
          },
          email: {
               type: String,
               required: [true, 'Email is required'],
               unique: true,
               trim: true,
               lowercase: true,
               match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email'],
          },
          password: {
               type: String,
               required: [true, 'Password is required'],
               minlength: [6, 'Password must be at least 6 characters'],
               select: false, // never return by default
          },
          role: {
               type: String,
               enum: ['admin', 'editor'],
               default: 'admin',
          },
     },
     { timestamps: true }
);

// Hash password before save
UserSchema.pre('save', async function () {
     if (!this.isModified('password')) return;
     this.password = await bcrypt.hash(this.password, 12);
});

// Instance method – compare passwords
UserSchema.methods.comparePassword = async function (candidate) {
     return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', UserSchema);
