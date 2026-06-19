const mongoose = require("mongoose");
const { encrypt, decryptFields } = require("../utils/encryption");

// Define PHI fields that require encryption
const ENCRYPTED_FIELDS = ["reason", "notes"];

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

// Encrypt sensitive fields before saving
prnAdministrationSchema.pre("save", function (next) {
  try {
    ENCRYPTED_FIELDS.forEach((field) => {
      if (this.isModified(field) && this[field]) {
        this[field] = encrypt(this[field]);
      }
    });
    next();
  } catch (err) {
    next(err);
  }
});

// Decrypt sensitive fields after retrieval
prnAdministrationSchema.post("find", function (docs) {
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

prnAdministrationSchema.post("findOne", function (doc) {
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

module.exports = mongoose.model("prnAdministration", prnAdministrationSchema);
