const { ForbiddenError } = require('../errors/errors');

// Middleware to check if user has admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }
  return next();
};

module.exports = { requireAdmin };
