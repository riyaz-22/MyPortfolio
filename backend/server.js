// Minimal server bootstrap — delegate app logic to `app.js` so we can run serverless or local
require('dotenv').config();

// If run directly, start the app; otherwise export the app for serverless wrappers
const app = require('./app');

if (require.main === module) {
     const PORT = process.env.PORT || 5000;
     app.listen(PORT, () => {
          console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
     });
}

module.exports = app;
