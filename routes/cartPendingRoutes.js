import express from 'express';
import {
  addItem,
  listByToken,
  updateItemQuantity,
  removeItem,
  clearCart,
  checkout,
  listAllCartPending
} from '../controllers/cartPendingController.js';

const router = express.Router();

// List all cart pending items (manager)
router.get('/all', listAllCartPending);

// Add or upsert item
router.post('/', addItem);

// List items for a cartToken
router.get('/:cartToken', listByToken);

// Update quantity for an item
router.put('/:cartToken/item/:productId', updateItemQuantity);

// Remove one item
router.delete('/:cartToken/item/:productId', removeItem);

// Clear cart for token
router.delete('/:cartToken', clearCart);

// Checkout pending cart to an Order (status remains cart_pending)
router.post('/checkout', checkout);

export default router;


