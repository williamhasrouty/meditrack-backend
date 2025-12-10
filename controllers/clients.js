const Client = require("../models/client");
const { BadRequestError, NotFoundError } = require("../errors/errors");

// Get all clients for the logged-in user
const getClients = (req, res, next) => {
  Client.find({ owner: req.user._id })
    .then((clients) => res.send(clients))
    .catch(next);
};

// Get a single client by ID
const getClientById = (req, res, next) => {
  Client.findOne({ _id: req.params.clientId, owner: req.user._id })
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
  const { name } = req.body;

  Client.create({
    name,
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
  const { name } = req.body;

  Client.findOneAndUpdate(
    { _id: req.params.clientId, owner: req.user._id },
    { name },
    { new: true, runValidators: true }
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

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  addMedication,
  updateMedication,
  deleteMedication,
};
