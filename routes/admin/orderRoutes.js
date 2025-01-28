const express = require('express');
const router = express.Router();
const { getOrders } = require('../../controllers/admin/orderController');

router.get('/getOrders', getOrders);

module.exports = router;
