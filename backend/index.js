import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import teacherRoutes from "./routes/assignmentRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import adminRouter from "./routes/adminRoute.js";

dotenv.config();
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// 1. Guard middleware: Ensures DB is connected before processing requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Connection Middleware Failure:", error);
    res.status(500).json({ success: false, message: "Database connection failed", error: error.message });
  }
});

// 2. Health & Static Routes
app.get(["/favicon.ico", "/favicon.png"], (req, res) => res.status(204).end());
app.get("/", (req, res) => res.status(200).send("API is running"));

// 3. API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRouter);
app.use("/api/teacher", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);

// Local development listener
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;