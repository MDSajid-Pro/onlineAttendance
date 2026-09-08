import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Holiday title is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    type: {
      type: String,
      enum: ['National', 'Gazetted', 'Academic', 'Institutional', 'Restricted'],
      default: 'Institutional',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Holiday', holidaySchema);