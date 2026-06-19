const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v) => validator.isEmail(v),
      message: "Invalid email format",
    },
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
  },
  initials: {
    type: String,
    minlength: 2,
    maxlength: 3,
    uppercase: true,
  },
  avatar: {
    type: String,
    validate: {
      validator: (v) => !v || validator.isURL(v),
      message: "Invalid URL format",
    },
  },
  role: {
    type: String,
    enum: ["staff", "admin"],
    default: "staff",
  },
  // Password policy fields
  passwordHistory: {
    type: [String],
    select: false,
    default: [],
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now,
  },
  // Account lockout fields
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  accountLockedUntil: {
    type: Date,
    default: null,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  // 2FA fields
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    select: false,
  },
  twoFactorBackupCodes: {
    type: [String],
    select: false,
  },
  // Password reset fields
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
});

module.exports = mongoose.model("user", userSchema);
