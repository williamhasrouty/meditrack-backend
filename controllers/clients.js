const Client = require("../models/client");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require("../errors/errors");

// Get all clients for the logged-in user
const getClients = (req, res, next) => {
  // Admins see all clients they own, staff see clients assigned to them
  const query =
    req.user.role === "admin"
      ? { owner: req.user._id }
      : { assignedTo: req.user._id };

  Client.find(query)
    .populate("assignedTo", "name email initials")
    .then((clients) => res.send(clients))
    .catch(next);
};

// Get a single client by ID
const getClientById = (req, res, next) => {
  // Admins can access their own clients, staff can access clients assigned to them
  const query =
    req.user.role === "admin"
      ? { _id: req.params.clientId, owner: req.user._id }
      : { _id: req.params.clientId, assignedTo: req.user._id };

  Client.findOne(query)
    .populate("assignedTo", "name email initials")
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
  const { name, region } = req.body;

  Client.create({
    name,
    region,
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
  const { name, region } = req.body;

  Client.findOneAndUpdate(
    { _id: req.params.clientId, owner: req.user._id },
    { name, region },
    { new: true, runValidators: true },
  )
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
  const { name, times } = req.body;

  Client.findOne({ _id: req.params.clientId, owner: req.user._id })
    .then((client) => {
      if (!client) {
        throw new NotFoundError("Client not found");
      }

      client.medications.push({ name, times });
      return client.save();
    })
    .then((client) => res.status(201).send(client))
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

// Update a medication
const updateMedication = (req, res, next) => {
  const { name, times } = req.body;

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
      medication.times = times;
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
  const { staffId } = req.body;

  // Only admins can assign clients
  if (req.user.role !== "admin") {
    return next(new ForbiddenError("Only admins can assign clients"));
  }

  Client.findOneAndUpdate(
    { _id: req.params.clientId, owner: req.user._id },
    { assignedTo: staffId || null },
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
