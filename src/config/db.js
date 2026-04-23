

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌  MONGO_URI environment variable is not set!');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      // Automatically retry writes/reads on transient Atlas network blips
      retryWrites: true,
      retryReads:  true,
    });

    console.log(`✅  MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting reconnect…');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('✅  MongoDB reconnected.');
    });
  } catch (error) {
    console.error(`❌  MongoDB connection FAIL: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
