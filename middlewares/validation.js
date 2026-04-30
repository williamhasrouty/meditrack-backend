const { Joi, celebrate } = require("celebrate");

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
    avatar: Joi.string().uri().allow(""),
    initials: Joi.string().min(2).max(3),
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
    region: Joi.string()
      .required()
      .valid("GGRC", "RCEB", "ACRC", "RCOC", "SDRC"),
    imageUrl: Joi.string().uri().allow(""),
    dateOfBirth: Joi.date().allow(null, ""),
    allergies: Joi.string().allow(""),
    diagnoses: Joi.string().allow(""),
    emergencyContacts: Joi.string().allow(""),
    prescribingPhysician: Joi.string().allow(""),
    pharmacyInfo: Joi.string().allow(""),
    notes: Joi.string().allow(""),
    isActive: Joi.boolean(),
  }),
});

// Validation for updating a client
const validateUpdateClient = celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(50),
    region: Joi.string().valid("GGRC", "RCEB", "ACRC", "RCOC", "SDRC"),
    imageUrl: Joi.string().uri().allow(""),
    dateOfBirth: Joi.date().allow(null, ""),
    allergies: Joi.string().allow(""),
    diagnoses: Joi.string().allow(""),
    emergencyContacts: Joi.string().allow(""),
    prescribingPhysician: Joi.string().allow(""),
    pharmacyInfo: Joi.string().allow(""),
    notes: Joi.string().allow(""),
    isActive: Joi.boolean(),
  }),
});

// Validation for adding medication
const validateAddMedication = celebrate({
  params: Joi.object().keys({
    clientId: Joi.string().hex().length(24),
  }),
  body: Joi.object().keys({
    name: Joi.string().required(),
    isPRN: Joi.boolean().optional(),
    times: Joi.array().items(Joi.string()).optional(),
    directions: Joi.string().allow("").max(500).optional(),
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
    isPRN: Joi.boolean().optional(),
    times: Joi.array().items(Joi.string()).optional(),
    directions: Joi.string().allow("").max(500).optional(),
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

// Validation for updating user role
const validateUpdateUserRole = celebrate({
  params: Joi.object().keys({
    userId: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object().keys({
    role: Joi.string().valid("staff", "admin").required(),
  }),
});

// Validation for assigning client to staff
const validateAssignClient = celebrate({
  params: Joi.object().keys({
    clientId: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object().keys({
    staffId: Joi.string().hex().length(24).allow(null, ""),
    staffIds: Joi.array().items(Joi.string().hex().length(24)),
  }),
});

// Validation for creating PRN administration
const validateCreatePRNAdministration = celebrate({
  body: Joi.object().keys({
    clientId: Joi.string().hex().length(24).required(),
    medicationId: Joi.string().hex().length(24).required(),
    medicationName: Joi.string(),
    administeredAt: Joi.date(),
    reason: Joi.string().allow(""),
    notes: Joi.string().allow(""),
  }),
});

// Validation for PRN administration ID parameter
const validatePRNAdministrationId = celebrate({
  params: Joi.object().keys({
    id: Joi.string().hex().length(24).required(),
  }),
});

module.exports = {
  validateSignup,
  validateSignin,
  validateUpdateUser,
  validateUpdateUserRole,
  validateClientId,
  validateCreateClient,
  validateUpdateClient,
  validateAddMedication,
  validateUpdateMedication,
  validateDeleteMedication,
  validateGetAdministrations,
  validateSaveAdministrations,
  validateDeleteAdministrations,
  validateAssignClient,
  validateCreatePRNAdministration,
  validatePRNAdministrationId,
};
