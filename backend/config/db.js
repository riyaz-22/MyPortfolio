const mongoose = require('mongoose');

// Prevent queries from silently buffering when there's no DB connection
const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);

const connectDB = async () => {
     if (!process.env.MONGODB_URI) {
          console.warn('⚠️  MONGODB_URI not provided — skipping initial DB connect');
          return;
     }

     try {
              const connectOpts = {
                   serverSelectionTimeoutMS: 10000,
                   connectTimeoutMS: 10000,
                   // Mongoose v6 uses these by default, but explicitly setting for clarity
                   useNewUrlParser: true,
                   useUnifiedTopology: true,
              };
          // If a specific DB name is provided, prefer it to avoid defaulting to 'test'
          if (process.env.DB_NAME) connectOpts.dbName = process.env.DB_NAME;

          const conn = await mongoose.connect(process.env.MONGODB_URI, connectOpts);
          const dbName = conn.connection.name || connectOpts.dbName || '(unspecified)';
          console.log(`✅ MongoDB Connected: ${conn.connection.host} (db: ${dbName})`);
     } catch (error) {
          // Log error but do NOT exit the process — serverless platforms must not call process.exit
          console.error(`❌ MongoDB Connection Error: ${error.message}`);
          console.error('Hint: verify MONGODB_URI, DB_NAME, and Atlas network access (IP whitelist / VPC).');
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
