const router = require("express").Router();
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  addMedication,
  updateMedication,
  deleteMedication,
} = require("../controllers/clients");
const {
  validateClientId,
  validateCreateClient,
  validateUpdateClient,
  validateAddMedication,
  validateUpdateMedication,
  validateDeleteMedication,
} = require("../middlewares/validation");

// GET /clients - get all clients for logged-in user
router.get("/", getClients);

// POST /clients - create a new client
router.post("/", validateCreateClient, createClient);

// GET /clients/:clientId - get a single client
router.get("/:clientId", validateClientId, getClientById);

// PATCH /clients/:clientId - update a client
router.patch(
  "/:clientId",
  validateClientId,
  validateUpdateClient,
  updateClient
);

// DELETE /clients/:clientId - delete a client
router.delete("/:clientId", validateClientId, deleteClient);

// POST /clients/:clientId/medications - add a medication to a client
router.post("/:clientId/medications", validateAddMedication, addMedication);

// PATCH /clients/:clientId/medications/:medicationId - update a medication
router.patch(
  "/:clientId/medications/:medicationId",
  validateUpdateMedication,
  updateMedication
);

// DELETE /clients/:clientId/medications/:medicationId - delete a medication
router.delete(
  "/:clientId/medications/:medicationId",
  validateDeleteMedication,
  deleteMedication
);

module.exports = router;
