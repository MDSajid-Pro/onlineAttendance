import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  date: { 
    type: String, // Storing as YYYY-MM-DD for easier filtering
    required: true 
  },
  course: { type: String, required: true },
  semester: { type: String, required: true },
  records: [
    {
      studentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Student', 
        required: true 
      },
      fullName: String,
      registerNo: String,
      status: { 
        type: String, 
        enum: ['present', 'absent'], 
        required: true 
      }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

// Prevent multiple attendance records for the same course/semester on the same day
attendanceSchema.index({ date: 1, course: 1, semester: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);