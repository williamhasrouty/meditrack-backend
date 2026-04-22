# Administration Records Security

## User Isolation and Protection

The MediTrack backend ensures that users cannot modify or delete administration records (initials) saved by other users through the following mechanisms:

### 1. Owner-Based Access Control

All administration records are tied to the user who created them via the `owner` field:

```javascript
{
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  }
}
```

### 2. Query Filtering

Every database query for administration records includes the `owner` field to ensure users can only access their own data:

```javascript
Administration.findOne({
  clientId,
  month: parseInt(month, 10),
  year: parseInt(year, 10),
  owner: req.user._id, // Only returns records owned by current user
});
```

### 3. Update and Delete Protection

When updating or deleting administration records, the `owner` field is included in the query criteria:

```javascript
Administration.findOneAndUpdate(
  {
    clientId,
    medicationId,
    month: parseInt(month, 10),
    year: parseInt(year, 10),
    owner: req.user._id, // Can only update own records
  },
  { records, updatedAt: Date.now() },
  { new: true, upsert: true, runValidators: true }
);
```

### 4. Frontend Validation

The frontend also implements protection by checking if initials match the current user before allowing edits:

```javascript
// If cell has someone else's initials, don't allow changes
if (existingValue !== userInitials) {
  return prev; // No change allowed
}
```

### 5. Authorization Middleware

All administration routes are protected by JWT authentication middleware that verifies the user's identity before allowing any operations.

## Key Security Features

1. **Password Encryption**: All passwords are hashed using bcrypt with 10 salt rounds
2. **JWT Authentication**: 7-day expiration tokens for secure sessions
3. **Request Validation**: Celebrate/Joi validation on all incoming data
4. **Centralized Error Handling**: Consistent error responses without exposing sensitive information
5. **Owner Isolation**: Users can only access, modify, or delete their own records
6. **Status Code Compliance**: Proper HTTP status codes (200, 201, 400, 401, 403, 404, 409, 500)

## Implementation Summary

- ✅ Passwords encrypted with bcrypt
- ✅ Request body and parameter validation with Joi
- ✅ Centralized error handling middleware
- ✅ Proper status codes throughout
- ✅ Users cannot delete/modify other users' initials (owner-based queries)
