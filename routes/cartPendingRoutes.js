import express from 'express';
import { upsertCartItem, getCartItems, updateCartItemQuantity, removeCartItem, clearCart, checkoutCart } from '../controllers/cartPendingController.js';

const router = express.Router();

// Upsert item
router.post('/', upsertCartItem);

// Get items by cartToken
router.get('/:cartToken', getCartItems);

// Update quantity
router.put('/:cartToken/item/:productId', updateCartItemQuantity);

// Remove item
router.delete('/:cartToken/item/:productId', removeCartItem);

// Clear cart
router.delete('/:cartToken', clearCart);

// Checkout
router.post('/checkout', checkoutCart);

export default router;


