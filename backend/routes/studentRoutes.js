import express from 'express';
import { 
  addStudent, 
  getAllStudents, 
  updateStudent, 
  deleteStudent 
} from '../controllers/studentController.js';

const router = express.Router();

router.get('/all', getAllStudents);
router.post('/add', addStudent);
router.put('/update/:id', updateStudent);
router.delete('/delete/:id', deleteStudent);

export default router;