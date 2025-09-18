// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer'); // Import multer

// --- Multer Configuration ---
// This tells multer where to store the uploaded files.
// We'll store them in a folder named 'uploads' in the backend root.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this 'uploads' folder exists
  },
  filename: function (req, file, cb) {
    // Create a unique filename to avoid overwriting files with the same name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    console.log('Multer file filter - file:', file);
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});
// --- End Multer Configuration ---


const { 
  createProduct, 
  getProducts, 
  getProduct, 
  updateProduct, 
  deleteProduct,
  searchProducts,
  getProductsByCategory,
  getCategories,
  getBrands
} = require('../controllers/productController');

// Search and filter routes
router.get('/search', searchProducts);
router.get('/categories', getCategories);
router.get('/brands', getBrands);
router.get('/category/:category', getProductsByCategory);

// --- MODIFIED: Basic CRUD routes ---
// The 'upload.single('image')' middleware will handle the file upload.
// 'image' MUST match the name used in the FormData on the frontend.
router.post('/', (req, res, next) => {
  console.log('=== PRODUCT ROUTE DEBUG ===');
  console.log('Request received for product creation');
  console.log('Content-Type:', req.headers['content-type']);
  next();
}, upload.single('image'), (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    return res.status(400).json({ message: 'File upload error: ' + err.message });
  } else if (err) {
    console.error('Other error:', err);
    return res.status(400).json({ message: err.message });
  }
  next();
}, createProduct); 
router.get('/', getProducts);
router.get('/:id', getProduct);
router.put('/:id', upload.single('image'), updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
