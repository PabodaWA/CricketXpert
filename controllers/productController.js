const mongoose = require('mongoose');
const Product = require('../models/Product');
const { sendLowStockAlert } = require('../utils/wemailService');


exports.createProduct = async (req, res) => {
  try {
    console.log('=== CREATE PRODUCT DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Request headers:', req.headers);
    
    // The text fields are in req.body
    const productData = req.body;

    // The uploaded file info is in req.file
    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, "/")}`;
      console.log('Creating product with image URL:', imageUrl);
      console.log('File path:', req.file.path);
      console.log('Protocol:', req.protocol);
      console.log('Host:', req.get('host'));
      console.log('File details:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
      productData.image_url = imageUrl;
    } else {
        console.log('No file uploaded for product');
        console.log('Multer error:', req.multerError);
        productData.image_url = '';
    }

    console.log('Final product data:', productData);
    const product = new Product(productData);
    await product.save();
    console.log('Product saved successfully:', product);
    
    // Check for low stock alert on new product
    if (product.stock_quantity <= 10) {
      console.log(`⚠️ NEW PRODUCT WITH LOW STOCK: ${product.name} - Stock: ${product.stock_quantity}`);
      try {
        await sendLowStockAlert(product);
        console.log(`📧 Low stock email alert sent for new product: ${product.name}`);
      } catch (emailError) {
        console.error(`❌ Failed to send low stock email for new product ${product.name}:`, emailError);
      }
    }
    
    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error); // Log the full error
    res.status(400).json({ message: error.message });
  }
};




// Get all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get product by ID
exports.getProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid Product ID" });
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const productData = req.body;

    // Handle file upload if image is provided
    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, "/")}`;
      console.log('Updating product with new image URL:', imageUrl);
      console.log('File path:', req.file.path);
      productData.image_url = imageUrl;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, productData, { new: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    
    // Check for low stock alert on updated product
    if (product.stock_quantity <= 10) {
      console.log(`⚠️ UPDATED PRODUCT WITH LOW STOCK: ${product.name} - Stock: ${product.stock_quantity}`);
      try {
        await sendLowStockAlert(product);
        console.log(`📧 Low stock email alert sent for updated product: ${product.name}`);
      } catch (emailError) {
        console.error(`❌ Failed to send low stock email for updated product ${product.name}:`, emailError);
      }
    }
    
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const { query, category, brand, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    let searchQuery = { is_active: true };
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }
    if (category) searchQuery.category = category;
    if (brand) searchQuery.brand = brand;
    if (minPrice || maxPrice) {
      searchQuery.price = {};
      if (minPrice) searchQuery.price.$gte = Number(minPrice);
      if (maxPrice) searchQuery.price.$lte = Number(maxPrice);
    }
    const products = await Product.find(searchQuery)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ created_at: -1 });
    const total = await Product.countDocuments(searchQuery);
    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ 
      category: category, 
      is_active: true 
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { is_active: true });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all brands
exports.getBrands = async (req, res) => {
  try {
    const brands = await Product.distinct('brand', { is_active: true });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
