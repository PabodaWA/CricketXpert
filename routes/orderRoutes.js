import express from 'express';
const router = express.Router();
import { 
  createOrder, 
  getOrders, 
  getOrder, 
  updateOrderStatus, 
  updateOrder,
  deleteOrder, 
  calculateOrderTotal, 
  getOrdersByStatus,
  createCartOrder,
  getCartOrder,
  completeCartOrder,
  deleteCartOrder,
  downloadOrder,
  cancelOrder,
  checkAndUpdateDeliveredOrders,
  updateRemainingDaysForAllOrders
} from '../controllers/orderController.js';

// Regular order routes
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.get('/:id/download', downloadOrder);
router.put('/:id', updateOrderStatus);
router.put('/:id/details', updateOrder);
router.put('/:id/cancel', cancelOrder);
router.delete('/:id', deleteOrder);

// Cart order routes
router.post('/cart', createCartOrder);
router.get('/cart/:customerId', getCartOrder);
router.put('/cart/complete', completeCartOrder);
router.delete('/cart/:customerId', deleteCartOrder);

// Utility routes
router.post("/calculate-total", calculateOrderTotal);
router.get("/status/:status", getOrdersByStatus);

// Delivery tracking routes
router.post("/check-delivered", checkAndUpdateDeliveredOrders);
router.post("/update-remaining-days", updateRemainingDaysForAllOrders);

// Combined delivery check endpoint
router.post("/delivery-check", async (req, res) => {
  try {
    await updateRemainingDaysForAllOrders();
    await checkAndUpdateDeliveredOrders();
    res.json({ success: true, message: 'Delivery status check completed successfully' });
  } catch (error) {
    console.error('Error in delivery check:', error);
    res.status(500).json({ success: false, message: 'Error during delivery check' });
  }
});

export default router;
