const router = require("express").Router();
const {
  getCurrentUser,
  updateUser,
  updateUserRole,
  getStaffUsers,
} = require("../controllers/users");
const {
  validateUpdateUser,
  validateUpdateUserRole,
} = require("../middlewares/validation");
const { requireAdmin } = require("../middlewares/authorization");

// GET /users/me - get current user info
router.get("/me", getCurrentUser);

// PATCH /users/me - update current user profile
router.patch("/me", validateUpdateUser, updateUser);

// GET /users/staff - get all staff users (admin only)
router.get("/staff", requireAdmin, getStaffUsers);

// PATCH /users/:userId/role - update user role (admin only)
router.patch(
  "/:userId/role",
  requireAdmin,
  validateUpdateUserRole,
  updateUserRole,
);

module.exports = router;
