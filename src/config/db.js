

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  try {
    console.log(`[DEBUG] Attempting Mongoose connect with URI: ${uri}`);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅  MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting reconnect…');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('✅  MongoDB reconnected.');
    });
  } catch (error) {
    console.log(`❌  MongoDB connection FAIL: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
