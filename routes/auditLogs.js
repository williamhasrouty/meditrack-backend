const router = require("express").Router();
const { getAuditLogsController } = require("../controllers/auditLogs");
const { requireAdmin } = require("../middlewares/authorization");

// GET /audit-logs - Get audit logs (admin only)
router.get("/", requireAdmin, getAuditLogsController);

module.exports = router;
