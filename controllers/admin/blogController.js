const Blog = require('../../model/admin/blog');
const uploadBlogsToFTP = require('../ftpController/blogsToFTP');
exports.addBlog = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    if (!title || !description || !category || !req.file) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const fileName = req.file.originalname;
    const imageUrl = await uploadBlogsToFTP(req.file.buffer, fileName);

    const date = new Date().toISOString().split('T')[0];
    const month = new Date().toLocaleString('default', { month: 'long' });

    const blog = new Blog({ title, description, category, image: imageUrl, date, month });
    await blog.save();

    res.status(201).json({ message: 'Blog created successfully', blog });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBlogs = async (req, res) => {
    try {
      const blogs = await Blog.find().sort({ createdAt: -1 });
      res.status(200).json(blogs);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      res.status(500).json({ message: 'Failed to fetch blogs', error });
    }
  };

exports.togglePublish = async (req, res) => {
    try {
      const blogId = req.params.id;
      const blog = await Blog.findById(blogId);
      
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }
  
      blog.isPublished = !blog.isPublished;  
      await blog.save();
  
      res.json({ message: 'Blog updated', blog });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  exports.deleteBlog = async (req, res) => {
    try {
      const blogId = req.params.id;
      const blog = await Blog.findByIdAndDelete(blogId);
      
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }
  
      res.json({ message: 'Blog deleted' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  exports.updateBlog = async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, category } = req.body;
  
      let imageUrl;
      
      // Check if a new file is uploaded
      if (req.file) {
        const fileName = req.file.originalname;
        imageUrl = await uploadBlogsToFTP(req.file.buffer, fileName); // Upload new image to FTP
      }
  
      // Prepare the update object dynamically
      const updateData = {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(imageUrl && { image: imageUrl }), // Only include image if a new one was uploaded
      };
  
      const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, { new: true });
  
      if (!updatedBlog) {
        return res.status(404).json({ message: 'Blog not found' });
      }
  
      res.status(200).json({ message: 'Blog updated successfully', blog: updatedBlog });
    } catch (error) {
      console.error('Error updating blog:', error);
      res.status(500).json({ message: 'Error updating blog' });
    }
  };
  
