const express = require("express");
const { getMyInvoices } = require("../controllers/invoiceController");
const router = express.Router();

router.get("/getmyinvoices/:id", getMyInvoices);

module.exports = router;
