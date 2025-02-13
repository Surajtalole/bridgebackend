const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');

const { getOrders  } = require('../../controllers/admin/orderController');
const {getOrderCount} = require('../../controllers/orderController')
router.get('/getOrders', getOrders);
router.get('/order-count', authMiddleware, getOrderCount);


module.exports = router;
