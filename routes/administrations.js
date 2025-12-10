const router = require("express").Router();
const {
  getAdministrations,
  saveAdministrations,
  deleteAdministrations,
} = require("../controllers/administrations");
const {
  validateGetAdministrations,
  validateSaveAdministrations,
  validateDeleteAdministrations,
} = require("../middlewares/validation");

// GET /administrations/:clientId - get administration records
router.get("/:clientId", validateGetAdministrations, getAdministrations);

// POST /administrations/:clientId - save administration records
router.post("/:clientId", validateSaveAdministrations, saveAdministrations);

// DELETE /administrations/:clientId - delete administration records
router.delete(
  "/:clientId",
  validateDeleteAdministrations,
  deleteAdministrations
);

module.exports = router;
