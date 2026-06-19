# MediTrack Security Implementation Guide

## Quick Start

This guide helps you set up the newly implemented security features in your MediTrack application.

## 1. Environment Setup

### Required Environment Variables

Create or update your `.env` file in the backend directory:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/meditrack

# Authentication
JWT_SECRET=your-secret-jwt-key-change-in-production

# Encryption (CRITICAL - Required for Production)
ENCRYPTION_KEY=your-64-character-hex-encryption-key
```

### Generate Secure Keys

Run these commands to generate secure keys:

```bash
# Generate ENCRYPTION_KEY (32 bytes = 64 hex characters)
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_SECRET
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('base64'))"
```

**IMPORTANT**:

- Never commit these keys to version control
- Use different keys for development, staging, and production
- Store production keys in a secure secrets manager (AWS Secrets Manager, Azure Key Vault, etc.)

## 2. Security Features Implemented

### ✅ Audit Logging System

- **What**: Tracks all PHI access, authentication events, and security incidents
- **Files**:
  - `models/auditLog.js` - Audit log data model
  - `utils/auditLogger.js` - Logging utilities
  - `controllers/auditLogs.js` - Admin endpoint for viewing logs
  - `routes/auditLogs.js` - Routes for audit log access
- **Usage**: Automatic logging is integrated into controllers. Admins can view logs at `GET /audit-logs`
- **HIPAA**: Satisfies § 164.312(b) audit controls requirement

### ✅ Session Timeout & Auto-Logout

- **What**: Automatically logs out users after 30 minutes of inactivity
- **Files**:
  - `se_project_meditrack/src/utils/hooks/useSessionTimeout.js`
  - Updated in `App.jsx`
- **Configuration**: Default 30 minutes, configurable
- **HIPAA**: Satisfies § 164.312(a)(2)(iii) automatic logoff requirement

### ✅ Field-Level Encryption (AES-256-GCM)

- **What**: Encrypts sensitive PHI fields at rest in the database
- **Files**:
  - `utils/encryption.js` - Encryption utilities
  - Updated `models/client.js` - Automatic encryption/decryption hooks
  - Updated `models/prnAdministration.js` - Encryption for notes/reason
  - Updated `config/config.js` - Encryption key configuration
- **Encrypted Fields**:
  - Client: allergies, diagnoses, emergencyContacts, prescribingPhysician, pharmacyInfo, notes
  - PRN Admin: reason, notes
- **HIPAA**: Satisfies § 164.312(a)(2)(iv) encryption requirement

### ✅ Enhanced Password Policy

- **What**: Enforces strong password requirements and prevents reuse
- **Files**:
  - `utils/passwordValidator.js` - Password complexity validation
  - Updated `controllers/users.js` - Validation integration
  - Updated `models/user.js` - Password history and lockout fields
  - Updated `middlewares/validation.js` - Minimum 12 characters
- **Requirements**:
  - 12-128 characters
  - Upper + lowercase + number + special character
  - No sequential or repeating characters
  - No common passwords
  - Cannot contain user's name or email
- **HIPAA**: Strengthens § 164.312(d) authentication requirement

### ✅ Account Lockout

- **What**: Locks accounts after 5 failed login attempts for 30 minutes
- **Files**: Updated `controllers/users.js` with lockout logic
- **Configuration**:
  - `MAX_LOGIN_ATTEMPTS = 5`
  - `LOCKOUT_DURATION = 30 minutes`
- **Audit**: ACCOUNT_LOCKED events logged

## 3. Testing the Security Features

### Test Audit Logging

```bash
# 1. Sign up a new user (creates SIGNUP audit log)
curl -X POST http://localhost:3001/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User",
    "initials": "TU"
  }'

# 2. Login (creates LOGIN_SUCCESS audit log)
curl -X POST http://localhost:3001/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# 3. View audit logs (admin only)
curl -X GET "http://localhost:3001/audit-logs?limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test Password Policy

```bash
# This will fail - password too short
curl -X POST http://localhost:3001/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Short1!",
    "name": "User",
    "initials": "US"
  }'

# Expected: 400 Bad Request with password requirements error

# This will succeed - strong password
curl -X POST http://localhost:3001/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "MySecureP@ssw0rd2026",
    "name": "User",
    "initials": "US"
  }'
```

### Test Account Lockout

```bash
# Try logging in with wrong password 5 times
for i in {1..5}; do
  curl -X POST http://localhost:3001/signin \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "WrongPassword"}'
done

# 6th attempt should return account locked error
curl -X POST http://localhost:3001/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "WrongPassword"}'
```

### Test Field-Level Encryption

```bash
# Create a client with sensitive information
curl -X POST http://localhost:3001/clients \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "region": "GGRC",
    "allergies": "Penicillin, Peanuts",
    "diagnoses": "Diabetes Type 2, Hypertension",
    "emergencyContacts": "Jane Doe: 555-0100"
  }'

# Check database directly to verify encryption
# In MongoDB shell:
# use meditrack
# db.clients.findOne({name: "John Doe"})
# You should see encrypted hex strings for allergies, diagnoses, etc.
```

