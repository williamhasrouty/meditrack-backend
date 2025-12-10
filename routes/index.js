const router = require("express").Router();
const { createUser, login } = require("../controllers/users");
const { validateSignup, validateSignin } = require("../middlewares/validation");

// Signup route
router.post("/signup", validateSignup, createUser);

// Signin route
router.post("/signin", validateSignin, login);

module.exports = router;
