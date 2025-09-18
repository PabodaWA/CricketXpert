const express = require('express');
const router = express.Router();
const { 
  getOrderReport, 
  getProductSalesReport, 
  getRevenueReport 
} = require('../controllers/reportController');

router.get('/orders', getOrderReport);
router.get('/product-sales', getProductSalesReport);
router.get('/revenue', getRevenueReport);

module.exports = router;