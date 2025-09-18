import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import connectDB from './config/db.js';
import errorMiddleware from './middleware/errorMiddleware.js';

// Import all your route files
import authRoutes from './routes/authRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import usersRoutes from './routes/usersRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

// --- Initial Configuration ---
// Load environment variables from .env file
dotenv.config();

// Connect to the database
connectDB();

// Initialize the Express app
const app = express();

// --- Middleware Setup ---
// Enable Cross-Origin Resource Sharing
app.use(cors());
// Allow the app to accept JSON in the request body
app.use(express.json());


// --- API Routes Setup ---
// This is where you link your routes to their base URLs
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reports', reportRoutes);

// A simple test route to check if the server is working
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'Test route working!' });
});


// --- Static File Serving ---
// This makes the 'uploads' folder accessible from the browser
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));


// --- Error Handling Middleware ---
// This should be one of the last middleware to be used
app.use(errorMiddleware);


// --- Start the Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
