import User from '../models/User.js';
import Assignment from '../models/Assignment.js';

// GET: Fetch all teachers (for dropdowns)
export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ 
      role: { $in: [/^teacher$/i, /^employee$/i] } 
    })
      .select('name email employeeId role') // Only select necessary fields
      .sort({ name: 1 });

    res.status(200).json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ message: "Failed to fetch teachers", error: error.message });
  }
};

export const assignStudentsToTeacher = async (req, res) => {
  try {
    const { teacherId, courseName, semester, subject, studentIds } = req.body;

    if (!teacherId || !courseName || !semester || !subject || !Array.isArray(studentIds)) {
      return res.status(400).json({ 
        success: false, 
        message: "teacherId, courseName, semester, subject, and studentIds array are required." 
      });
    }

    const filter = {
      teacher: teacherId,
      subject: subject.trim(),
      courseName: courseName.trim(),
      semester: semester.trim()
    };

    const update = {
      teacher: teacherId,
      subject: subject.trim(),
      courseName: courseName.trim(),
      semester: semester.trim(),
      students: studentIds
    };

    const assignment = await Assignment.findOneAndUpdate(
      filter,
      { $set: update },
      { 
        returnDocument: 'after', 
        upsert: true, 
        runValidators: true,
        setDefaultsOnInsert: true 
      }
    );

    res.status(200).json({ 
      success: true, 
      message: "Classroom and student allocation saved successfully!", 
      assignment 
    });
  } catch (error) {
    console.error("Assignment Allocation Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET: Fetch assignments for a specific teacher
export const getTeacherAssignments = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const assignments = await Assignment.find({ teacher: teacherId })
      .populate('students', 'fullName registerNo email course semester');

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
        ...(courseName && { courseName }),
        ...(semester && { semester }),
        ...(subject && { subject }),
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