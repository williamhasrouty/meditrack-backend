const router = require("express").Router();
const { createUser, login } = require("../controllers/users");
const { validateSignup, validateSignin } = require("../middlewares/validation");
const auth = require("../middlewares/auth");
const clientsRouter = require("./clients");
const administrationsRouter = require("./administrations");
const prnAdministrationsRouter = require("./prnAdministrations");
const usersRouter = require("./users");

// Public routes
router.post("/signup", validateSignup, createUser);
router.post("/signin", validateSignin, login);

// Protected routes (require authentication)
router.use("/clients", auth, clientsRouter);
router.use("/administrations", auth, administrationsRouter);
router.use("/prn-administrations", auth, prnAdministrationsRouter);
router.use("/users", auth, usersRouter);

module.exports = router;
