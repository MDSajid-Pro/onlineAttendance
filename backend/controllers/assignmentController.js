import User from '../models/User.js';
import Assignment from '../models/Assignment.js';
import mongoose from 'mongoose';

// ==========================================
// 1. TEACHER / EMPLOYEE CONTROLLERS
// ==========================================

// GET: Fetch all teachers (for dropdowns & employee directory)
export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ 
      role: { $in: [/^teacher$/i, /^employee$/i, /^admin$/i] } 
    })
      .select('name email employeeId role')
      .sort({ name: 1 });

    res.status(200).json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ message: "Failed to fetch teachers", error: error.message });
  }
};

// PUT: Update an employee / teacher profile
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, employeeId, role, password } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid Employee ID" });
    }

    const updatePayload = {
      ...(name && { name: name.trim() }),
      ...(email && { email: email.trim().toLowerCase() }),
      ...(employeeId && { employeeId: employeeId.trim().toUpperCase() }),
      ...(role && { role })
    };

    if (password && password.trim().length >= 6) {
      updatePayload.password = password.trim();
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({
      success: true,
      message: "Employee profile updated successfully!",
      teacher: updatedUser
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE: Remove an employee and their classroom allocations
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid Employee ID" });
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Clean up all subject allocations linked to this teacher
    await Assignment.deleteMany({ teacher: id });

    res.status(200).json({ 
      success: true, 
      message: "Employee and all linked batch allocations removed successfully" 
    });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. ASSIGNMENT & ALLOCATION CONTROLLERS
// ==========================================

// POST: Assign & append students to classroom batch
export const assignStudentsToTeacher = async (req, res) => {
  try {
    const { teacherId, courseName, semester, subject, studentIds } = req.body;

    if (!teacherId || !courseName || !semester || !subject || !Array.isArray(studentIds)) {
      return res.status(400).json({ 
        success: false, 
        message: "Teacher, Course, Semester, Subject, and studentIds array are required." 
      });
    }

    const validStudentIds = studentIds
      .filter(id => mongoose.isValidObjectId(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const filter = {
      teacher: new mongoose.Types.ObjectId(teacherId),
      subject: subject.trim(),
      courseName: courseName.trim(),
      semester: semester.trim()
    };

    // $addToSet ensures existing students remain intact and newly selected students are appended
    const updatedAssignment = await Assignment.findOneAndUpdate(
      filter,
      {
        $setOnInsert: {
          teacher: new mongoose.Types.ObjectId(teacherId),
          subject: subject.trim(),
          courseName: courseName.trim(),
          semester: semester.trim()
        },
        $addToSet: {
          students: { $each: validStudentIds }
        }
      },
      { 
        returnDocument: 'after', 
        upsert: true, 
        runValidators: true,
        setDefaultsOnInsert: true 
      }
    ).populate('students', 'fullName registerNo');

    res.status(200).json({
      success: true,
      message: "Students successfully linked to batch!",
      assignment: updatedAssignment
    });
  } catch (error) {
    console.error("Assignment Linking Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET: Fetch assignments for a specific teacher
export const getTeacherAssignments = async (req, res) => {
  try {
    const { teacherId } = req.params;

    if (!mongoose.isValidObjectId(teacherId)) {
      return res.status(400).json({ success: false, message: "Invalid Teacher ID" });
    }

    const assignments = await Assignment.find({ teacher: teacherId })
      .populate('students', 'fullName registerNo email course semester')
      .populate('teacher', 'name email employeeId');

    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: "Error fetching assignments", error: error.message });
  }
};

// GET: Fetch all assignments populated with teacher and student metadata
export const getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('teacher', 'name email employeeId')
      .populate('students', 'fullName registerNo course semester')
      .sort({ createdAt: -1 });

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Failed to load assignments", error: error.message });
  }
};

// PUT: Update an existing assignment (Edit subject, course, semester, or teacher)
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId, courseName, semester, subject, studentIds } = req.body;

    const updated = await Assignment.findByIdAndUpdate(
      id,
      {
        ...(teacherId && { teacher: teacherId }),
        ...(courseName && { courseName: courseName.trim() }),
        ...(semester && { semester: semester.trim() }),
        ...(subject && { subject: subject.trim() }),
        ...(studentIds && { students: studentIds })
      },
      { returnDocument: 'after', runValidators: true }
    )
      .populate('teacher', 'name email employeeId')
      .populate('students', 'fullName registerNo course semester');

    if (!updated) {
      return res.status(404).json({ message: "Assignment allocation record not found" });
    }

    res.status(200).json({ success: true, assignment: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update assignment", error: error.message });
  }
};

// DELETE: Remove an assignment allocation
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Assignment.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.status(200).json({ success: true, message: "Assignment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete assignment", error: error.message });
  }
};