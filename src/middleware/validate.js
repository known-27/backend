const { body, validationResult } = require('express-validator');
const { RUNNING_SHOE_BRANDS } = require('../models/registration.model');

/**
 * Validation rules for POST /api/registrations
 * Fields: firstName, lastName, gender, dob, phone, email, currentRunningBrand
 */
const registrationValidationRules = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must not exceed 100 characters'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must not exceed 100 characters'),

  body('gender')
    .trim()
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),

  body('dob')
    .trim()
    .notEmpty()
    .withMessage('Date of birth is required')
    .matches(/^\d{2}\/\d{2}\/\d{4}$/)
    .withMessage('Date of birth must be in DD/MM/YYYY format'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+\d\s\-().]{7,20}$/)
    .withMessage('Please provide a valid phone number'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('currentRunningBrand')
    .trim()
    .notEmpty()
    .withMessage('Current running shoe brand is required')
    .isIn(RUNNING_SHOE_BRANDS)
    .withMessage(`Brand must be one of: ${RUNNING_SHOE_BRANDS.join(', ')}`),

  body('deviceId')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Device ID must not exceed 100 characters'),
];

/**
 * Middleware to collect express-validator results and return 422 if any errors.
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { registrationValidationRules, handleValidation };
