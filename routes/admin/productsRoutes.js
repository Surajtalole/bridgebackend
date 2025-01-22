const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require('path');
const authMiddleware = require('../../middlewares/authMiddleware');

const { addProduct, updateProduct,getProducts,deleteProduct,getProductById  } = require("../../controllers/admin/productController");


const storage = multer.memoryStorage(); // Store in memory (buffer)
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif|bmp|webp/;
    const mimeType = fileTypes.test(file.mimetype);
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimeType && extname) {
      return cb(null, true); // Accept the file
    }
    cb(new Error('Invalid file type. Only image files are allowed.'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/products/add", upload.single("productImage"), addProduct);


router.put("/products/update/:id", upload.single("productImage"), updateProduct);
router.get('/products/getAllProducts',authMiddleware, getProducts);

router.delete('/products/delete/:id', deleteProduct);


module.exports = router;
