import express from 'express';
import { 
  getAllTeachers, 
  updateEmployee,
  deleteEmployee,
  assignStudentsToTeacher, 
  getTeacherAssignments,
  getAllAssignments,
  updateAssignment,
  deleteAssignment
} from '../controllers/assignmentController.js';

const router = express.Router();

// --- Faculty & Staff Endpoints ---
router.get('/', getAllTeachers);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

// --- Class Allocation Endpoints ---
router.get('/all-allocations', getAllAssignments);
router.post('/assign', assignStudentsToTeacher);
router.get('/:teacherId', getTeacherAssignments);
router.put('/allocation/:id', updateAssignment);
router.delete('/allocation/:id', deleteAssignment);

export default router;