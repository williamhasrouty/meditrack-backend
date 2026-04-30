const PRNAdministration = require("../models/prnAdministration");
const Client = require("../models/client");
const NotFoundError = require("../errors/NotFoundError");
const ForbiddenError = require("../errors/ForbiddenError");

// Get PRN administrations for a client
const getPRNAdministrations = (req, res, next) => {
  const { clientId } = req.params;

  // First check if client exists and user has access
  Client.findById(clientId)
    .then((client) => {
      if (!client) {
        throw new NotFoundError("Client not found");
      }

      // Check authorization
      const isAdmin = req.user.role === "admin";
      const isAssignedStaff =
        client.assignedTo?.toString() === req.user._id.toString() ||
        client.assignedStaff?.some(
          (staffId) => staffId.toString() === req.user._id.toString(),
        );

      if (!isAdmin && !isAssignedStaff) {
        throw new ForbiddenError("You do not have access to this client");
      }

      // Get PRN administrations for this client
      return PRNAdministration.find({ clientId })
        .populate("administeredBy", "name initials")
        .sort({ administeredAt: -1 }); // Most recent first
    })
    .then((administrations) => {
      res.status(200).json(administrations);
    })
    .catch(next);
};

// Create a new PRN administration
const createPRNAdministration = (req, res, next) => {
  const {
    clientId,
    medicationId,
    medicationName,
    reason,
    notes,
    administeredAt,
  } = req.body;

  console.log("createPRNAdministration received:", {
    clientId,
    medicationId,
    medicationName,
    reason,
    notes,
    administeredAt,
  });

  console.log("req.user contents:", {
    _id: req.user._id,
    role: req.user.role,
    name: req.user.name,
    initials: req.user.initials,
  });

  // First check if client exists and user has access
  Client.findById(clientId)
    .then((client) => {
      if (!client) {
        throw new NotFoundError("Client not found");
      }

      console.log("Client found:", client._id);

      // Check authorization
      const isAdmin = req.user.role === "admin";
      const isAssignedStaff =
        client.assignedTo?.toString() === req.user._id.toString() ||
        client.assignedStaff?.some(
          (staffId) => staffId.toString() === req.user._id.toString(),
        );

      console.log("Authorization:", { isAdmin, isAssignedStaff });

      if (!isAdmin && !isAssignedStaff) {
        throw new ForbiddenError("You do not have access to this client");
      }

      // Verify medication exists and is PRN
      const medication = client.medications.id(medicationId);
      console.log(
        "Medication found:",
        medication ? medication.name : "NOT FOUND",
      );

      if (!medication) {
        throw new NotFoundError("Medication not found");
      }

      console.log("Medication isPRN:", medication.isPRN);

      if (!medication.isPRN) {
        throw new ForbiddenError("This medication is not marked as PRN");
      }

      // Generate staff initials
      let staffInitials = req.user.initials;
      if (!staffInitials && req.user.name) {
        staffInitials = req.user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase();
      }
      if (!staffInitials) {
        staffInitials = "??"; // Fallback if no name or initials
      }

      // Create PRN administration
      const administrationData = {
        clientId,
        medicationId,
        medicationName: medicationName || medication.name,
        administeredAt: administeredAt || Date.now(),
        administeredBy: req.user._id,
        staffInitials,
        reason: reason || "",
        notes: notes || "",
        owner: client.owner,
      };

      console.log("Creating PRN administration:", administrationData);

      return PRNAdministration.create(administrationData);
    })
    .then((administration) => {
      console.log("PRN administration created:", administration._id);
      return PRNAdministration.findById(administration._id).populate(
        "administeredBy",
        "name initials",
      );
    })
    .then((populatedAdministration) => {
      console.log("Returning populated administration");
      res.status(201).json(populatedAdministration);
    })
    .catch((err) => {
      console.error("createPRNAdministration error:", err);
      next(err);
    });
};

// Delete a PRN administration
const deletePRNAdministration = (req, res, next) => {
  const { id } = req.params;

  PRNAdministration.findById(id)
    .then((administration) => {
      if (!administration) {
        throw new NotFoundError("Administration record not found");
      }

      // Check if client exists and user has access
      return Client.findById(administration.clientId).then((client) => {
        if (!client) {
          throw new NotFoundError("Client not found");
        }

        // Check authorization
        const isAdmin = req.user.role === "admin";
        const isAssignedStaff =
          client.assignedTo?.toString() === req.user._id.toString() ||
          client.assignedStaff?.some(
            (staffId) => staffId.toString() === req.user._id.toString(),
          );

        if (!isAdmin && !isAssignedStaff) {
          throw new ForbiddenError(
            "You do not have access to delete this record",
          );
        }

        return PRNAdministration.findByIdAndDelete(id);
      });
    })
    .then((deletedAdministration) => {
      res.status(200).json({
        message: "PRN administration deleted successfully",
        deletedAdministration,
      });
    })
    .catch(next);
};

module.exports = {
  getPRNAdministrations,
  createPRNAdministration,
  deletePRNAdministration,
};
