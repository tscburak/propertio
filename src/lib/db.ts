import mongoose from 'mongoose';

// MongoDB connection string - should be in environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/propertio';

// Global variable to track connection status
let isConnected = false;

// Connection options
const connectionOptions = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: true, // Enable mongoose buffering for better reliability
};

/**
 * Connect to MongoDB using Mongoose
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  // If already connected and ready, return existing connection
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, connectionOptions);
    
    // Wait for connection to be ready
    await mongoose.connection.asPromise();
    
    isConnected = true;
    console.log('✅ Successfully connected to MongoDB');
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
      isConnected = false;
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Mongoose connection closed through app termination');
      process.exit(0);
    });

    return mongoose;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectFromDatabase(): Promise<void> {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('Disconnected from MongoDB');
  }
}

/**
 * Get the current connection status
 */
export function getConnectionStatus(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Ensure database is connected before performing operations
 */
export async function ensureConnection(): Promise<void> {
  if (!getConnectionStatus()) {
    await connectToDatabase();
  }
}

/**
 * Get the mongoose connection instance
 */
export function getConnection(): typeof mongoose.connection {
  return mongoose.connection;
}

// Export mongoose for use in models
export { mongoose };
