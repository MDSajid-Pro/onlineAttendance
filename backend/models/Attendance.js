import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  date: { 
    type: String, // YYYY-MM-DD
    required: true 
  },
  course: { type: String, required: true },
  semester: { type: String, required: true },
  
  // --- NEW FIELDS ---
  isHoliday: { 
    type: Boolean, 
    default: false 
  },
  holidayReason: { 
    type: String, 
    default: "" 
  },
  // ------------------

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

// Index to prevent duplicate entries for the same day/course
attendanceSchema.index({ date: 1, course: 1, semester: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);