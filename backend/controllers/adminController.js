import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Teacher / Employee Database Login
export const teacherLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Email and password are required" });
    }

    // 1. Find teacher in database
    const teacher = await User.findOne({ email: email.toLowerCase().trim() });
    if (!teacher) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    // 2. Validate role
    if (teacher.role !== 'teacher' && teacher.role !== 'employee') {
      return res.json({ success: false, message: "Access denied. Not a faculty account." });
    }

    // 3. Compare hashed password
    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { id: teacher._id, role: teacher.role, email: teacher.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Send back user details needed for the dashboard
    res.json({
      success: true,
      token,
      user: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        role: teacher.role,
        employeeId: teacher.employeeId
      }
    });

  } catch (error) {
    console.error("Teacher Login Error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email !== process.env.ADMIN_EMAIL) {
      return res.json({ success: false, message: 'Invalid Email' });
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.json({ success: false, message: 'Invalid Password' });
    }
    
    const token = jwt.sign(
      { email, role: 'admin' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        name: 'Administrator',
        email,
        role: 'admin'
      }
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};