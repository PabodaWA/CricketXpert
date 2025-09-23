import CartPending from '../models/cart_Pending.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// Helper to compute total line price
const computeLineTotal = (price, quantity) => {
  const numericPrice = Number(price) || 0;
  const numericQty = Number(quantity) || 0;
  return Math.max(0, numericPrice * numericQty);
};

// Create or update a cart line (upsert by cartToken + productId)
const addItem = async (req, res) => {
  try {
    const { cartToken, productId, title, price, quantity } = req.body;
    if (!cartToken || !productId) {
      return res.status(400).json({ message: 'cartToken and productId are required' });
    }

    // Ensure product exists and is active
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const qty = Math.max(1, Number(quantity) || 1);
    const unitPrice = Number(price ?? product.price) || 0;
    const total = computeLineTotal(unitPrice, qty);

    const updated = await CartPending.findOneAndUpdate(
      { cartToken, productId },
      {
        cartToken,
        productId,
        title: title ?? product.name,
        price: unitPrice,
        quantity: qty,
        total,
        status: 'cart_pending'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('productId');

    return res.status(201).json(updated);
  } catch (err) {
    console.error('addItem error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// Get all items for a cartToken
const listByToken = async (req, res) => {
  try {
    const { cartToken } = req.params;
    const items = await CartPending.find({ cartToken, status: { $ne: 'removed' } })
      .populate('productId')
      .sort({ createdAt: 1 });
    return res.json(items);
  } catch (err) {
    console.error('listByToken error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// Update quantity for a specific item
const updateItemQuantity = async (req, res) => {
  try {
    const { cartToken, productId } = req.params;
    const { quantity } = req.body;
    const qty = Number(quantity);
    if (Number.isNaN(qty)) return res.status(400).json({ message: 'Invalid quantity' });

    if (qty <= 0) {
      await CartPending.deleteOne({ cartToken, productId });
      return res.json({ message: 'Item removed' });
    }

    const item = await CartPending.findOne({ cartToken, productId }).populate('productId');
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const unitPrice = Number(item.price) || 0;
    item.quantity = qty;
    item.total = computeLineTotal(unitPrice, qty);
    await item.save();
    return res.json(item);
  } catch (err) {
    console.error('updateItemQuantity error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// Remove a specific item
const removeItem = async (req, res) => {
  try {
    const { cartToken, productId } = req.params;
    const result = await CartPending.deleteOne({ cartToken, productId });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Item not found' });
    return res.json({ message: 'Item removed' });
  } catch (err) {
    console.error('removeItem error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// Clear all items for a cartToken
const clearCart = async (req, res) => {
  try {
    const { cartToken } = req.params;
    await CartPending.deleteMany({ cartToken });
    return res.json({ message: 'Cart cleared' });
  } catch (err) {
    console.error('clearCart error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// Checkout: convert Cart_Pending items to an Order with status cart_pending
const checkout = async (req, res) => {
  try {
    const { cartToken, customerId, address } = req.body;
    if (!cartToken || !customerId) {
      return res.status(400).json({ message: 'cartToken and customerId are required' });
    }

    const items = await CartPending.find({ cartToken, status: 'cart_pending' }).populate('productId');
    if (!items || items.length === 0) {
      return res.status(404).json({ message: 'No items to checkout' });
    }

    // Build order items and compute totals
    let subtotal = 0;
    const orderItems = items.map((i) => {
      const unitPrice = Number(i.price ?? i.productId?.price) || 0;
      const qty = Number(i.quantity) || 1;
      subtotal += unitPrice * qty;
      return {
        productId: i.productId?._id || i.productId,
        quantity: qty,
        priceAtOrder: unitPrice
      };
    });

    const deliveryCharge = 450;
    const amount = subtotal + deliveryCharge;

    // Create or update a cart order
    let order = await Order.findOne({ customerId, status: 'cart_pending' });
    if (!order) {
      order = new Order({
        customerId,
        items: orderItems,
        amount,
        address: address || '',
        status: 'cart_pending',
        date: new Date()
      });
    } else {
      order.items = orderItems;
      order.amount = amount;
      order.address = address || order.address;
      order.date = new Date();
    }
    await order.save();

    // Mark cart pending items as moved_to_order
    await CartPending.updateMany(
      { cartToken, status: 'cart_pending' },
      { $set: { status: 'moved_to_order' } }
    );

    return res.json(order);
  } catch (err) {
    console.error('checkout error:', err);
    return res.status(500).json({ message: err.message });
  }
};

export {
  addItem,
  listByToken,
  updateItemQuantity,
  removeItem,
  clearCart,
  checkout
};


