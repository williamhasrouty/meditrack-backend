const mongoose = require("mongoose");

const prnAdministrationSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "client",
    required: true,
  },
  medicationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  medicationName: {
    type: String,
    required: true,
  },
  administeredAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  administeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  staffInitials: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    default: "",
  },
  notes: {
    type: String,
    default: "",
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index for efficient queries
prnAdministrationSchema.index({
  clientId: 1,
  medicationId: 1,
  administeredAt: -1,
});

module.exports = mongoose.model("prnAdministration", prnAdministrationSchema);
