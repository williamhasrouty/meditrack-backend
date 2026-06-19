# MediTrack Security Documentation

## Overview

MediTrack implements comprehensive security measures to protect Protected Health Information (PHI) in compliance with HIPAA requirements and healthcare industry best practices.

## Implemented Security Features

### 1. Authentication & Access Control ✅

#### Secure Login
- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Authentication**: Bearer token-based authentication
- **Token Expiration**: 7-day token lifetime with planned refresh mechanism
- **Session Management**: Automatic logout after 30 minutes of inactivity (frontend)

#### Enhanced Password Policy
- **Minimum Length**: 12 characters (increased from 8)
- **Complexity Requirements**:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
  - No sequential characters (abc, 123)
  - No repeating characters (aaa, 111)
  - Cannot contain user's name or email
  - Common password blacklist
- **Maximum Length**: 128 characters
- **Password History**: Tracks last 5 passwords (prevents reuse)

#### Account Lockout
- **Max Failed Attempts**: 5 consecutive failed login attempts
- **Lockout Duration**: 30 minutes
- **Auto-unlock**: Account automatically unlocks after duration
- **Audit Logging**: All lockout events are logged with ACCOUNT_LOCKED action

### 2. Role-Based Access Control (RBAC) ✅

- **Roles**: `admin` and `staff`
- **First User**: Automatically assigned admin role
- **Admin-Only Routes**:
  - View audit logs (`GET /audit-logs`)
  - Update user roles (`PATCH /users/:userId/role`)
- **Role Verification**: JWT payload includes role claim
- **Authorization Middleware**: Validates admin access for protected routes

### 3. Field-Level Encryption ✅

#### Encryption Implementation
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Salt**: 64-byte random salt per encryption
- **IV**: 16-byte random initialization vector
- **Authentication**: GCM authentication tag for integrity

#### Encrypted Fields

**Client Data**:
- Allergies
- Diagnoses
- Emergency contacts
- Prescribing physician information
- Pharmacy information
- Notes

**PRN Administration Data**:
- Reason for administration
- Notes

#### Automatic Encryption/Decryption
- **Pre-save Hook**: Automatically encrypts fields before database write
- **Post-retrieval Hook**: Automatically decrypts fields after database read
- **Transparent**: Application code works with plaintext, encryption handled by model layer

### 4. Comprehensive Audit Logging ✅

#### Audit Log Model
- **User Tracking**: userId, userName, userEmail
- **Action Types**: 30+ predefined actions covering authentication, PHI access, and security events
- **Resource Tracking**: resourceType, resourceId
- **Context**: IP address, user agent, timestamp
- **Status**: SUCCESS, FAILURE, WARNING

#### Logged Events

**Authentication**:
- LOGIN_SUCCESS
- LOGIN_FAILED (with reason)
- LOGOUT
- SIGNUP
- PASSWORD_CHANGE
- ACCOUNT_LOCKED
- ACCOUNT_UNLOCKED

**PHI Access**:
- CLIENT_VIEWED/CREATED/UPDATED/DELETED
- MEDICATION_VIEWED/CREATED/UPDATED/DELETED
- ADMINISTRATION_VIEWED/CREATED/UPDATED/DELETED
- PRN_ADMINISTRATION_VIEWED/CREATED/UPDATED/DELETED

**User Management**:
- USER_UPDATED
- USER_ROLE_CHANGED
- USER_DEACTIVATED

**Security Events**:
- UNAUTHORIZED_ACCESS_ATTEMPT
- SESSION_TIMEOUT

#### Audit Log Access
- **Endpoint**: `GET /audit-logs` (admin only)
- **Filtering**: By user, action, resource type, status, date range
- **Pagination**: Limit (max 1000) and skip parameters
- **Retention**: No automatic deletion (manual policy required)

### 5. Security Middleware ✅

- **Helmet.js**: Secures HTTP headers
- **CORS**: Whitelist configuration for production domains
- **Rate Limiting**: 100 requests per 15 minutes (production), 1000 (development)
- **Input Validation**: Joi/Celebrate validation on all endpoints
- **Error Handling**: Centralized error handler prevents information leakage

### 6. Data Protection

#### At Rest
- **Passwords**: bcrypt hashed
- **PHI Fields**: AES-256-GCM encrypted
- **Tokens**: JWT signed with secret key

#### In Transit
- **HTTPS**: Required for production
- **CORS**: Restricted origins
- **JWT Bearer**: Tokens sent in Authorization header

## HIPAA Compliance Status

| HIPAA Requirement | Status | Implementation |
|-------------------|--------|----------------|
| **§ 164.312(a)(1)** - Access Control | ✅ Complete | JWT authentication, RBAC, session timeout |
| **§ 164.312(a)(2)(i)** - Unique User ID | ✅ Complete | MongoDB ObjectId per user |
| **§ 164.312(a)(2)(iii)** - Automatic Logoff | ✅ Complete | 30-minute inactivity timeout |
| **§ 164.312(a)(2)(iv)** - Encryption | ✅ Complete | AES-256-GCM for PHI fields |
| **§ 164.312(b)** - Audit Controls | ✅ Complete | Comprehensive audit logging |
| **§ 164.312(c)(1)** - Integrity Controls | ⚠️ Partial | GCM authentication tags |
| **§ 164.312(d)** - Authentication | ⚠️ Basic | Password + planned 2FA |
| **§ 164.312(e)(1)** - Transmission Security | ✅ Complete | HTTPS in production |

