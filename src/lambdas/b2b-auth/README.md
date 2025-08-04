# B2B Authentication Lambda

## Overview

The B2B Authentication Lambda function provides API Gateway authorization for B2B (Business-to-Business) applications. This function validates API keys and manages access control for business partners and third-party integrations.

## Purpose

This lambda function serves as an authorization layer for API Gateway, ensuring that only authorized business applications can access specific API endpoints. It implements a comprehensive access control system with scope-based permissions.

## Functionality

### Authentication Flow

1. **API Key Validation**: Validates the provided API key against stored secrets
2. **Application Verification**: Checks if the requesting application is registered and active
3. **Scope Permission Check**: Validates if the application has permission to access the requested resource
4. **Policy Generation**: Generates AWS IAM policies for API Gateway authorization

### Access Control Features

- **Wildcard Permissions**: Support for full access with `*` scope
- **Deny Rules**: Specific deny rules that take precedence over allow rules
- **Method-Specific Access**: Different permissions for different HTTP methods
- **Resource-Based Access**: Granular control over specific API endpoints
- **Pattern Matching**: Support for dynamic resource patterns with wildcards

### Supported Operations

- **GET**: Read operations
- **POST**: Create operations
- **PUT**: Update operations
- **DELETE**: Delete operations
- **PATCH**: Partial update operations

## Business Logic

### Authorization Process

1. **Input Validation**: Validates required parameters (API key, app name, HTTP method, resource)
2. **Secret Retrieval**: Fetches API keys from AWS Secrets Manager
3. **Key Verification**: Compares provided API key with stored secret
4. **Access Control Check**: Validates application permissions from DynamoDB
5. **Scope Validation**: Checks if the requested operation is within allowed scopes
6. **Policy Response**: Returns appropriate IAM policy for API Gateway

### Scope Management

The function supports flexible scope definitions:

- **Full Access**: `*` grants access to all resources
- **Method-Specific**: `GET:/api/users` allows only GET requests to user endpoints
- **Resource Patterns**: `POST:/api/orders/{id}` allows POST to specific order patterns
- **Deny Rules**: `DENY:DELETE:/api/critical` explicitly denies DELETE operations

## Input/Output

### Input (API Gateway Event)

```json
{
  "methodArn": "arn:aws:execute-api:region:account:api-id/stage/HTTP-METHOD/resource",
  "headers": {
    "x-api-key": "your-api-key",
    "x-app-name": "application-name"
  },
  "httpMethod": "GET",
  "resource": "/api/users"
}
```

### Output (IAM Policy)

```json
{
  "principalId": "user",
  "policyDocument": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": "execute-api:Invoke",
        "Effect": "Allow|Deny",
        "Resource": "arn:aws:execute-api:region:account:api-id/stage/*"
      }
    ]
  },
  "context": {
    "authorizedToAccess": "application-name",
    "clientType": "B2B"
  }
}
```

## Dependencies

- **AWS Secrets Manager**: Stores API keys for different applications
- **DynamoDB**: Stores access control configurations and scope definitions
- **AWS SDK**: For AWS service interactions

## Environment Variables

- Database connection configurations
- AWS region settings
- Secrets Manager configuration

## Error Handling

- **Missing Parameters**: Returns deny policy for missing required fields
- **Invalid API Key**: Returns deny policy for invalid keys
- **Inactive Application**: Returns deny policy for inactive applications
- **Scope Mismatch**: Returns deny policy for unauthorized operations
- **System Errors**: Returns deny policy for internal errors

## Security Features

- **API Key Encryption**: Keys stored in AWS Secrets Manager
- **Scope Validation**: Granular permission control
- **Audit Logging**: Comprehensive access logging
- **Error Masking**: Prevents information leakage in error responses

## Monitoring and Logging

The function provides detailed logging for:

- Access attempts (successful and failed)
- Authorization decisions
- Error conditions
- Performance metrics

## Usage Examples

### Basic Authorization
```javascript
// API Gateway triggers this lambda with the event
// Lambda validates and returns authorization policy
```

### Scope Configuration
```json
{
  "provider": "my-app",
  "isActive": true,
  "scopes": ["GET:/api/users", "POST:/api/orders", "DENY:DELETE:/api/critical"]
}
```

## Related Components

- **DTO**: Handles parameter extraction and policy generation
- **Model**: Contains business logic for authorization
- **DAO**: Manages database interactions
- **Shared Types**: Common type definitions

## Deployment

This lambda function is deployed as an API Gateway authorizer and is triggered automatically for all API requests that require B2B authentication. 