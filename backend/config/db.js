import mongoose from "mongoose";

const cleanLegacyIndexes = async () => {
  try {
    // 1. Clean 'assignments' collection
    const assignmentCollection = mongoose.connection.collection('assignments');
    const assignmentIndexes = await assignmentCollection.indexes();
    if (assignmentIndexes.some(idx => idx.name === 'teacher_1_subject_1_courseName_1')) {
      await assignmentCollection.dropIndex('teacher_1_subject_1_courseName_1');
      console.log('✅ Dropped obsolete index: teacher_1_subject_1_courseName_1');
    }

    // 2. Clean 'attendances' collection
    const attendanceCollection = mongoose.connection.collection('attendances');
    const attendanceIndexes = await attendanceCollection.indexes();
    if (attendanceIndexes.some(idx => idx.name === 'date_1_course_1_semester_1')) {
      await attendanceCollection.dropIndex('date_1_course_1_semester_1');
      console.log('✅ Dropped obsolete index: date_1_course_1_semester_1');
    }
  } catch (err) {
    console.log('Index cleanup note:', err.message);
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/online-attendence`);
    console.log("Database Connected .....");
    await cleanLegacyIndexes();
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;