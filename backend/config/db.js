// config/db.js
const mongoose = require('mongoose');
const dbg = console;

async function connectDB(mongoUri) {
  if (!mongoUri) throw new Error('MONGO_URI not provided');
  try {
    await mongoose.connect(mongoUri);
    dbg.log('MongoDB connected');
  } catch (err) {
    dbg.error('MongoDB connection error:', err);
    throw err;
  }
}

module.exports = { connectDB };

