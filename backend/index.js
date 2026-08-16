import express from "express";
import connectDB from './config/db.js';
import cors from "cors";
import 'dotenv/config'
import adminRouter from "./routes/adminRoute.js";
import studentRoutes from './routes/studentRoutes.js'
import attendanceRoutes from './routes/attendanceRoutes.js';
import authRoutes from './routes/authRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';

const app = express();

connectDB()

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// API Routes
app.use('/api/admin', adminRouter);
app.use('/api/teacher', assignmentRoutes);     // <-- Mounted to /api/teacher
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/auth', authRoutes);
// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));