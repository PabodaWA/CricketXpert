const Order = require('../models/Order');
const Product = require('../models/Product');
// --- THIS LINE IS NOW CORRECTED ---
const Payment = require('../models/Payments'); 

// Get order reports
exports.getOrderReport = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    let query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status) {
      query.status = status;
    }
    
    const orders = await Order.find(query)
      .populate('items.productId')
      .populate('paymentId')
      .sort({ date: -1 });
    
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Group by status
    const statusSummary = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        statusSummary
      },
      orders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get product sales report
exports.getProductSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchQuery = {};
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const productSales = await Order.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.priceAtOrder'] } },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          category: '$product.category',
          brand: '$product.brand',
          totalQuantity: 1,
          totalRevenue: 1,
          orderCount: 1
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
    
    res.json(productSales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get revenue report by date
exports.getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    let matchQuery = {};
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    let groupQuery;
    switch (groupBy) {
      case 'month':
        groupQuery = {
          year: { $year: '$date' },
          month: { $month: '$date' }
        };
        break;
      case 'week':
        groupQuery = {
          year: { $year: '$date' },
          week: { $week: '$date' }
        };
        break;
      default:
        groupQuery = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        };
    }
    
    const revenueData = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupQuery,
          totalRevenue: { $sum: '$amount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    res.json(revenueData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};