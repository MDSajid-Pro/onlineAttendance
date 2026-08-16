import Student from '../models/Student.js';

// GET: Fetch all students
export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST: Add new student
export const addStudent = async (req, res) => {
  try {
    const { fullName, registerNo, course, semester } = req.body;

    if (!fullName || !registerNo || !course || !semester) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const formattedRegNo = registerNo.trim().toUpperCase();

    const existingStudent = await Student.findOne({ registerNo: formattedRegNo });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: `Register No '${formattedRegNo}' already exists.` });
    }

    const student = await Student.create({
      fullName: fullName.trim(),
      registerNo: formattedRegNo,
      course: course.trim(),
      semester: semester.trim()
    });

    res.status(201).json({ success: true, message: "Student enrolled successfully!", student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT: Update student details
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, registerNo, course, semester } = req.body;

    const formattedRegNo = registerNo ? registerNo.trim().toUpperCase() : undefined;

    // Check if register number is taken by another student
    if (formattedRegNo) {
      const duplicate = await Student.findOne({ registerNo: formattedRegNo, _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({ success: false, message: "Register Number is already in use by another student." });
      }
    }

    const student = await Student.findByIdAndUpdate(
      id,
      {
        ...(fullName && { fullName: fullName.trim() }),
        ...(formattedRegNo && { registerNo: formattedRegNo }),
        ...(course && { course: course.trim() }),
        ...(semester && { semester: semester.trim() })
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.status(200).json({ success: true, message: "Student updated successfully!", student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE: Delete student
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Student.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.status(200).json({ success: true, message: "Student removed from registry" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};