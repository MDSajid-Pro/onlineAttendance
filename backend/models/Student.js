import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  registerNo: { type: String, required: true, unique: true },
  semester: { 
    type: String, 
    required: true, 
    enum: ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester'] 
  },
  course: { 
    type: String, 
    required: true, 
    enum: ['B.Sc', 'BCA', 'B.Com', 'B.A'] 
  },
  enrollmentDate: { type: Date, default: Date.now }
});

export default mongoose.model('Student', studentSchema);