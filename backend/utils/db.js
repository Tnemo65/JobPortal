import mongoose from "mongoose";

const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        
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