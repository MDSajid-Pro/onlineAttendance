import express from 'express';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';

const router = express.Router();

// POST: Save or Update Attendance (Updated for Holidays)
router.post('/save', async (req, res) => {
  try {
    const { date, course, semester, isHoliday, holidayReason, attendanceRecords } = req.body;

    let records = [];

    // Only process attendance records if it's NOT a holiday
    if (!isHoliday && attendanceRecords) {
      records = attendanceRecords.map(s => ({
        studentId: s._id || s.studentId, // Support both _id (from React state) and studentId (from DB)
        fullName: s.fullName,
        registerNo: s.registerNo,
        status: s.status.toLowerCase() 
      }));
    }

    // findOneAndUpdate with Upsert handles both new records and updates
    const attendance = await Attendance.findOneAndUpdate(
      { date, course, semester },
      { 
        isHoliday: isHoliday || false,
        holidayReason: isHoliday ? holidayReason : "", 
        records 
      },
      { 
        upsert: true, 
        returnDocument: 'after', // Returns the updated document
        runValidators: true 
      }
    );

    res.status(200).json(attendance);
  } catch (error) {
    console.error("Save Error:", error);
    res.status(500).json({ message: error.message });
  }
});;

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

router.get('/report/monthly', async (req, res) => {
  try {
    const { month, year, course, semester } = req.query;

    // 1. Fetch all students for this course/semester
    const students = await Student.find({ course, semester }).sort({ registerNo: 1 });

    // 2. Fetch all attendance records for that month (including holidays)
    // Matches dates like "2026-04-01" to "2026-04-31"
    const attendanceRecords = await Attendance.find({
      course,
      semester,
      date: { $regex: `^${year}-${month.padStart(2, '0')}` }
    });

    const holidayMap = {};
    const reportData = students.map(student => {
      const studentAttendance = {};
      let totalPresent = 0;

      attendanceRecords.forEach(rec => {
        // Build the holiday map for the frontend PDF
        if (rec.isHoliday) {
          holidayMap[rec.date] = rec.holidayReason || "Holiday";
        }

        // Map individual student status
        const record = rec.records.find(r => r.studentId.toString() === student._id.toString());
        if (record) {
          studentAttendance[rec.date] = record.status;
          if (record.status === 'present') totalPresent++;
        }
      });

      return {
        _id: student._id,
        fullName: student.fullName,
        registerNo: student.registerNo,
        attendance: studentAttendance,
        totalPresent
      };
    });

    // Send both students and the holiday details
    res.status(200).json({ 
      students: reportData, 
      holidays: holidayMap 
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT: Update student details by ID
router.put('/update/:id', async (req, res) => {
  try {
    const { fullName, registerNo, course, semester } = req.body;
    
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { fullName, registerNo, course, semester },
      { new: true, runValidators: true } // Returns the modified document
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(updatedStudent);
  } catch (error) {
    // Handle duplicate register numbers
    if (error.code === 11000) {
      return res.status(400).json({ message: "Register Number already exists" });
    }
    res.status(500).json({ message: error.message });
  }
});

export default router;