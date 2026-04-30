const router = require("express").Router();
const auth = require("../middlewares/auth");
const {
  getPRNAdministrations,
  createPRNAdministration,
  deletePRNAdministration,
} = require("../controllers/prnAdministrations");
const {
  validateCreatePRNAdministration,
  validatePRNAdministrationId,
  validateClientId,
} = require("../middlewares/validation");

// Get PRN administrations for a client
router.get("/:clientId", auth, validateClientId, getPRNAdministrations);

// Create a new PRN administration
router.post(
  "/",
  auth,
  validateCreatePRNAdministration,
  createPRNAdministration,
);

// Delete a PRN administration
router.delete(
  "/:id",
  auth,
  validatePRNAdministrationId,
  deletePRNAdministration,
);

module.exports = router;
