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

// Create a new user (signup)
const createUser = (req, res, next) => {
  const { email, password, name, initials } = req.body;

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
      });
    })
    .then((user) => {
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

  User.findOne({ email })
    .select("+password")
    .then((user) => {
      if (!user) {
        throw new UnauthorizedError("Incorrect email or password");
      }

      return bcrypt.compare(password, user.password).then((matched) => {
        if (!matched) {
          throw new UnauthorizedError("Incorrect email or password");
        }

        const token = jwt.sign({ _id: user._id, role: user.role }, JWT_SECRET, {
          expiresIn: "7d",
        });

        return res.send({
          token,
          user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            initials: user.initials,
            avatar: user.avatar,
            role: user.role,
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

// Get all staff users (admin only)
const getStaffUsers = (req, res, next) => {
  User.find({ role: "staff" })
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
