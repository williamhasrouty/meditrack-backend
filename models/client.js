const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  isPRN: {
    type: Boolean,
    default: false,
  },
  times: {
    type: [String],
    required: function () {
      return !this.isPRN;
    },
    validate: {
      validator: function (v) {
        if (this.isPRN) return true; // PRN medications don't need times
        return v && v.length > 0;
      },
      message:
        "At least one administration time is required for scheduled medications",
    },
  },
  directions: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
  },
  region: {
    type: String,
    required: true,
    enum: ["GGRC", "RCEB", "ACRC", "RCOC", "SDRC"],
  },
  imageUrl: {
    type: String,
    default: "",
    validate: {
      validator: function (v) {
        if (!v) return true; // Allow empty strings
        // Basic URL validation
        return /^https?:\/\/.+/.test(v);
      },
      message: "Please provide a valid URL",
    },
  },
  dateOfBirth: {
    type: Date,
    default: null,
  },
  allergies: {
    type: String,
    default: "",
  },
  diagnoses: {
    type: String,
    default: "",
  },
  emergencyContacts: {
    type: String,
    default: "",
  },
  prescribingPhysician: {
    type: String,
    default: "",
  },
  pharmacyInfo: {
    type: String,
    default: "",
  },
  notes: {
    type: String,
    default: "",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  medications: [medicationSchema],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  assignedStaff: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
clientSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("client", clientSchema);
