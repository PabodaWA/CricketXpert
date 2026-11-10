
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Reuse connection across Vercel function invocations
let cached = globalThis.mongooseConnection;

if (!cached) {
    cached = globalThis.mongooseConnection = {
        conn: null,
        promise: null
    };
}

const connectDB = async () => {
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is missing');
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            retryWrites: true,
            w: 'majority'
        }).then((mongooseInstance) => {
            console.log('MongoDB Connected Successfully');
            return mongooseInstance;
        }).catch((error) => {
            cached.promise = null;
            cached.conn = null;
            throw error;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
};

export default connectDB;
