# Blacklist Monitor Wallet Lambda Function

## Overview

This Lambda function manages blacklist operations for user wallets and associated entities. It handles blocking and unblocking of users by managing their associated financial and personal information (bank accounts, documents, phone numbers, and emails) in a blacklist system. The function is designed to be triggered by events and performs database operations to maintain blacklist records.

## Purpose

The blacklist monitor wallet function is designed to:
- Block users and their associated entities (bank accounts, documents, phones, emails) in the blacklist system
- Unblock previously blacklisted entities by updating their status to inactive
- Retrieve and manage user-associated data for blacklist operations
- Maintain referential integrity between users, businesses, and blacklist reasons
- Provide comprehensive logging for blacklist operations and auditing

## Technical Details

### Input

The function expects an event with the following structure:

```typescript
{
  detail: {
    idBusiness: number,    // Required: Business identifier
    idUser: number         // Required: User identifier
  },
  stage: string,           // Required: Environment (dev, prod, etc.)
  blacklistAction: string, // Required: "block" or "unblock"
  idBlacklistReason: number // Required: Reason identifier for blacklisting
}
```

### Output

The function does not return a specific response structure. It performs database operations and logs the results. Success or failure is indicated through console logs and thrown errors.

### Environment Variables

- **Database Environment Variables**: Inherited from `dbEnv` shared type
  - Database connection parameters
  - Environment-specific configuration
- **AWS_REGION**: AWS region for database operations (defaults to us-east-1)

### Dependencies

- **AWS Services**:
  - Database services (via shared database utilities)
- **Shared Utilities**:
  - `../../shared/responses/http` - HTTP response formatting
  - `../../shared/types/database` - Database type definitions and environment variables
  - `../../shared/validation/envChecker` - Environment variable validation
- **Internal Components**:
  - `./dto` - Data transfer object for parameter validation
  - `./model` - Business logic for blacklist operations
  - `./types/types` - Type definitions and enums

## Setup and Usage

### Local Development

1. Configure database connection parameters:
   ```bash
   # Set required database environment variables
   export DB_HOST=your-database-host
   export DB_USER=your-database-user
   export DB_PASSWORD=your-database-password
   export DB_NAME=your-database-name
   ```

2. Ensure database tables exist:
   - User-related tables (bank accounts, documents, phones, emails)
   - Blacklist management tables
   - Business and reason reference tables

### Testing

#### Test Event Structure

**Block Action**:
```json
{
  "detail": {
    "idBusiness": 123,
    "idUser": 456
  },
  "stage": "dev",
  "blacklistAction": "block",
  "idBlacklistReason": 1
}
```

**Unblock Action**:
```json
{
  "detail": {
    "idBusiness": 123,
    "idUser": 456
  },
  "stage": "prod",
  "blacklistAction": "unblock",
  "idBlacklistReason": 1
}
```

#### Expected Database Structure

The function expects the following data relationships:
- Users have associated bank accounts, ID documents, phone numbers, and emails
- Blacklist entries reference specific entities and reasons
- Business and user relationships are maintained

### Build and Deployment

1. Build the function:
   ```bash
   npm run build
   ```
2. Select "blacklist-monitor-wallet" when prompted
3. Deploy as an event-driven Lambda function
4. Configure appropriate triggers (EventBridge, SQS, etc.)

## Error Handling and Troubleshooting

### Common Errors

1. **"Missing data in event: [field names]"**
   - Ensure all required fields are present in the event
   - Check that `detail`, `stage`, `blacklistAction`, and `idBlacklistReason` are provided

2. **Database Connection Errors**
   - Verify database environment variables are set correctly
   - Check database connectivity and permissions

3. **"Action not found"**
   - Ensure `blacklistAction` is either "block" or "unblock"
   - Verify the action parameter is correctly formatted

### Supported Actions

- **block**: Adds user and associated entities to blacklist
- **unblock**: Updates blacklist entries to inactive status

### Entity Types Managed

1. **Bank Accounts**: Account numbers associated with the user
2. **ID Documents**: Document numbers (IDs, passports, etc.)
3. **Phone Numbers**: Phone numbers associated with the user
4. **Email Addresses**: Email addresses associated with the user

### Troubleshooting

1. Check CloudWatch logs for detailed operation logs
2. Verify database schema matches expected structure
3. Ensure user has associated entities to blacklist
4. Check that blacklist reason IDs exist in the system
5. Verify business and user relationships are properly established

## Examples

### Successful Block Operation

**Request**:
```json
{
  "detail": {
    "idBusiness": 100,
    "idUser": 250
  },
  "stage": "prod",
  "blacklistAction": "block",
  "idBlacklistReason": 2
}
```

**Expected Log Output**:
```
[blockEntities] Start: 250, business: 100
starting process to get entities to block...
[blockEntities] Done: 250
```

**Database Changes**:
- User's bank accounts, documents, phones, and emails added to blacklist
- Blacklist entries created with status "ACTIVE"
- References to business and reason maintained

### Successful Unblock Operation

**Request**:
```json
{
  "detail": {
    "idBusiness": 100,
    "idUser": 250
  },
  "stage": "prod",
  "blacklistAction": "unblock",
  "idBlacklistReason": 2
}
```

**Expected Log Output**:
```
Event =>>> {"detail":{"idBusiness":100,"idUser":250},"stage":"prod",...}
```

**Database Changes**:
- Existing blacklist entries updated to status "INACTIVE"
- Historical blacklist records preserved for auditing

### Error Scenarios

**Missing Required Fields**:
```json
{
  "detail": {
    "idBusiness": 100
    // Missing idUser
  },
  "stage": "prod",
  "blacklistAction": "block"
  // Missing idBlacklistReason
}
```

**Error Response**:
```
Error: Missing data in event: idUser, idBlacklistReason
```

**Invalid Action**:
```json
{
  "detail": {
    "idBusiness": 100,
    "idUser": 250
  },
  "stage": "prod",
  "blacklistAction": "invalid_action",
  "idBlacklistReason": 2
}
```

**Error Response**:
```
Action not found
Error: Action not found
```

## Data Flow

1. **Event Reception**: Function receives event with user and business details
2. **Parameter Validation**: DTO validates all required parameters
3. **Environment Check**: Validates database environment variables
4. **Action Routing**: Routes to appropriate model method based on action
5. **Entity Retrieval**: (Block only) Retrieves user's associated entities
6. **Database Operations**: Performs blacklist add/update operations
7. **Logging**: Comprehensive logging of operations and results

## Security Considerations

- Function operates on sensitive financial and personal data
- All operations are logged for audit purposes
- Database access should be restricted to necessary permissions
- Consider implementing additional validation for business-user relationships
- Ensure proper error handling to prevent data leakage in logs