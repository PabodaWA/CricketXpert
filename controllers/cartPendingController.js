import CartPending from '../models/cart_Pending.js';
import Order from '../models/Order.js';

// Create or update item in Cart_Pending
const upsertCartItem = async (req, res) => {
  try {
    const { cartToken, productId, title, price, quantity } = req.body;
    if (!cartToken || !productId || !title || price == null || !quantity) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const total = Number(price) * Number(quantity);

    const item = await CartPending.findOneAndUpdate(
      { cartToken, productId },
      { cartToken, productId, title, price, quantity, total, status: 'cart_pending' },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('productId');

    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all items for a cartToken
const getCartItems = async (req, res) => {
  try {
    const { cartToken } = req.params;
    const items = await CartPending.find({ cartToken, status: 'cart_pending' }).populate('productId');
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update quantity of a cart item
const updateCartItemQuantity = async (req, res) => {
  try {
    const { cartToken, productId } = req.params;
    const { quantity } = req.body;
    if (quantity <= 0) {
      // Remove item if quantity <= 0
      await CartPending.deleteOne({ cartToken, productId });
      return res.json({ message: 'Item removed' });
    }

    const item = await CartPending.findOne({ cartToken, productId });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.quantity = quantity;
    item.total = item.price * quantity;
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove item
const removeCartItem = async (req, res) => {
  try {
    const { cartToken, productId } = req.params;
    const result = await CartPending.deleteOne({ cartToken, productId });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const { cartToken } = req.params;
    await CartPending.deleteMany({ cartToken });
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Checkout: move items to Order or mark status
const checkoutCart = async (req, res) => {
  try {
    const { cartToken, customerId, address } = req.body;
    if (!cartToken || !customerId) return res.status(400).json({ message: 'cartToken and customerId required' });

    const items = await CartPending.find({ cartToken, status: 'cart_pending' }).populate('productId');
    if (!items.length) return res.status(400).json({ message: 'No items to checkout' });

    const mappedItems = items.map(i => ({
      productId: i.productId._id,
      quantity: i.quantity,
      priceAtOrder: i.price
    }));
    const amount = items.reduce((sum, i) => sum + i.total, 0) + 450; // keep delivery fee behavior

    const order = new Order({
      customerId,
      items: mappedItems,
      amount,
      address: address || 'No address provided',
      status: 'created',
      date: new Date()
    });
    await order.save();

    // Mark items as moved
    await CartPending.updateMany({ cartToken, status: 'cart_pending' }, { $set: { status: 'moved_to_order' } });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { upsertCartItem, getCartItems, updateCartItemQuantity, removeCartItem, clearCart, checkoutCart };


