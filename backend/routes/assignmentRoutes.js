import express from 'express';
import { 
  getAllTeachers, 
  assignStudentsToTeacher, 
  getTeacherAssignments,
  getAllAssignments,
  updateAssignment,
  deleteAssignment
} from '../controllers/assignmentController.js';

const router = express.Router();

router.get('/', getAllTeachers);
router.get('/all-allocations', getAllAssignments);
router.post('/assign', assignStudentsToTeacher);
router.get('/:teacherId', getTeacherAssignments);
router.put('/allocation/:id', updateAssignment);
router.delete('/allocation/:id', deleteAssignment);

export default router;