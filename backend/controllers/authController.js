import User from '../models/User.js';

export const registerEmployee = async (req, res) => {
  try {
    const { name, email, password, employeeId, role } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    // Check if user already exists
    const queryConditions = [{ email }];
    if (employeeId) queryConditions.push({ employeeId });

    const existingUser = await User.findOne({ $or: queryConditions });
    if (existingUser) {
      return res.status(400).json({ message: "Employee ID or Email already exists." });
    }

    const newEmployee = new User({ 
      name, 
      email, 
      password, 
      employeeId, 
      role: role || 'employee' 
    });

    await newEmployee.save();

    return res.status(201).json({ message: "Employee account created successfully!" });
  } catch (error) {
    console.error("Register Employee Error:", error);

    // Handle MongoDB duplicate key index error directly
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email or Employee ID already in use." });
    }

    return res.status(500).json({ message: "Server error", error: error.message });
  }
};