### Test Session Timeout

1. Log in to the frontend application
2. Leave it idle for 30 minutes
3. After 30 minutes, any interaction should redirect you to login
4. You should see a notification: "Your session has timed out due to inactivity"

## 4. Production Deployment Checklist

### Before Deploying

- [ ] Generate production ENCRYPTION_KEY and JWT_SECRET
- [ ] Store keys in secure secrets manager (not in code)
- [ ] Set NODE_ENV=production
- [ ] Configure HTTPS/TLS for MongoDB connection
- [ ] Set up encrypted database backups
- [ ] Configure production CORS whitelist
- [ ] Review and adjust rate limiting settings
- [ ] Set up audit log retention policy (6-7 years)
- [ ] Configure audit log monitoring/alerting
- [ ] Test encryption/decryption on staging environment
- [ ] Document key rotation procedures

### After Deploying

- [ ] Verify audit logs are being created
- [ ] Test account lockout functionality
- [ ] Verify field encryption in database
- [ ] Confirm session timeout works
- [ ] Review first week of audit logs
- [ ] Set up weekly audit log reviews
- [ ] Train users on new password requirements
- [ ] Document security incident response procedure

## 5. Migration Guide (Existing Data)

If you have existing unencrypted client data:

```javascript
// Run this migration script once to encrypt existing data
const mongoose = require("mongoose");
const Client = require("./models/client");
const { encryptFields } = require("./utils/encryption");

const ENCRYPTED_FIELDS = [
  "allergies",
  "diagnoses",
  "emergencyContacts",
  "prescribingPhysician",
  "pharmacyInfo",
  "notes",
];

async function migrateExistingData() {
  await mongoose.connect(process.env.MONGODB_URI);

  const clients = await Client.find({}).lean();

  for (const client of clients) {
    const encrypted = encryptFields(client, ENCRYPTED_FIELDS);

    await Client.updateOne({ _id: client._id }, { $set: encrypted });
  }

  console.log(`Migrated ${clients.length} clients`);
  await mongoose.connection.close();
}

migrateExistingData().catch(console.error);
```

**WARNING**:

- Test on a backup database first
- This is a one-way operation
- Keep a backup of unencrypted data until verified
- Run during maintenance window

## 6. Monitoring & Maintenance

### Daily

- Review failed login attempts
- Check for account lockout events
- Monitor error logs for encryption failures

### Weekly

- Review audit logs for unusual patterns
- Check for repeated failed authentication
- Verify backup encryption is working

### Monthly

- Audit log retention cleanup (if needed)
- Review access control permissions
- Check for security patches in dependencies

### Quarterly

- Security audit of all features
- Review and update security policies
- Test incident response procedures
- User access review

### Annually

- Encryption key rotation planning
- HIPAA security risk assessment
- Security training for all users
- Third-party security audit (recommended)

## 7. Common Issues & Solutions

### Issue: Encryption key not set

**Error**: `ENCRYPTION_KEY is required`

**Solution**: Set ENCRYPTION_KEY in your .env file

```bash
# Generate new key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Add to .env
ENCRYPTION_KEY=generated_key_here
```

### Issue: Cannot decrypt existing data

**Error**: `Failed to decrypt data`

**Cause**: ENCRYPTION_KEY changed or data was encrypted with different key

**Solution**:

- Restore original ENCRYPTION_KEY
- If key is lost, data cannot be recovered
- This is why backup of keys is critical

### Issue: Account locked after migration

**Cause**: failedLoginAttempts field not initialized

**Solution**: Reset failed attempts in database:

```javascript
db.users.updateMany(
  {},
  { $set: { failedLoginAttempts: 0, accountLockedUntil: null } },
);
```

### Issue: Audit logs growing too large

**Solution**: Implement log rotation or archival:

```javascript
// Archive logs older than 1 year to cold storage
db.auditlogs.find({ timestamp: { $lt: new Date("2025-01-01") } });
```

## 8. Additional Security Recommendations

### Still to Implement (High Priority)

1. **Two-Factor Authentication (2FA)** - Adds second factor for authentication
2. **Token Refresh** - Shorter token lifetimes with automatic refresh
3. **httpOnly Cookies** - Move JWT from localStorage to secure cookies
4. **Password Reset** - Secure password reset flow with email verification

### Infrastructure Security

- Use HTTPS everywhere (Let's Encrypt for certificates)
- Enable MongoDB authentication and encryption at rest
- Use VPC/private network for database
- Implement Web Application Firewall (WAF)
- Regular security scanning (OWASP ZAP, Burp Suite)
- Dependency scanning (npm audit, Snyk)

## 9. Resources

- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

## Support

For security questions or issues:

- Review SECURITY.md for detailed information
- Check audit logs for suspicious activity
- Follow incident response procedure for breaches

---

**Document Version**: 1.0  
**Last Updated**: 2026-06-18  
**Next Review**: 2026-09-18
