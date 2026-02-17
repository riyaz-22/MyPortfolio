const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
     throw new Error('MONGODB_URI not configured in environment');
}

// Cache client between invocations
let cachedClient = global.__mongoClient;
let cachedDb = global.__mongoDb;

async function connect() {
     if (cachedClient && cachedDb) return { client: cachedClient, db: cachedDb };
     const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
     await client.connect();
     const db = client.db();
     cachedClient = client;
     cachedDb = db;
     global.__mongoClient = client;
     global.__mongoDb = db;
     return { client, db };
}

module.exports = async (req, res) => {
     try {
          const { db } = await connect();
          const col = db.collection('portfolios');

          if (req.method === 'GET') {
               const doc = await col.findOne({ isActive: true });
               return res.status(200).json({ success: true, data: doc || null });
          }

          if (req.method === 'POST') {
               const body = req.body;
               if (!body || typeof body !== 'object') return res.status(400).json({ success: false, message: 'Invalid body' });

               // Upsert: set personalDetails and keep single active portfolio
               const update = {
                    $set: { 'personalDetails': body.personalDetails || body, isActive: true },
               };
               const opts = { upsert: true, returnDocument: 'after' };
               const result = await col.findOneAndUpdate({ isActive: true }, update, opts);
               return res.status(200).json({ success: true, data: result.value });
          }

          res.setHeader('Allow', 'GET, POST');
          res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
     } catch (err) {
          console.error('[api/profile] error', err);
          res.status(500).json({ success: false, message: err.message });
     }
};
