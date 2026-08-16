import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, indexesCleaned: false };
}

const cleanLegacyIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    // 1. Clean 'assignments' collection
    const assignmentCollection = db.collection('assignments');
    const assignmentIndexes = await assignmentCollection.indexes();
    if (assignmentIndexes.some(idx => idx.name === 'teacher_1_subject_1_courseName_1')) {
      await assignmentCollection.dropIndex('teacher_1_subject_1_courseName_1');
      console.log('✅ Dropped obsolete index: teacher_1_subject_1_courseName_1');
    }

    // 2. Clean 'attendances' collection
    const attendanceCollection = db.collection('attendances');
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
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // Enable Mongoose command buffering so queries wait for connection to complete
    mongoose.set('bufferCommands', true);

    const mongoUri = process.env.MONGODB_URI.includes('online-attendence')
      ? process.env.MONGODB_URI
      : `${process.env.MONGODB_URI}/online-attendence`;

    cached.promise = mongoose
      .connect(mongoUri)
      .then(async (mongooseInstance) => {
        console.log("Database Connected .....");

        if (!cached.indexesCleaned) {
          await cleanLegacyIndexes();
          cached.indexesCleaned = true;
        }

        return mongooseInstance;
      })
      .catch((error) => {
        console.error("Database connection error:", error.message);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

export default connectDB;