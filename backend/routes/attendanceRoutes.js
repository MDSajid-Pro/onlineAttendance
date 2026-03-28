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

    // 1. Create a prefix for the regex: e.g., "2024-03"
    // Ensuring month is 2 digits (e.g., '3' becomes '03')
    const monthPadding = month.padStart(2, '0');
    const datePrefix = `${year}-${monthPadding}`;

    // 2. Fetch all students for this course/sem to ensure every student appears in the Excel
    const students = await Student.find({ course, semester });

    // 3. Fetch all attendance records for that month using Regex
    const monthlyAttendance = await Attendance.find({
      course,
      semester,
      date: { $regex: new RegExp(`^${datePrefix}`) }
    });

    // 4. Pivot the data into a grid format
    const report = students.map(student => {
      const dailyStatus = {};
      let presentCount = 0;

      monthlyAttendance.forEach(dayDoc => {
        // In your schema, the array is called 'records'
        const studentEntry = dayDoc.records.find(
          r => r.studentId.toString() === student._id.toString()
        );

        if (studentEntry) {
          dailyStatus[dayDoc.date] = studentEntry.status; // 'present' or 'absent'
          if (studentEntry.status === 'present') presentCount++;
        }
      });

      return {
        registerNo: student.registerNo,
        fullName: student.fullName,
        attendance: dailyStatus, // e.g. {"2024-03-01": "present"}
        totalPresent: presentCount
      };
    });

    res.json(report);
  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ error: "Server crashed while generating report" });
  }
});

export default router;