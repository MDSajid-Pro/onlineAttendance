// backend/models/Attendance.js
import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late'],
      default: 'Present'
    }
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true
    },
    courseName: {
      type: String,
      required: true,
      trim: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: String,
      required: true
    },
    records: [attendanceRecordSchema]
  },
  { 
    timestamps: true,
    strict: true 
  }
);

// Prevent duplicate attendance for the same assignment on the same date
attendanceSchema.index({ assignment: 1, date: 1 }, { unique: true });

// Prevent Mongoose model recompilation errors
export default mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);