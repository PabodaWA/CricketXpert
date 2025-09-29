import Product from '../models/Product.js';
import { sendSupplierOrderEmail } from '../utils/wemailService.js';

// Contact supplier for low stock items
const contactSupplier = async (req, res) => {
  try {
    const { productId, quantity, email } = req.body;

    // Validate required fields
    if (!productId || !quantity || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID, quantity, and email are required' 
      });
    }

    // Validate quantity
    if (quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quantity must be greater than 0' 
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Check if product is actually low stock
    if (product.stock_quantity >= 50) {
      return res.status(400).json({ 
        success: false, 
        message: 'This product is not in low stock' 
      });
    }

    // Send email to supplier
    const emailSent = await sendSupplierOrderEmail(product, quantity, email);
    
    if (emailSent) {
      console.log(`📧 Supplier order email sent successfully for product: ${product.name} to: ${email}`);
      res.json({ 
        success: true, 
        message: 'Email sent successfully to supplier' 
      });
    } else {
      console.error(`❌ Failed to send supplier order email for product: ${product.name} to: ${email}`);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send email. Please try again.' 
      });
    }

  } catch (error) {
    console.error('Error in contactSupplier:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export { contactSupplier };

