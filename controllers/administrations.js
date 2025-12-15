const Administration = require('../models/administration');
const Client = require('../models/client');
const { BadRequestError, NotFoundError } = require('../errors/errors');

// Get administration records for a client/month/year
const getAdministrations = (req, res, next) => {
  const { clientId } = req.params;
  const { month, year } = req.query;

  // Verify the client belongs to the user
  Client.findOne({ _id: clientId, owner: req.user._id })
    .then((client) => {
      if (!client) {
        throw new NotFoundError('Client not found');
      }

      return Administration.findOne({
        clientId,
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        owner: req.user._id,
      });
    })
    .then((administration) => {
      if (!administration) {
        return res.send({ records: {} });
      }
      return res.send({ records: administration.records });
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequestError('Invalid client ID'));
      } else {
        next(err);
      }
    });
};

// Save administration records
const saveAdministrations = (req, res, next) => {
  const { clientId } = req.params;
  const {
    month, year, medicationId, records,
  } = req.body;

  // Verify the client belongs to the user
  Client.findOne({ _id: clientId, owner: req.user._id })
    .then((client) => {
      if (!client) {
        throw new NotFoundError('Client not found');
      }

      return Administration.findOneAndUpdate(
        {
          clientId,
          medicationId,
          month: parseInt(month, 10),
          year: parseInt(year, 10),
          owner: req.user._id,
        },
        {
          records,
          updatedAt: Date.now(),
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        },
      );
    })
    .then((administration) => res.send(administration))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequestError('Invalid data provided'));
      } else if (err.name === 'CastError') {
        next(new BadRequestError('Invalid ID'));
      } else {
        next(err);
      }
    });
};

// Delete administration records
const deleteAdministrations = (req, res, next) => {
  const { clientId } = req.params;
  const { month, year } = req.query;

  Administration.findOneAndDelete({
    clientId,
    month: parseInt(month, 10),
    year: parseInt(year, 10),
    owner: req.user._id,
  })
    .then((administration) => {
      if (!administration) {
        throw new NotFoundError('Administration records not found');
      }
      res.send({ message: 'Administration records deleted successfully' });
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequestError('Invalid ID'));
      } else {
        next(err);
      }
    });
};

module.exports = {
  getAdministrations,
  saveAdministrations,
  deleteAdministrations,
};
