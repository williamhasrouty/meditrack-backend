const router = require('express').Router();
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  addMedication,
  updateMedication,
  deleteMedication,
} = require('../controllers/clients');
const {
  validateClientId,
  validateCreateClient,
  validateUpdateClient,
  validateAddMedication,
  validateUpdateMedication,
  validateDeleteMedication,
} = require('../middlewares/validation');
const { requireAdmin } = require('../middlewares/authorization');

// GET /clients - get all clients for logged-in user
router.get('/', getClients);

// POST /clients - create a new client (admin only)
router.post('/', requireAdmin, validateCreateClient, createClient);

// GET /clients/:clientId - get a single client
router.get('/:clientId', validateClientId, getClientById);

// PATCH /clients/:clientId - update a client (admin only)
router.patch(
  '/:clientId',
  requireAdmin,
  validateClientId,
  validateUpdateClient,
  updateClient,
);

// DELETE /clients/:clientId - delete a client (admin only)
router.delete('/:clientId', requireAdmin, validateClientId, deleteClient);

// POST /clients/:clientId/medications - add a medication to a client (admin only)
router.post(
  '/:clientId/medications',
  requireAdmin,
  validateAddMedication,
  addMedication,
);

// PATCH /clients/:clientId/medications/:medicationId - update a medication (admin only)
router.patch(
  '/:clientId/medications/:medicationId',
  requireAdmin,
  validateUpdateMedication,
  updateMedication,
);

// DELETE /clients/:clientId/medications/:medicationId - delete a medication (admin only)
router.delete(
  '/:clientId/medications/:medicationId',
  requireAdmin,
  validateDeleteMedication,
  deleteMedication,
);

module.exports = router;
