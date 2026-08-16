// routes/attendanceRoutes.js
import express from 'express';
import { submitAttendance, getAttendanceHistory, getAttendanceByDate, getMonthlyAttendanceReport } from '../controllers/attendanceController.js';

const router = express.Router();

router.post('/submit', submitAttendance);
router.get('/by-date', getAttendanceByDate);
router.get('/history/:assignmentId', getAttendanceHistory);
router.get('/monthly-report', getMonthlyAttendanceReport);

export default router;