const Client = require("../models/client");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require("../errors/errors");

// Get all clients for the logged-in user
const getClients = (req, res, next) => {
  // Admins see all clients they own, staff see clients assigned to them (either way)
  const query =
    req.user.role === "admin"
      ? { owner: req.user._id }
      : {
          $or: [{ assignedTo: req.user._id }, { assignedStaff: req.user._id }],
        };

  Client.find(query)
    .populate("assignedTo", "name email initials")
    .populate("assignedStaff", "name email initials")
    .then((clients) => res.send(clients))
    .catch(next);
};

// Get a single client by ID
const getClientById = (req, res, next) => {
  // Admins can access their own clients, staff can access clients assigned to them (either way)
  const query =
    req.user.role === "admin"
      ? { _id: req.params.clientId, owner: req.user._id }
      : {
          _id: req.params.clientId,
          $or: [{ assignedTo: req.user._id }, { assignedStaff: req.user._id }],
        };

  Client.findOne(query)
    .populate("assignedTo", "name email initials")
    .populate("assignedStaff", "name email initials")
    .then((client) => {
      if (!client) {
        throw new NotFoundError("Client not found");
      }
      res.send(client);
    })
    .catch((err) => {
      if (err.name === "CastError") {
        next(new BadRequestError("Invalid client ID"));
      } else {
        next(err);
      }
    });
};

// Create a new client
const createClient = (req, res, next) => {
  const {
    name,
    region,
    imageUrl,
    dateOfBirth,
    allergies,
    diagnoses,
    emergencyContacts,
    prescribingPhysician,
    pharmacyInfo,
    notes,
    isActive,
  } = req.body;

  Client.create({
    name,
    region,
    imageUrl,
    dateOfBirth,
    allergies,
    diagnoses,
    emergencyContacts,
    prescribingPhysician,
    pharmacyInfo,
    notes,
    isActive,
    owner: req.user._id,
    medications: [],
  })
    .then((client) => res.status(201).send(client))
    .catch((err) => {
      if (err.name === "ValidationError") {
        next(new BadRequestError("Invalid data provided"));
      } else {
        next(err);
      }
    });
};

// Update a client
const updateClient = (req, res, next) => {
  const {
    name,
    region,
    imageUrl,
    dateOfBirth,
    allergies,
    diagnoses,
    emergencyContacts,
    prescribingPhysician,
    pharmacyInfo,
    notes,
    isActive,
  } = req.body;

  Client.findOneAndUpdate(
    { _id: req.params.clientId, owner: req.user._id },
    {
      name,
      region,
      imageUrl,
      dateOfBirth,
      allergies,
      diagnoses,
      emergencyContacts,
      prescribingPhysician,
      pharmacyInfo,
      notes,
      isActive,
    },
    { new: true, runValidators: true },
  )
    .populate("assignedTo", "name email initials")
    .then((client) => {
      if (!client) {
        throw new NotFoundError("Client not found");
      }
      res.send(client);
    })
    .catch((err) => {
      if (err.name === "ValidationError") {
        next(new BadRequestError("Invalid data provided"));
      } else if (err.name === "CastError") {
        next(new BadRequestError("Invalid client ID"));
      } else {
        next(err);
      }
    });
};

// Delete a client
const deleteClient = (req, res, next) => {
  Client.findOneAndDelete({ _id: req.params.clientId, owner: req.user._id })
    .then((client) => {
      if (!client) {
        throw new NotFoundError("Client not found");
      }
      res.send({ message: "Client deleted successfully" });
    })
    .catch((err) => {
      if (err.name === "CastError") {
        next(new BadRequestError("Invalid client ID"));
      } else {
        next(err);
      }
    });
};

// Add a medication to a client
const addMedication = (req, res, next) => {
  const { name, times, isPRN, directions } = req.body;
  console.log("addMedication received:", { name, times, isPRN, directions });

  Client.findOne({ _id: req.params.clientId, owner: req.user._id })
    .then((client) => {
      if (!client) {
        throw new NotFoundError("Client not found");
      }

      client.medications.push({
        name,
        times: times || [],
        isPRN: isPRN || false,
        directions: directions || "",
      });
      return client.save();
    })
    .then((client) => res.status(201).send(client))
    .catch((err) => {
      console.log("addMedication error:", err.name, err.message);
      if (err.name === "ValidationError") {
        next(new BadRequestError("Invalid data provided"));
      } else if (err.name === "CastError") {
        next(new BadRequestError("Invalid client ID"));
      } else {
        next(err);
      }
    });
};

// Update a medication
const updateMedication = (req, res, next) => {
  const { name, times, isPRN, directions } = req.body;

  Client.findOne({ _id: req.params.clientId, owner: req.user._id })
    .then((client) => {
      if (!client) {
        throw new NotFoundError("Client not found");
      }

      const medication = client.medications.id(req.params.medicationId);
      if (!medication) {
        throw new NotFoundError("Medication not found");
      }

      medication.name = name;
      medication.times = times || [];
      if (isPRN !== undefined) {
        medication.isPRN = isPRN;
      }
      if (directions !== undefined) {
        medication.directions = directions;
      }
      return client.save();
    })
    .then((client) => res.send(client))
    .catch((err) => {
      if (err.name === "ValidationError") {
        next(new BadRequestError("Invalid data provided"));
      } else if (err.name === "CastError") {
        next(new BadRequestError("Invalid ID"));
      } else {
        next(err);
      }
    });
};

// Delete a medication
const deleteMedication = (req, res, next) => {
  Client.findOne({ _id: req.params.clientId, owner: req.user._id })
    .then((client) => {
      if (!client) {
        throw new NotFoundError("Client not found");
      }

      client.medications.pull(req.params.medicationId);
      return client.save();
    })
    .then((client) => res.send(client))
    .catch((err) => {
      if (err.name === "CastError") {
        next(new BadRequestError("Invalid ID"));
      } else {
        next(err);
      }
    });
};

// Assign a client to a staff member (admin only)
const assignClient = (req, res, next) => {
  const { staffId, staffIds } = req.body;

  // Only admins can assign clients
  if (req.user.role !== "admin") {
    return next(new ForbiddenError("Only admins can assign clients"));
  }

  // Support both single (staffId) and multiple (staffIds) assignment
  const updateData = {};

  if (staffIds !== undefined) {
    // Multiple staff assignment
    updateData.assignedStaff = Array.isArray(staffIds) ? staffIds : [];
  } else if (staffId !== undefined) {
    // Single staff assignment (backward compatibility)
    updateData.assignedTo = staffId || null;
    // Also add to assignedStaff array if provided
    if (staffId) {
      updateData.assignedStaff = [staffId];
    }
  }

  Client.findOneAndUpdate(
    { _id: req.params.clientId, owner: req.user._id },
    updateData,
    { new: true, runValidators: true },
  )
    .populate("assignedTo", "name email initials")
    .populate("assignedStaff", "name email initials")
    .then((client) => {
      if (!client) {
        throw new NotFoundError("Client not found");
      }
      res.send(client);
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
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  addMedication,
  updateMedication,
  deleteMedication,
  assignClient,
};
