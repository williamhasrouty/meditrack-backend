const crypto = require("crypto");

const {
  PORT = 3001,
  MONGODB_URI = "mongodb://127.0.0.1:27017/meditrack",
  JWT_SECRET = "dev-secret",
  NODE_ENV = "development",
  ENCRYPTION_KEY,
} = process.env;

// Generate encryption key if not provided (development only)
let finalEncryptionKey = ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  if (NODE_ENV === "production") {
    throw new Error("ENCRYPTION_KEY must be set in production");
  }
  console.warn("WARNING: Using auto-generated ENCRYPTION_KEY for development");
  finalEncryptionKey = crypto.randomBytes(32).toString("hex");
}

module.exports = {
  PORT,
  MONGODB_URI,
  JWT_SECRET,
  NODE_ENV,
  ENCRYPTION_KEY: finalEncryptionKey,
};
