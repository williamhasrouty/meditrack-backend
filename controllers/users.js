const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} = require("../errors/errors");
const { JWT_SECRET } = require("../config/config");
const { logAuthEvent, logAudit } = require("../utils/auditLogger");
const {
  validatePasswordComplexity,
  passwordContainsUserInfo,
} = require("../utils/passwordValidator");

// Account lockout configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
const PASSWORD_HISTORY_COUNT = 5; // Remember last 5 passwords

// Create a new user (signup)
const createUser = (req, res, next) => {
  const { email, password, name, initials } = req.body;

  // Validate password complexity
  const passwordValidation = validatePasswordComplexity(password);
  if (!passwordValidation.isValid) {
    return next(
      new BadRequestError(
        `Password does not meet requirements: ${passwordValidation.errors.join(", ")}`,
      ),
    );
  }

  // Check if password contains user info
  if (passwordContainsUserInfo(password, { name, email })) {
    return next(
      new BadRequestError(
        "Password should not contain your name or email address",
      ),
    );
  }

  let hashedPassword;

  bcrypt
    .hash(password, 10)
    .then((hash) => {
      hashedPassword = hash;
      // Check if this is the first user
      return User.countDocuments({});
    })
    .then((count) => {
      // First user is automatically an admin
      const role = count === 0 ? "admin" : "staff";

      return User.create({
        email,
        password: hashedPassword,
        name,
        initials: initials ? initials.toUpperCase() : undefined,
        role,
        passwordHistory: [hashedPassword],
        passwordChangedAt: Date.now(),
      });
    })
    .then((user) => {
      // Log successful signup
      logAuthEvent(user, "SIGNUP", req, "SUCCESS", {
        role: user.role,
      }).catch((err) => console.error("Audit log error:", err));

      res.status(201).send({
        _id: user._id,
        email: user.email,
        name: user.name,
        initials: user.initials,
        avatar: user.avatar,
        role: user.role,
      });
    })
    .catch((err) => {
      if (err.code === 11000) {
        next(new ConflictError("Email already exists"));
      } else if (err.name === "ValidationError") {
        next(new BadRequestError("Invalid data provided"));
      } else {
        next(err);
      }
    });
};

// Login user
const login = (req, res, next) => {
  const { email, password } = req.body;

  let foundUser;

  User.findOne({ email })
    .select("+password")
    .then((user) => {
      if (!user) {
        // Log failed login attempt
        logAuthEvent(
          { email, name: "Unknown", _id: "unknown" },
          "LOGIN_FAILED",
          req,
          "FAILURE",
          { reason: "User not found" },
        ).catch((err) => console.error("Audit log error:", err));

        throw new UnauthorizedError("Incorrect email or password");
      }

      foundUser = user;

      // Check if account is locked
      if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        const minutesRemaining = Math.ceil(
          (user.accountLockedUntil - new Date()) / 60000,
        );

        logAuthEvent(user, "LOGIN_FAILED", req, "FAILURE", {
          reason: "Account locked",
        }).catch((err) => console.error("Audit log error:", err));

        throw new UnauthorizedError(
          `Account is locked due to too many failed login attempts. Please try again in ${minutesRemaining} minutes.`,
        );
      }

      return bcrypt.compare(password, user.password);
    })
    .then((matched) => {
      if (!matched) {
        // Increment failed login attempts
        foundUser.failedLoginAttempts += 1;

        // Lock account if max attempts exceeded
        if (foundUser.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
          foundUser.accountLockedUntil = new Date(
            Date.now() + LOCKOUT_DURATION,
          );

          logAudit({
            userId: foundUser._id,
            userName: foundUser.name,
            userEmail: foundUser.email,
            action: "ACCOUNT_LOCKED",
            resourceType: "AUTH",
            details: {
              reason: "Too many failed login attempts",
              attempts: foundUser.failedLoginAttempts,
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get("user-agent"),
            status: "WARNING",
          }).catch((err) => console.error("Audit log error:", err));
        }

        // Save failed attempt count
        return foundUser.save().then(() => {
          // Log failed login attempt
          logAuthEvent(foundUser, "LOGIN_FAILED", req, "FAILURE", {
            reason: "Invalid password",
            attempts: foundUser.failedLoginAttempts,
          }).catch((err) => console.error("Audit log error:", err));

          throw new UnauthorizedError("Incorrect email or password");
        });
      }

      // Reset failed login attempts on successful login
      foundUser.failedLoginAttempts = 0;
      foundUser.accountLockedUntil = null;
      foundUser.lastLoginAt = new Date();

      return foundUser.save().then(() => {
        const token = jwt.sign(
          {
            _id: foundUser._id,
            role: foundUser.role,
            name: foundUser.name,
            initials: foundUser.initials,
          },
          JWT_SECRET,
          {
            expiresIn: "7d",
          },
        );

        // Log successful login
        logAuthEvent(foundUser, "LOGIN_SUCCESS", req, "SUCCESS").catch((err) =>
          console.error("Audit log error:", err),
        );

        return res.send({
          token,
          user: {
            _id: foundUser._id,
            email: foundUser.email,
            name: foundUser.name,
            initials: foundUser.initials,
            avatar: foundUser.avatar,
            role: foundUser.role,
          },
        });
      });
    })
    .catch(next);
};

