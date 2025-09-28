import mongoose from 'mongoose';
import Order from '../models/Order.js';
import { checkAndUpdateDeliveredOrders, updateRemainingDaysForAllOrders } from '../controllers/orderController.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const checkDeliveredOrders = async () => {
  try {
    console.log('🔄 Starting delivery status check...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cricketexpert');
    console.log('📦 Connected to MongoDB');
    
    // Update remaining days for all completed orders
    await updateRemainingDaysForAllOrders();
    
    // Check and update orders that should be marked as delivered
    await checkAndUpdateDeliveredOrders();
    
    console.log('✅ Delivery status check completed successfully');
    
  } catch (error) {
    console.error('❌ Error during delivery status check:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
    process.exit(0);
  }
};

// Run the check
checkDeliveredOrders();
