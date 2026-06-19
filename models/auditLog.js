const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication actions
      "LOGIN_SUCCESS",
      "LOGIN_FAILED",
      "LOGOUT",
      "SIGNUP",
      "TOKEN_REFRESH",
      "PASSWORD_CHANGE",
      "PASSWORD_RESET_REQUEST",
      "PASSWORD_RESET_COMPLETE",
      "2FA_ENABLED",
      "2FA_DISABLED",
      "2FA_VERIFIED",
      // PHI Access actions
      "CLIENT_VIEWED",
      "CLIENT_CREATED",
      "CLIENT_UPDATED",
      "CLIENT_DELETED",
      "MEDICATION_VIEWED",
      "MEDICATION_CREATED",
      "MEDICATION_UPDATED",
      "MEDICATION_DELETED",
      "ADMINISTRATION_VIEWED",
      "ADMINISTRATION_CREATED",
      "ADMINISTRATION_UPDATED",
      "ADMINISTRATION_DELETED",
      "PRN_ADMINISTRATION_VIEWED",
      "PRN_ADMINISTRATION_CREATED",
      "PRN_ADMINISTRATION_UPDATED",
      "PRN_ADMINISTRATION_DELETED",
      // User management
      "USER_UPDATED",
      "USER_ROLE_CHANGED",
      "USER_DEACTIVATED",
      // Security events
      "ACCOUNT_LOCKED",
      "ACCOUNT_UNLOCKED",
      "UNAUTHORIZED_ACCESS_ATTEMPT",
      "SESSION_TIMEOUT",
    ],
  },
  resourceType: {
    type: String,
    enum: [
      "USER",
      "CLIENT",
      "MEDICATION",
      "ADMINISTRATION",
      "PRN_ADMINISTRATION",
      "AUTH",
    ],
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  status: {
    type: String,
    enum: ["SUCCESS", "FAILURE", "WARNING"],
    default: "SUCCESS",
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

// Index for efficient querying
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model("auditLog", auditLogSchema);