## Remaining Security Enhancements (Roadmap)

### High Priority
1. **Two-Factor Authentication (2FA)**
   - TOTP (Time-based One-Time Password)
   - Backup codes
   - QR code generation for authenticator apps

2. **Token Refresh Mechanism**
   - Short-lived access tokens (15 minutes)
   - Long-lived refresh tokens (7 days)
   - Automatic token rotation

3. **httpOnly Cookies**
   - Move JWT from localStorage to httpOnly cookies
   - CSRF protection tokens
   - Secure, SameSite=Strict flags

4. **Password Reset Flow**
   - Email verification
   - Secure reset tokens with expiration
   - Password reset audit logging

### Medium Priority
5. **Enhanced Security Headers**
   - Content Security Policy (CSP)
   - X-Frame-Options
   - X-Content-Type-Options

6. **Database Connection Encryption**
   - TLS/SSL for MongoDB connections
   - Certificate validation

7. **Secrets Management**
   - Environment-specific encryption keys
   - Key rotation procedures
   - Hardware Security Module (HSM) integration

8. **Security Monitoring**
   - Real-time alerting for suspicious activity
   - Anomaly detection
   - Failed login notifications

### Lower Priority
9. **IP Whitelisting**
10. **Geographic Restrictions**
11. **Device Fingerprinting**
12. **Biometric Authentication** (future mobile app)

## Configuration

### Required Environment Variables

```bash
# Authentication
JWT_SECRET=your-secret-jwt-key-change-in-production

# Encryption (CRITICAL - must be set in production)
ENCRYPTION_KEY=your-64-character-hex-encryption-key

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/meditrack

# Server
PORT=3001
NODE_ENV=production
```

### Generating Secure Keys

```bash
# Generate encryption key (32 bytes = 64 hex characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

## Security Best Practices

### For Developers

1. **Never Log Sensitive Data**: No PHI, passwords, or tokens in logs
2. **Validate All Input**: Always use validation middleware
3. **Use Parameterized Queries**: Mongoose prevents NoSQL injection
4. **Keep Dependencies Updated**: Regular `npm audit` and updates
5. **Review Audit Logs**: Regularly check for suspicious activity

### For Administrators

1. **Strong Encryption Key**: Generate and securely store ENCRYPTION_KEY
2. **Rotate Keys**: Plan for periodic key rotation (annual minimum)
3. **Monitor Audit Logs**: Review daily for unauthorized access
4. **Backup Strategy**: Encrypted backups with secure storage
5. **Access Review**: Quarterly review of user roles and permissions

### For Users

1. **Strong Passwords**: Follow complexity requirements
2. **No Password Sharing**: Each user must have unique credentials
3. **Logout When Done**: Don't leave sessions unattended
4. **Report Incidents**: Immediately report suspicious activity
5. **Regular Password Changes**: Update password every 90 days (recommended)

## Incident Response

### Security Breach Procedure

1. **Immediate Actions**:
   - Lock affected accounts
   - Revoke all active tokens
   - Isolate affected systems

2. **Investigation**:
   - Review audit logs for breach extent
   - Identify compromised data
   - Determine breach timeline

3. **Notification**:
   - Notify affected users
   - Comply with HIPAA breach notification rules (60 days)
   - Document all actions

4. **Remediation**:
   - Rotate all encryption keys
   - Update compromised credentials
   - Patch vulnerabilities

5. **Prevention**:
   - Implement additional controls
   - Update security policies
   - Conduct security training

## Audit Log Retention

- **Minimum**: 6 years (HIPAA requirement)
- **Recommended**: 7 years
- **Storage**: Encrypted, backed up, access-controlled
- **Review**: Quarterly security audits

## Compliance Certifications

- [ ] HIPAA Risk Assessment (pending)
- [ ] HITRUST CSF Certification (planned)
- [ ] SOC 2 Type II (planned)
- [ ] ISO 27001 (future consideration)

## Security Contacts

For security concerns or to report vulnerabilities:
- **Email**: security@meditrack.example.com
- **Emergency**: Follow incident response procedure
- **Bug Bounty**: (To be established)

## Version History

- **v1.4.0** (2026-06-18): Added field-level encryption, enhanced password policy, account lockout
- **v1.3.0** (2026-06-18): Implemented comprehensive audit logging
- **v1.2.0** (2026-06-18): Added session timeout (frontend)
- **v1.1.0** (Previous): Owner-based access control, basic RBAC
- **v1.0.0** (Previous): Initial security implementation

---

**Last Updated**: 2026-06-18  
**Next Security Review**: 2026-09-18  
**Document Owner**: Security Team