// Get current user info
const getCurrentUser = (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        throw new NotFoundError("User not found");
      }
      res.send({
        _id: user._id,
        email: user.email,
        name: user.name,
        initials: user.initials,
        avatar: user.avatar,
        role: user.role,
      });
    })
    .catch(next);
};

// Update user profile
const updateUser = (req, res, next) => {
  const { name, avatar, initials } = req.body;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (avatar !== undefined) updateData.avatar = avatar || null; // Allow clearing avatar
  if (initials !== undefined) updateData.initials = initials.toUpperCase();

  User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true,
  })
    .then((user) => {
      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Log profile update
      logAudit({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        action: "USER_UPDATED",
        resourceType: "USER",
        resourceId: user._id,
        details: { updatedFields: Object.keys(updateData) },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("user-agent"),
        status: "SUCCESS",
      }).catch((err) => console.error("Audit log error:", err));

      res.send({
        _id: user._id,
        email: user.email,
        name: user.name,
        initials: user.initials,
        avatar: user.avatar,
        role: user.role,
      });
    })
    .catch((err) => {
      if (err.name === "ValidationError") {
        next(new BadRequestError("Invalid data provided"));
      } else {
        next(err);
      }
    });
};

// Update user role (admin only)
const updateUserRole = (req, res, next) => {
  const { userId } = req.params;
  const { role } = req.body;

  User.findByIdAndUpdate(userId, { role }, { new: true, runValidators: true })
    .then((user) => {
      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Log role change
      logAudit({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email || "unknown",
        action: "USER_ROLE_CHANGED",
        resourceType: "USER",
        resourceId: user._id,
        details: { newRole: role, targetUser: user.email },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("user-agent"),
        status: "SUCCESS",
      }).catch((err) => console.error("Audit log error:", err));

      res.send({
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    })
    .catch((err) => {
      if (err.name === "ValidationError") {
        next(new BadRequestError("Invalid role provided"));
      } else if (err.name === "CastError") {
        next(new BadRequestError("Invalid user ID"));
      } else {
        next(err);
      }
    });
};

// Get all users (staff and admin) for name mapping
const getStaffUsers = (req, res, next) => {
  User.find({ role: { $in: ["staff", "admin"] } })
    .select("name email initials")
    .then((users) => res.send(users))
    .catch(next);
};

module.exports = {
  createUser,
  login,
  getCurrentUser,
  updateUser,
  updateUserRole,
  getStaffUsers,
};
