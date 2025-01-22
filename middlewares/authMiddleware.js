const jwt = require('jsonwebtoken');
const Academy = require('../model/Coach');
const Student = require('../model/Student');  // Import the Student model

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }

    console.log("Token", token);

    const JWT_SECRET = process.env.JWT_SECRET || 'shdjdcnjs3453';
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded Token:', decoded);  // Check the decoded token data
    
    const { userId, role } = decoded;
    console.log('UserId:', userId, 'Role:', role);  // Check userId and role

    let user;
    if (role === 'student') {
      user = await Student.findById(userId);
    } else if (role === 'academy' || role === 'coach' || role === 'admin') {
      user = await Academy.findById(userId);
    }

    console.log('User from DB:', user);  // Check if user is found in the DB

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = { _id: userId, role };
    next();
  } catch (error) {
    console.error('AuthMiddleware error:', error);
    res.status(401).json({ message: "Unauthorized", error: error.message });
  }
};


module.exports = authMiddleware;
