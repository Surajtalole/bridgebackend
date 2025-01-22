// routes/paymentRoutes.js
const express = require('express');
const { createOrder, verifyPayment,updateCoinandTrial, enrollInBatch } = require('../controllers/payments/paymentController');
const authMiddleware = require("../middlewares/authMiddleware")
const router = express.Router();

// Route to create an order
router.post('/createOrder',authMiddleware, createOrder);

// Route to verify payment
router.post('/verifyPayment',authMiddleware, verifyPayment);
router.put('/updatecoinandtrial',authMiddleware, updateCoinandTrial);
router.post('/enrollinbatch',authMiddleware, enrollInBatch);







module.exports = router;
