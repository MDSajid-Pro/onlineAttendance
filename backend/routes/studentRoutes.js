import express from 'express';
import Student from '../models/Student.js'; // Must include the .mjs extension!

const router = express.Router();

// POST: Add Student
router.post('/add', async (req, res) => {
  try {
    const { fullName, registerNo, semester, course } = req.body;

    const newStudent = new Student({ fullName, registerNo, semester, course });
    await newStudent.save();

    res.status(201).json({ message: "Student enrolled successfully!" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Register Number already exists!" });
    }
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// GET: All Students
router.get('/all', async (req, res) => {
  try {
    const students = await Student.find().sort({ enrollmentDate: -1 });
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: "Fetch failed" });
  }
});

// UPDATE: Edit student details
router.put('/update/:id', async (req, res) => {
  try {
    const { fullName, registerNo, semester, course } = req.body;
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { fullName, registerNo, semester, course },
      { new: true } // Returns the modified document
    );
    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
});

// DELETE: Remove student
router.delete('/delete/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// GET: Filter Students by Course and Semester
router.get('/filter', async (req, res) => {
  try {
    const { course, semester } = req.query; // Extracts ?course=BCA&semester=1st...
    
    // Create a query object based on what was sent
    let query = {};
    if (course) query.course = course;
    if (semester) query.semester = semester;

    const students = await Student.find(query).sort({ registerNo: 1 });
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: "Filtering failed", error: error.message });
  }
});

export default router;