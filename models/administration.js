const mongoose = require('mongoose');

const administrationSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'client',
    required: true,
  },
  medicationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  month: {
    type: Number,
    required: true,
    min: 0,
    max: 11,
  },
  year: {
    type: Number,
    required: true,
  },
  records: {
    type: Map,
    of: String,
    default: {},
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
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

// Create compound index for efficient queries
administrationSchema.index({ clientId: 1, month: 1, year: 1 });

// Update the updatedAt timestamp before saving
administrationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('administration', administrationSchema);
