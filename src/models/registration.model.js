const mongoose = require('mongoose');

const RUNNING_SHOE_BRANDS = [
  'ASICS',
  'ADIDAS',
  'DECATHLON',
  'HOKA',
  'MIZUNO',
  'NIKE',
  'ON',
  'PUMA',
  'SAUCONY',
  'UNDERARMOR',
  'OTHERS',
];

const registrationSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: {
        values: ['Male', 'Female', 'Other'],
        message: 'Gender must be Male, Female, or Other',
      },
    },
    dob: {
      type: String,
      required: [true, 'Date of birth is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
    },
    currentRunningBrand: {
      type: String,
      required: [true, 'Current running shoe brand is required'],
      enum: {
        values: RUNNING_SHOE_BRANDS,
        message: 'Please select a valid running shoe brand',
      },
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    deviceId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

registrationSchema.index({ email: 1 }, { unique: true });
registrationSchema.index({ phone: 1 }, { unique: true });
registrationSchema.index({ submittedAt: -1 });

const Registration = mongoose.model('Registration', registrationSchema, 'registrations');

module.exports = { Registration, RUNNING_SHOE_BRANDS };
