const Administration = require("../models/administration");
const Client = require("../models/client");
const { BadRequestError, NotFoundError } = require("../errors/errors");

// Get administration records for a client/month/year
const getAdministrations = (req, res, next) => {
  const { clientId } = req.params;
  const { month, year } = req.query;

  // Verify the client is accessible to the user (owner for admin, assignedTo for staff)
  const query =
    req.user.role === "admin"
      ? { _id: clientId, owner: req.user._id }
      : { _id: clientId, assignedTo: req.user._id };

  Client.findOne(query)
    .then((client) => {
      if (!client) {
        throw new NotFoundError("Client not found");
      }

      // Find ALL administration records owned by the client's owner
      return Administration.find({
        clientId,
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        owner: client.owner,
      });
    })
    .then((administrations) => {
      if (!administrations || administrations.length === 0) {
        console.log(
          "GetAdmin - No administration found, returning empty records",
        );
        return res.send({ records: {} });
      }

      // Merge all records from all medications into one object
      const allRecords = {};
      administrations.forEach((administration) => {
        if (administration.records) {
          const records = Object.fromEntries(administration.records);
          Object.assign(allRecords, records);
        }
      });

      console.log("GetAdmin - Returning records:", {
        clientId,
        month,
        year,
        medicationCount: administrations.length,
        recordsCount: Object.keys(allRecords).length,
        records: allRecords,
      });
      return res.send({ records: allRecords });
    })
    .catch((err) => {
      if (err.name === "CastError") {
        next(new BadRequestError("Invalid client ID"));
      } else {
        next(err);
      }
    });
};

// Save administration records
const saveAdministrations = (req, res, next) => {
  const { clientId } = req.params;
  const { month, year, medicationId, records } = req.body;

  console.log("SaveAdmin - User:", {
    userId: req.user._id,
    role: req.user.role,
    name: req.user.name,
    initials: req.user.initials,
  });
  console.log("SaveAdmin - Records received:", records);

  // Verify the client is accessible to the user (owner for admin, assignedTo for staff)
  const query =
    req.user.role === "admin"
      ? { _id: clientId, owner: req.user._id }
      : { _id: clientId, assignedTo: req.user._id };

  Client.findOne(query)
    .then((client) => {
      if (!client) {
        throw new NotFoundError("Client not found");
      }

      // Save administration records under the client's owner
      return Administration.findOneAndUpdate(
        {
          clientId,
          medicationId,
          month: parseInt(month, 10),
          year: parseInt(year, 10),
          owner: client.owner,
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
    .then((administration) => {
      const savedRecords = administration.records
        ? Object.fromEntries(administration.records)
        : {};
      console.log("Administration saved successfully:", {
        id: administration._id,
        clientId: administration.clientId,
        medicationId: administration.medicationId,
        recordsCount: Object.keys(savedRecords).length,
        savedRecords: savedRecords,
      });
      return res.send(administration);
    })
    .catch((err) => {
      console.error("Error saving administration:", err);
      if (err.name === "ValidationError") {
        next(new BadRequestError("Invalid data provided"));
      } else if (err.name === "CastError") {
        next(new BadRequestError("Invalid ID"));
      } else {
        next(err);
      }
    });
};

// Delete administration records
const deleteAdministrations = (req, res, next) => {
  const { clientId } = req.params;
  const { month, year } = req.query;

  // Verify the client is accessible to the user (owner for admin, assignedTo for staff)
  const query =
    req.user.role === "admin"
      ? { _id: clientId, owner: req.user._id }
      : { _id: clientId, assignedTo: req.user._id };

  Client.findOne(query)
    .then((client) => {
      if (!client) {
        throw new NotFoundError("Client not found");
      }

      // Delete administration records owned by the client's owner
      return Administration.findOneAndDelete({
        clientId,
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        owner: client.owner,
      });
    })
    .then((administration) => {
      if (!administration) {
        throw new NotFoundError("Administration records not found");
      }
      res.send({ message: "Administration records deleted successfully" });
    })
    .catch((err) => {
      if (err.name === "CastError") {
        next(new BadRequestError("Invalid ID"));
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
