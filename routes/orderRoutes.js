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
  cancelOrder
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

export default router;
