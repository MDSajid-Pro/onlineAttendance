import express from "express";
import connectDB from './config/db.js';
import cors from "cors";
import 'dotenv/config'
import adminRouter from "./routes/adminRoute.js";
import studentRoutes from './routes/studentRoutes.js'
import attendanceRoutes from './routes/attendanceRoutes.js';

const app = express();

connectDB()

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/teacher", adminRouter);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));