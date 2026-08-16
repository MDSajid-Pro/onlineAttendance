// models/Assignment.js
import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    teacher: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    courseName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    semester: { 
      type: String, 
      required: true, 
      trim: true 
    },
    subject: { 
      type: String, 
      required: true, 
      trim: true 
    },
    students: [
      { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Student' 
      }
    ]
  }, 
  { timestamps: true }
);

// New 4-field unique compound index
assignmentSchema.index({ teacher: 1, subject: 1, courseName: 1, semester: 1 }, { unique: true });

export default mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);