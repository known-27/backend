const express = require('express');
const router  = express.Router();

const {
  createRegistration,
  getAllRegistrations,
  getRegistrationById,
  deleteRegistration,
  exportExcel,
} = require('../controllers/registration.controller');

const {
  registrationValidationRules,
  handleValidation,
} = require('../middleware/validate');

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: /export/excel must be declared BEFORE /:id so Express does not
// treat the string "export" as an ObjectId and hit the wrong handler.
// ─────────────────────────────────────────────────────────────────────────────

// GET  /api/registrations/export/excel  → download .xlsx
router.get('/export/excel', exportExcel);

// POST /api/registrations  → create registration
router.post('/', registrationValidationRules, handleValidation, createRegistration);

// GET  /api/registrations  → get all (paginated)
router.get('/', getAllRegistrations);

// GET  /api/registrations/:id  → get one
router.get('/:id', getRegistrationById);

// DELETE /api/registrations/:id  → delete one
router.delete('/:id', deleteRegistration);

module.exports = router;
