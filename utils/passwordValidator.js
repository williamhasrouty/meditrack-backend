/**
 * Validate password complexity requirements
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
function validatePasswordComplexity(password) {
  const errors = [];

  if (!password) {
    return { isValid: false, errors: ["Password is required"] };
  }

  // Minimum length
  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long");
  }

  // Maximum length
  if (password.length > 128) {
    errors.push("Password must not exceed 128 characters");
  }

  // Uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Number
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push(
      "Password must contain at least one special character (!@#$%^&*()_+-=[]{}; etc.)",
    );
  }

  // No common passwords (basic check)
  const commonPasswords = [
    "password123",
    "password1234",
    "admin123456",
    "welcome12345",
    "qwerty123456",
    "123456789012",
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("Password is too common. Please choose a stronger password");
  }

  // No sequential characters
  if (
    /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(
      password,
    )
  ) {
    errors.push(
      "Password should not contain sequential characters (abc, 123, etc.)",
    );
  }

  // No repeating characters (more than 2 in a row)
  if (/(.)\1{2,}/.test(password)) {
    errors.push(
      "Password should not contain repeating characters (e.g., aaa, 111)",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if password contains user information
 * @param {string} password - Password to check
 * @param {Object} userInfo - User information (name, email, etc.)
 * @returns {boolean} - True if password contains user info
 */
function passwordContainsUserInfo(password, userInfo) {
  const lowerPassword = password.toLowerCase();

  if (userInfo.name) {
    const nameParts = userInfo.name.toLowerCase().split(/\s+/);
    for (const part of nameParts) {
      if (part.length > 2 && lowerPassword.includes(part)) {
        return true;
      }
    }
  }

  if (userInfo.email) {
    const emailUsername = userInfo.email.split("@")[0].toLowerCase();
    if (emailUsername.length > 2 && lowerPassword.includes(emailUsername)) {
      return true;
    }
  }

  return false;
}

/**
 * Generate a random strong password
 * @param {number} length - Length of password (default 16)
 * @returns {string} - Generated password
 */
function generateStrongPassword(length = 16) {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  const all = uppercase + lowercase + numbers + special;

  let password = "";

  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

module.exports = {
  validatePasswordComplexity,
  passwordContainsUserInfo,
  generateStrongPassword,
};
