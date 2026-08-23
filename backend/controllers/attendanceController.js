// controllers/attendanceController.js
import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';

export const submitAttendance = async (req, res) => {
  try {
    const { teacherId, assignmentId, courseName, semester, subject, date, records } = req.body;

    if (!teacherId || !assignmentId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ 
        message: "teacherId, assignmentId, date, and records are required." 
      });
    }

    const filter = {
      assignment: new mongoose.Types.ObjectId(assignmentId),
      date: date.trim()
    };

    const update = {
      teacher: new mongoose.Types.ObjectId(teacherId),
      assignment: new mongoose.Types.ObjectId(assignmentId),
      courseName: courseName?.trim() || "Untitled Course",
      semester: semester?.trim() || "I Semester",
      subject: subject?.trim() || "Untitled Subject",
      records: records.filter(r => r.student && mongoose.Types.ObjectId.isValid(r.student))
    };

    const attendanceDoc = await Attendance.findOneAndUpdate(
      filter,
      { $set: update },
      { 
        returnDocument: 'after',
        upsert: true, 
        runValidators: true,
        setDefaultsOnInsert: true 
      }
    );

    return res.status(200).json({
      success: true,
      message: "Attendance recorded successfully!",
      data: attendanceDoc
    });

  } catch (error) {
    console.error("Detailed Error in submitAttendance:", error);
    return res.status(500).json({ 
      message: "Failed to record attendance", 
      error: error.message 
    });
  }
};

// GET: Supports /history?date=YYYY-MM-DD or /history/:assignmentId
export const getAttendanceHistory = async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId || req.query.assignmentId;
    const { date, courseName, semester } = req.query;

    const query = {};

    if (assignmentId && mongoose.Types.ObjectId.isValid(assignmentId)) {
      query.assignment = new mongoose.Types.ObjectId(assignmentId);
    }
    if (date) {
      query.date = date.trim();
    }
    if (courseName) {
      query.courseName = courseName.trim();
    }
    if (semester) {
      query.semester = semester.trim();
    }

    const history = await Attendance.find(query)
      .populate('teacher', 'name email employeeId')
      .populate('records.student', 'fullName name registerNo rollNumber parentPhone phone course semester')
      .sort({ date: -1, createdAt: -1 });

    // Returns array or wraps in object so both frontend variants work seamlessly
    res.status(200).json({
      success: true,
      attendances: history
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ message: "Failed to fetch attendance history", error: error.message });
  }
};

// GET: Fetch attendance records for a specific assignment and date
export const getAttendanceByDate = async (req, res) => {
  try {
    const { assignmentId, date } = req.query;

    if (!assignmentId || !date) {
      return res.status(400).json({ message: "assignmentId and date are required" });
    }

    const attendance = await Attendance.findOne({
      assignment: assignmentId,
      date: date.trim()
    });

    if (attendance) {
      return res.status(200).json({
        exists: true,
        records: attendance.records,
        updatedAt: attendance.updatedAt
      });
    }

    return res.status(200).json({ exists: false, records: [] });
  } catch (error) {
    console.error("Error fetching date attendance:", error);
    res.status(500).json({ message: "Failed to fetch date attendance", error: error.message });
  }
};

// GET /api/attendance/monthly-report?assignmentId=xxx&year=2026&month=08
export const getMonthlyAttendanceReport = async (req, res) => {
  try {
    const { assignmentId, month, year } = req.query;

    if (!assignmentId || !month || !year) {
      return res.status(400).json({ success: false, message: "assignmentId, month, and year are required" });
    }

    const monthStr = String(month).padStart(2, '0');
    const datePrefixRegex = new RegExp(`^${year}-${monthStr}`);

    const logs = await Attendance.find({
      assignment: assignmentId,
      date: { $regex: datePrefixRegex }
    }).populate('records.student', 'fullName registerNo parentPhone course semester');

    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error("Monthly report error:", error);
    res.status(500).json({ success: false, message: "Failed to generate monthly report" });
  }
};