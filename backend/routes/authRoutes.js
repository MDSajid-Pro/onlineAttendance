import express from 'express';
import { registerEmployee } from '../controllers/authController.js';
import { teacherLogin } from '../controllers/adminController.js';

const router = express.Router();

// POST http://localhost:8080/api/auth/login
router.post('/login', teacherLogin);

// Route configuration
router.post('/register-employee', registerEmployee);

export default router;