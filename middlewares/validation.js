const { Joi, celebrate } = require('celebrate');

// Validation for user signup
const validateSignup = celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
    name: Joi.string().required().min(2).max(30),
    initials: Joi.string().min(2).max(3),
  }),
});

// Validation for user signin
const validateSignin = celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
});

// Validation for updating user profile
const validateUpdateUser = celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30),
    avatar: Joi.string().uri(),
  }),
});

// Validation for client ID parameter
const validateClientId = celebrate({
  params: Joi.object().keys({
    clientId: Joi.string().hex().length(24),
  }),
});

// Validation for creating a client
const validateCreateClient = celebrate({
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(50),
  }),
});

// Validation for updating a client
const validateUpdateClient = celebrate({
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(50),
  }),
});

// Validation for adding medication
const validateAddMedication = celebrate({
  params: Joi.object().keys({
    clientId: Joi.string().hex().length(24),
  }),
  body: Joi.object().keys({
    name: Joi.string().required(),
    times: Joi.array().items(Joi.string()).min(1).required(),
  }),
});

// Validation for updating medication
const validateUpdateMedication = celebrate({
  params: Joi.object().keys({
    clientId: Joi.string().hex().length(24),
    medicationId: Joi.string().hex().length(24),
  }),
  body: Joi.object().keys({
    name: Joi.string().required(),
    times: Joi.array().items(Joi.string()).min(1).required(),
  }),
});

// Validation for deleting medication
const validateDeleteMedication = celebrate({
  params: Joi.object().keys({
    clientId: Joi.string().hex().length(24),
    medicationId: Joi.string().hex().length(24),
  }),
});

// Validation for getting administrations
const validateGetAdministrations = celebrate({
  params: Joi.object().keys({
    clientId: Joi.string().hex().length(24),
  }),
  query: Joi.object().keys({
    month: Joi.number().min(0).max(11).required(),
    year: Joi.number().min(2000).max(2100).required(),
  }),
});

// Validation for saving administrations
const validateSaveAdministrations = celebrate({
  params: Joi.object().keys({
    clientId: Joi.string().hex().length(24),
  }),
  body: Joi.object().keys({
    month: Joi.number().min(0).max(11).required(),
    year: Joi.number().min(2000).max(2100).required(),
    medicationId: Joi.string().hex().length(24).required(),
    records: Joi.object().required(),
  }),
});

// Validation for deleting administrations
const validateDeleteAdministrations = celebrate({
  params: Joi.object().keys({
    clientId: Joi.string().hex().length(24),
  }),
  query: Joi.object().keys({
    month: Joi.number().min(0).max(11).required(),
    year: Joi.number().min(2000).max(2100).required(),
  }),
});

module.exports = {
  validateSignup,
  validateSignin,
  validateUpdateUser,
  validateClientId,
  validateCreateClient,
  validateUpdateClient,
  validateAddMedication,
  validateUpdateMedication,
  validateDeleteMedication,
  validateGetAdministrations,
  validateSaveAdministrations,
  validateDeleteAdministrations,
};
