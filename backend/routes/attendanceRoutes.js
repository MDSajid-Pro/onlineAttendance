import express from 'express';
import Attendance from '../models/Attendance.js';

const router = express.Router();

// POST: Save or Update Attendance
router.post('/save', async (req, res) => {
  try {
    const { date, course, semester, attendanceRecords } = req.body;

    // Mapping ensure we only save what the schema needs
    const records = attendanceRecords.map(s => ({
      studentId: s._id, // Ensure this matches the _id of the student model
      fullName: s.fullName,
      registerNo: s.registerNo,
      status: s.status.toLowerCase() // Force lowercase for consistency
    }));

    const attendance = await Attendance.findOneAndUpdate(
      { date, course, semester },
      { records },
      { upsert: true, returnDocument: 'after' } // 'new: true' returns the updated doc
    );

    res.status(200).json(attendance); // Return the whole object
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Fetch attendance history
router.get('/history', async (req, res) => {
  try {
    const { date, course, semester } = req.query;
    const history = await Attendance.findOne({ date, course, semester });
    
    // If no history exists, return a standard structure instead of null
    if (!history) {
      return res.status(200).json({ records: [] });
    }
    
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: "Error fetching history" });
  }
});

export default router;