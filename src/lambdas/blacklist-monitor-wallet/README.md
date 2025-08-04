# Blacklist Monitor Wallet Lambda

## Overview

The Blacklist Monitor Wallet Lambda function manages the blacklisting and unblocking of entities (users, businesses, wallets) in the system. This function handles security measures by blocking or unblocking various types of entities based on business rules and security policies.

## Purpose

This lambda function serves as a security management system that can block or unblock entities from the platform. It's used for fraud prevention, compliance requirements, and risk management by controlling access to various system components.

## Functionality

### Core Operations

1. **Block Entities**: Adds entities to the blacklist system
2. **Unblock Entities**: Removes entities from the blacklist system
3. **Entity Management**: Handles multiple types of entities (users, businesses, wallets)
4. **Status Updates**: Manages the active/inactive status of blacklisted items

### Supported Entity Types

- **Users**: Individual user accounts
- **Businesses**: Business entities and organizations
- **Bank Accounts**: Financial account numbers
- **Documents**: Identity document numbers
- **Phone Numbers**: Contact phone numbers
- **Email Addresses**: Email addresses

### Blacklist Reasons

The function supports various blacklist reasons including:
- Fraud detection
- Compliance violations
- Security breaches
- Policy violations
- Risk management decisions

## Business Logic

### Blocking Process

1. **Entity Identification**: Identifies the specific entity to be blocked
2. **Related Entity Discovery**: Finds all related entities (bank accounts, documents, phones, emails)
3. **Blacklist Addition**: Adds all related entities to the blacklist system
4. **Status Management**: Sets appropriate status for blocked entities
5. **Audit Logging**: Records the blocking action for compliance

### Unblocking Process

1. **Entity Identification**: Identifies the specific entity to be unblocked
2. **Status Update**: Changes the status from active to inactive
3. **Batch Processing**: Handles multiple entities in a single operation
4. **Audit Logging**: Records the unblocking action

### Entity Discovery

When blocking a user, the system automatically discovers and blocks:

- **Bank Accounts**: All associated bank account numbers
- **Identity Documents**: All associated document numbers
- **Phone Numbers**: All associated phone numbers
- **Email Addresses**: All associated email addresses

## Input/Output

### Input (Event)

```json
{
  "action": "block|unblock",
  "idUser": "user-id",
  "idBusiness": "business-id",
  "idBlacklistReason": "reason-id"
}
```

### Output

- **Success**: No explicit response, operation completed
- **Error**: Error logged and thrown for monitoring

## Dependencies

- **Database**: MySQL database for entity storage and retrieval
- **External API**: Integration with blacklist management system
- **AWS Services**: For logging and monitoring

## Environment Variables

- Database connection configurations
- API endpoint configurations
- Environment-specific settings

## Error Handling

- **Missing Parameters**: Logs and throws errors for missing required fields
- **Database Errors**: Handles database connection and query errors
- **API Errors**: Manages external API call failures
- **Validation Errors**: Validates input parameters before processing

## Security Features

- **Audit Logging**: Comprehensive logging of all blocking/unblocking actions
- **Entity Validation**: Validates entities before processing
- **Batch Processing**: Efficient handling of multiple entities
- **Error Isolation**: Prevents partial operations from corrupting data

## Monitoring and Logging

The function provides detailed logging for:

- Blocking/unblocking operations
- Entity discovery processes
- Error conditions
- Performance metrics
- Audit trails for compliance

## Usage Examples

### Blocking a User
```javascript
// Block a user and all related entities
await model.blockEntities({
  idUser: "user-123",
  idBusiness: "business-456",
  idBlacklistReason: "fraud-detection"
});
```

### Unblocking Entities
```javascript
// Unblock entities by business and reason
await model.updateStatusEntities({
  idBusiness: "business-456",
  newStatus: "INACTIVE",
  idBlacklistReason: "fraud-detection"
});
```

### Entity Discovery
```javascript
// Discover all entities related to a user
const entities = await model.getEntitiesToBlock({
  idUser: "user-123"
});
// Returns: { accountNumbers: [], documentNumbers: [], phones: [], emails: [] }
```

## Related Components

- **DAO**: Manages database interactions and entity retrieval
- **Model**: Contains business logic for blocking/unblocking
- **Request**: Handles external API calls
- **DTO**: Manages data transfer and validation
- **Types**: Common type definitions

## Deployment

This lambda function is typically triggered by:
- Scheduled events for batch processing
- API Gateway for manual operations
- EventBridge for automated security responses
- SQS for queued operations

## Best Practices

- **Audit Trail**: Maintain comprehensive logs for compliance
- **Batch Operations**: Use batch processing for efficiency
- **Error Handling**: Implement robust error handling
- **Monitoring**: Set up alerts for failed operations
- **Validation**: Validate all inputs before processing

## Compliance Considerations

- **Data Privacy**: Ensure compliance with data protection regulations
- **Audit Requirements**: Maintain logs for regulatory compliance
- **Access Control**: Implement proper access controls
- **Data Retention**: Follow data retention policies 