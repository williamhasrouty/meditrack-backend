const AuditLog = require("../models/auditLog");

/**
 * Log an audit event
 * @param {Object} params - Audit log parameters
 * @param {string} params.userId - User ID performing the action
 * @param {string} params.userName - User name
 * @param {string} params.userEmail - User email
 * @param {string} params.action - Action being performed (from enum)
 * @param {string} params.resourceType - Type of resource affected
 * @param {string} params.resourceId - ID of resource affected
 * @param {Object} params.details - Additional details about the action
 * @param {string} params.ipAddress - IP address of the request
 * @param {string} params.userAgent - User agent string
 * @param {string} params.status - Status of the action (SUCCESS, FAILURE, WARNING)
 */
async function logAudit({
  userId,
  userName,
  userEmail,
  action,
  resourceType,
  resourceId,
  details = {},
  ipAddress,
  userAgent,
  status = "SUCCESS",
}) {
  try {
    await AuditLog.create({
      userId,
      userName,
      userEmail,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress,
      userAgent,
      status,
      timestamp: Date.now(),
    });
  } catch (err) {
    // Don't let audit logging failure break the application
    console.error("Audit logging failed:", err);
  }
}

/**
 * Express middleware to automatically log PHI access
 */
function auditMiddleware(action, resourceType) {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;

    // Override send to capture response status
    res.send = function (data) {
      // Log the audit event
      if (req.user) {
        const status =
          res.statusCode >= 200 && res.statusCode < 300 ? "SUCCESS" : "FAILURE";

        logAudit({
          userId: req.user._id,
          userName: req.user.name,
          userEmail: req.user.email || "unknown",
          action,
          resourceType,
          resourceId:
            req.params.clientId || req.params.medicationId || req.params.id,
          details: {
            method: req.method,
            path: req.path,
            query: req.query,
            statusCode: res.statusCode,
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get("user-agent"),
          status,
        }).catch((err) => console.error("Audit middleware error:", err));
      }

      // Call original send
      originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Log authentication events
 */
async function logAuthEvent(
  user,
  action,
  req,
  status = "SUCCESS",
  details = {},
) {
  try {
    await logAudit({
      userId: user._id || user.userId || "unknown",
      userName: user.name || "Unknown User",
      userEmail: user.email || "unknown",
      action,
      resourceType: "AUTH",
      details: {
        ...details,
        method: req.method,
        path: req.path,
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
      status,
    });
  } catch (err) {
    console.error("Auth audit logging failed:", err);
  }
}

/**
 * Get audit logs with filtering
 * @param {Object} filters - Filter criteria
 * @param {number} limit - Max number of records to return
 * @param {number} skip - Number of records to skip
 */
async function getAuditLogs(filters = {}, limit = 100, skip = 0) {
  try {
    const query = {};

    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    if (filters.resourceType) query.resourceType = filters.resourceType;
    if (filters.resourceId) query.resourceId = filters.resourceId;
    if (filters.status) query.status = filters.status;

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await AuditLog.countDocuments(query);

    return { logs, total };
  } catch (err) {
    console.error("Failed to retrieve audit logs:", err);
    throw err;
  }
}

module.exports = {
  logAudit,
  auditMiddleware,
  logAuthEvent,
  getAuditLogs,
};
