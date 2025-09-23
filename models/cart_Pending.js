import mongoose from 'mongoose';

const cartPendingSchema = new mongoose.Schema({
  cartToken: {
    type: String,
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    default: 'cart_pending',
    enum: ['cart_pending', 'moved_to_order', 'removed']
  }
}, {
  timestamps: true
});

cartPendingSchema.index({ cartToken: 1, productId: 1 }, { unique: true });

export default mongoose.model('Cart_Pending', cartPendingSchema);


