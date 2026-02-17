const mongoose = require('mongoose');

const connectDB = async () => {
     if (!process.env.MONGODB_URI) {
          console.warn('⚠️  MONGODB_URI not provided — skipping initial DB connect');
          return;
     }

     try {
          const conn = await mongoose.connect(process.env.MONGODB_URI, {
               serverSelectionTimeoutMS: 5000,
          });
          console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
     } catch (error) {
          // Log error but do NOT exit the process — serverless platforms must not call process.exit
          console.error(`❌ MongoDB Connection Error: ${error.message}`);
          // allow application to continue; controllers will surface DB errors on requests
     }
};

// Graceful shutdown
process.on('SIGINT', async () => {
     await mongoose.connection.close();
     console.log('MongoDB connection closed due to app termination');
     process.exit(0);
});

module.exports = connectDB;
