const express = require('express');
const { getProducts,getProductById  } = require("../controllers/admin/productController");
const { createOrder } = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();


router.get('/products/getAllProducts',authMiddleware, getProducts);
router.get('/products/getProductById/:id', getProductById);
router.post('/order', authMiddleware, createOrder);

module.exports = router;
