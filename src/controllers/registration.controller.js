const { Registration } = require('../models/registration.model');
const { generateExcel } = require('../utils/excelExport');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/registrations
// ─────────────────────────────────────────────────────────────────────────────
const createRegistration = async (req, res, next) => {
  try {
    const { firstName, lastName, gender, dob, phone, email, currentRunningBrand, deviceId, submittedAt } = req.body;

    const registration = await Registration.create({
      firstName:           firstName.trim(),
      lastName:            lastName.trim(),
      gender,
      dob:                 dob.trim(),
      phone:               phone.trim(),
      email:               email.trim().toLowerCase(),
      currentRunningBrand: currentRunningBrand.trim(),
      deviceId:            deviceId ? deviceId.trim() : '',
      submittedAt:         submittedAt ? new Date(submittedAt) : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Registration created successfully.',
      data: registration,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate registration detected.'
      });
    }
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/registrations?page=1&limit=20
// ─────────────────────────────────────────────────────────────────────────────
const getAllRegistrations = async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page,  10) || 1,  1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip  = (page - 1) * limit;

    const [registrations, total] = await Promise.all([
      Registration.find().sort({ submittedAt: -1 }).skip(skip).limit(limit).lean(),
      Registration.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: registrations,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/registrations/:id
// ─────────────────────────────────────────────────────────────────────────────
const getRegistrationById = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id).lean();
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }
    res.status(200).json({ success: true, data: registration });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/registrations/:id
// ─────────────────────────────────────────────────────────────────────────────
const deleteRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findByIdAndDelete(req.params.id).lean();
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }
    res.status(200).json({ success: true, message: 'Registration deleted successfully.', data: { id: registration._id } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/registrations/export/excel
// ─────────────────────────────────────────────────────────────────────────────
const exportExcel = async (req, res, next) => {
  try {
    const registrations = await Registration.find().sort({ submittedAt: -1 }).lean();
    const buffer  = await generateExcel(registrations);
    const dateStr = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="registrations_${dateStr}.xlsx"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

module.exports = { createRegistration, getAllRegistrations, getRegistrationById, deleteRegistration, exportExcel };
