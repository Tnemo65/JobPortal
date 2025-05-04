import mongoose from "mongoose";

const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        
        // Log a safe version of the MongoDB URI for debugging
        const mongoUri = process.env.MONGO_URI || '';
        const redactedUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//[USERNAME]:[REDACTED]@');
        console.log('MongoDB URI format:', redactedUri);
        
        // Check if the URI starts with the correct prefix
        if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
            console.error('Invalid MongoDB URI format. URI must start with "mongodb://" or "mongodb+srv://"');
            console.log('URI prefix:', mongoUri.substring(0, 12) + '...');
        }
        
        // Add connection options to handle retries and timeouts better
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log('MongoDB connected successfully');
        
        // Log when the connection is lost
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB connection disconnected');
        });
        
        // Log connection errors
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });
        
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        // Don't exit the process as it would crash the server
        // Instead, let the server continue running so it can respond with appropriate error messages
    }
}

export default connectDB;