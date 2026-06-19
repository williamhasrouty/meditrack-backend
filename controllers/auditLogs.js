const { getAuditLogs } = require("../utils/auditLogger");
const { BadRequestError } = require("../errors/errors");

// Get audit logs (admin only)
const getAuditLogsController = async (req, res, next) => {
  try {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      status,
      startDate,
      endDate,
      limit = 100,
      skip = 0,
    } = req.query;

    const filters = {};
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (resourceType) filters.resourceType = resourceType;
    if (resourceId) filters.resourceId = resourceId;
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const parsedLimit = parseInt(limit, 10);
    const parsedSkip = parseInt(skip, 10);

    if (parsedLimit > 1000) {
      throw new BadRequestError("Limit cannot exceed 1000");
    }

    const result = await getAuditLogs(filters, parsedLimit, parsedSkip);

    res.send(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAuditLogsController,
};
