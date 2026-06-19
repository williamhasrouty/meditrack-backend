const mongoose = require("mongoose");
const { encryptFields, decryptFields } = require("../utils/encryption");

// Define PHI fields that require encryption
const ENCRYPTED_FIELDS = [
  "allergies",
  "diagnoses",
  "emergencyContacts",
  "prescribingPhysician",
  "pharmacyInfo",
  "notes",
];

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

// Update the updatedAt timestamp and encrypt sensitive fields before saving
clientSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // Encrypt PHI fields if they've been modified
  try {
    ENCRYPTED_FIELDS.forEach((field) => {
      if (this.isModified(field) && this[field]) {
        const { encrypt } = require("../utils/encryption");
        this[field] = encrypt(this[field]);
      }
    });
    next();
  } catch (err) {
    next(err);
  }
});

// Decrypt sensitive fields after retrieval
clientSchema.post("find", function (docs) {
  if (Array.isArray(docs)) {
    docs.forEach((doc) => {
      if (doc) {
        try {
          const decrypted = decryptFields(doc.toObject(), ENCRYPTED_FIELDS);
          ENCRYPTED_FIELDS.forEach((field) => {
            doc[field] = decrypted[field];
          });
        } catch (err) {
          console.error("Decryption error in post find:", err);
        }
      }
    });
  }
});

clientSchema.post("findOne", function (doc) {
  if (doc) {
    try {
      const decrypted = decryptFields(doc.toObject(), ENCRYPTED_FIELDS);
      ENCRYPTED_FIELDS.forEach((field) => {
        doc[field] = decrypted[field];
      });
    } catch (err) {
      console.error("Decryption error in post findOne:", err);
    }
  }
});

clientSchema.post("findOneAndUpdate", function (doc) {
  if (doc) {
    try {
      const decrypted = decryptFields(doc.toObject(), ENCRYPTED_FIELDS);
      ENCRYPTED_FIELDS.forEach((field) => {
        doc[field] = decrypted[field];
      });
    } catch (err) {
      console.error("Decryption error in post findOneAndUpdate:", err);
    }
  }
});

// Encrypt fields before findOneAndUpdate
clientSchema.pre("findOneAndUpdate", function (next) {
  try {
    const update = this.getUpdate();
    if (update) {
      const encrypted = encryptFields(update, ENCRYPTED_FIELDS);
      ENCRYPTED_FIELDS.forEach((field) => {
        if (encrypted[field] !== undefined) {
          update[field] = encrypted[field];
        }
      });
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("client", clientSchema);
