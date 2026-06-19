const crypto = require("crypto");
const { ENCRYPTION_KEY } = require("../config/config");

// Encryption configuration
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // For GCM mode
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

// Get encryption key from config
const getEncryptionKey = () => {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is required");
  }
  return ENCRYPTION_KEY;
};

/**
 * Derive a key from the master key using PBKDF2
 * @param {string} masterKey - Master encryption key
 * @param {Buffer} salt - Salt for key derivation
 * @returns {Buffer} - Derived key
 */
function deriveKey(masterKey, salt) {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, 32, "sha512");
}

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in hex format
 */
function encrypt(text) {
  if (!text || text === "") return text;

  try {
    const masterKey = getEncryptionKey();
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(masterKey, salt);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(String(text), "utf8"),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    // Combine salt + iv + tag + encrypted data
    const result = Buffer.concat([salt, iv, tag, encrypted]);

    return result.toString("hex");
  } catch (err) {
    console.error("Encryption error:", err);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt encrypted data
 * @param {string} encryptedHex - Encrypted text in hex format
 * @returns {string} - Decrypted plain text
 */
function decrypt(encryptedHex) {
  if (!encryptedHex || encryptedHex === "") return encryptedHex;

  try {
    const masterKey = getEncryptionKey();
    const encrypted = Buffer.from(encryptedHex, "hex");

    // Extract salt, IV, tag, and encrypted data
    const salt = encrypted.subarray(0, SALT_LENGTH);
    const iv = encrypted.subarray(SALT_LENGTH, TAG_POSITION);
    const tag = encrypted.subarray(TAG_POSITION, ENCRYPTED_POSITION);
    const ciphertext = encrypted.subarray(ENCRYPTED_POSITION);

    const key = deriveKey(masterKey, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (err) {
    console.error("Decryption error:", err);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Encrypt sensitive fields in an object
 * @param {Object} obj - Object containing sensitive data
 * @param {Array<string>} fields - Fields to encrypt
 * @returns {Object} - Object with encrypted fields
 */
function encryptFields(obj, fields) {
  const encrypted = { ...obj };
  fields.forEach((field) => {
    if (obj[field] !== undefined && obj[field] !== null && obj[field] !== "") {
      encrypted[field] = encrypt(obj[field]);
    }
  });
  return encrypted;
}

/**
 * Decrypt sensitive fields in an object
 * @param {Object} obj - Object with encrypted fields
 * @param {Array<string>} fields - Fields to decrypt
 * @returns {Object} - Object with decrypted fields
 */
function decryptFields(obj, fields) {
  const decrypted = { ...obj };
  fields.forEach((field) => {
    if (obj[field] !== undefined && obj[field] !== null && obj[field] !== "") {
      try {
        decrypted[field] = decrypt(obj[field]);
      } catch (err) {
        console.error(`Failed to decrypt field ${field}:`, err);
        // Keep encrypted value if decryption fails
        decrypted[field] = obj[field];
      }
    }
  });
  return decrypted;
}

/**
 * Create a hash for data integrity verification
 * @param {string} data - Data to hash
 * @returns {string} - SHA-256 hash in hex format
 */
function hashData(data) {
  return crypto.createHash("sha256").update(String(data)).digest("hex");
}

module.exports = {
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
  hashData,
};
