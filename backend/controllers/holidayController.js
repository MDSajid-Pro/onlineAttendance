import Holiday from '../models/Holiday.js';

// @desc    Get all holidays (sorted by startDate ascending)
// @route   GET /api/holidays
export const getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ startDate: 1 });
    res.status(200).json({ success: true, count: holidays.length, data: holidays });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new holiday
// @route   POST /api/holidays
export const createHoliday = async (req, res) => {
  try {
    const { title, startDate, endDate, type, description } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Please provide title, start date, and end date' });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'End date cannot be earlier than start date' });
    }

    const holiday = await Holiday.create({
      title,
      startDate,
      endDate,
      type,
      description,
      createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, data: holiday });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update holiday
// @route   PUT /api/holidays/:id
export const updateHoliday = async (req, res) => {
  try {
    const { title, startDate, endDate, type, description } = req.body;

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'End date cannot be earlier than start date' });
    }

    const holiday = await Holiday.findByIdAndUpdate(
      req.params.id,
      { title, startDate, endDate, type, description },
      { new: true, runValidators: true }
    );

    if (!holiday) {
      return res.status(404).json({ success: false, message: 'Holiday not found' });
    }

    res.status(200).json({ success: true, data: holiday });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete holiday
// @route   DELETE /api/holidays/:id
export const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);

    if (!holiday) {
      return res.status(404).json({ success: false, message: 'Holiday not found' });
    }

    res.status(200).json({ success: true, message: 'Holiday deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};