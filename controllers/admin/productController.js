const Product = require("../../model/admin/Product");
const path = require("path");
const uploadProductToFTP = require("../ftpController/productFtpController");
const { buffer } = require("stream/consumers");


const addProduct = async (req, res) => {
  try {
    const { productName, coin, description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Product image is required." });
    }

    // Upload the image to the FTP server
    const filename = Date.now() + path.extname(file.originalname); // Create a unique filename
    const imageUrl = await uploadProductToFTP(file.buffer,filename)
    

    // Create a new product with the uploaded image URL
    const newProduct = new Product({
      productName,
      productImage: imageUrl, // Store the FTP path to the image
      coin,
      description,
    });

    await newProduct.save();

    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error adding product", error });
  }
};


const updateProduct = async (req, res) => {
  try {
    const { productName, coin, description } = req.body;
    const file = req.file;

    let productImage = req.body.productImage;

    // If a new image is uploaded, upload it to the FTP server
    if (file) {
      const filename = Date.now() + path.extname(file.originalname); // Create a unique filename
      productImage = await uploadProductToFTP(file.buffer, filename); // Upload to FTP server and get the image URL
    }

    // Find and update the product in the database
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { productName, coin, description, productImage },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error updating product", error });
  }
};


const getProducts = async (req, res) => {
    try {
      const products = await Product.find(); 
      res.status(200).json(products); 
    } catch (error) {
      res.status(500).json({ message: "Error fetching products", error: error.message });
    }
  };

  const deleteProduct = async (req, res) => {
    try {
      const productId = req.params.id;
  
      const product = await Product.findByIdAndDelete(productId);
  
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      res.status(200).json({ message: "Product deleted successfully", product });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting product" });
    }
  };
  const getProductById = async (req, res) => {
    try {
      const { id } = req.params;  
  
      const product = await Product.findById(id);  
  
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      res.status(200).json(product);  
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Error fetching product details", error: error.message });
    }
  };
  
  module.exports = {
    addProduct,
    updateProduct,
    getProducts,
    deleteProduct,
    getProductById,  // Make sure getProductById is correctly exported
  };
  


