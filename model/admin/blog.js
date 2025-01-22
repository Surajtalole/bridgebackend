const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String, required: true }, 
  date: { type: String, default: new Date().toISOString().split('T')[0] },
  month: { type: String, default: new Date().toLocaleString('default', { month: 'long' }) }, 
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);
