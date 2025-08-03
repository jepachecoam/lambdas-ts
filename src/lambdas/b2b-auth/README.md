# B2B Authentication Lambda Function

## Overview

This Lambda function provides API Gateway authorization for Business-to-Business (B2B) clients. It validates API keys, checks application permissions, and generates IAM policies to allow or deny access to specific API resources based on configured scopes and access control rules.

## Purpose

The B2B authentication function is designed to:
- Authenticate B2B clients using API keys and application names
- Validate access permissions against DynamoDB-stored access control rules
- Generate IAM policies for API Gateway authorization
- Support both REST API Gateway and HTTP API Gateway formats
- Implement scope-based access control with allow/deny patterns
- Provide detailed access logging for security auditing

## Technical Details

### Input

The function expects an API Gateway authorization event with the following structure:

```typescript
{
  methodArn: string,           // REST API Gateway ARN
  routeArn?: string,          // HTTP API Gateway ARN (alternative)
  headers: {
    "x-api-key": string,      // Required: API key for authentication
    "x-app-name": string,     // Required: Application name identifier
    "x-client-type"?: string  // Must NOT be present (B2B only)
  },
  requestContext: {
    stage: string,            // Required: API stage (dev, prod, etc.)
    http?: {                  // HTTP API Gateway format
      method: string,
      path: string
    }
  },
  httpMethod?: string,        // REST API Gateway method
  path?: string,             // REST API Gateway path
  pathParameters?: object    // Path parameters for ARN normalization
}
```

### Output

**Success Response (Authorized)**:
```json
{
  "principalId": "user",
  "policyDocument": {
    "Version": "2012-10-17",
    "Statement": [{
      "Action": "execute-api:Invoke",
      "Effect": "Allow",
      "Resource": "arn:aws:execute-api:..."
    }]
  },
  "isAuthorized": true,
  "context": {
    "authorizedToAccess": "app-name",
    "clientType": "B2B"
  }
}
```

**Failure Response (Denied)**:
```json
{
  "principalId": "user",
  "policyDocument": {
    "Version": "2012-10-17",
    "Statement": [{
      "Action": "execute-api:Invoke",
      "Effect": "Deny",
      "Resource": "arn:aws:execute-api:..."
    }]
  },
  "isAuthorized": false
}
```

### Environment Variables

- **AWS_REGION**: AWS region for DynamoDB and Secrets Manager (defaults to us-east-1)
- **Stage-specific variables**: The function uses the stage from the request context to determine environment

### Dependencies

- **AWS Services**:
  - AWS Secrets Manager: Stores API keys for B2B applications
  - DynamoDB: Stores access control rules and scopes
- **Shared Utilities**:
  - `../../shared/databases/dynamo` - DynamoDB operations
  - `../../shared/services/secretManager` - Secrets Manager operations
  - `../../shared/types/database` - Database type definitions

## Setup and Usage

### Local Development

1. Configure AWS credentials with access to:
   - Secrets Manager (read access to `apigateway/prod/apps/b2b-api-keys`)
   - DynamoDB (read access to `B2BAccessControl` table)

2. Set up environment variables:
   ```bash
   export AWS_REGION=us-east-1
   ```

3. Ensure the following AWS resources exist:
   - Secret: `apigateway/prod/apps/b2b-api-keys` with app-name/API-key pairs
   - DynamoDB table: `B2BAccessControl` (or `B2BAccessControl-Dev` for dev stage)

### Testing

#### Test Event Structure

```json
{
  "methodArn": "arn:aws:execute-api:us-east-1:123456789:abcdef123/prod/GET/users",
  "headers": {
    "x-api-key": "your-api-key",
    "x-app-name": "your-app-name"
  },
  "requestContext": {
    "stage": "prod"
  },
  "httpMethod": "GET",
  "path": "/prod/users"
}
```

#### DynamoDB Access Control Record

```json
{
  "provider": "your-app-name",
  "isActive": true,
  "scopes": "[\"GET:/users\", \"POST:/orders\", \"DENY:DELETE:*\"]"
}
```

### Build and Deployment

1. Build the function:
   ```bash
   npm run build
   ```
2. Select "b2b-auth" when prompted
3. Deploy the compiled function as an API Gateway authorizer

## Error Handling and Troubleshooting

### Common Errors

1. **"Missing required parameters for authorization"**
   - Ensure `x-api-key`, `x-app-name`, and stage are provided

2. **"Client type not allowed"**
   - Remove `x-client-type` header (B2B clients should not send this)

3. **"App not found in secrets"**
   - Verify the app name exists in the Secrets Manager secret
   - Check secret name: `apigateway/prod/apps/b2b-api-keys`

4. **"Invalid API key"**
   - Verify the API key matches the one stored in Secrets Manager

5. **"Access item is missing or inactive"**
   - Ensure DynamoDB record exists for the provider
   - Verify `isActive` is set to `true`

### Access Control Scope Patterns

- **Wildcard**: `"*"` grants full access
- **Method-specific**: `"GET:/users"` allows GET requests to /users
- **Path wildcards**: `"GET:/users/*"` allows GET to any path under /users
- **Deny rules**: `"DENY:DELETE:*"` explicitly denies all DELETE requests
- **Parameter paths**: `"GET:/users/{id}"` matches parameterized paths

### Troubleshooting

1. Check CloudWatch logs for detailed access logging
2. Verify AWS permissions for Secrets Manager and DynamoDB
3. Ensure table names match environment (dev tables have `-Dev` suffix)
4. Test scope patterns using the built-in matching logic

## Examples

### Successful Authorization

**Request**:
```json
{
  "methodArn": "arn:aws:execute-api:us-east-1:123456789:abcdef123/prod/GET/users/123",
  "headers": {
    "x-api-key": "sk_test_12345",
    "x-app-name": "mobile-app"
  },
  "requestContext": { "stage": "prod" },
  "httpMethod": "GET",
  "path": "/prod/users/123",
  "pathParameters": { "id": "123" }
}
```

**DynamoDB Record**:
```json
{
  "provider": "mobile-app",
  "isActive": true,
  "scopes": "[\"GET:/users/*\", \"POST:/orders\"]"
}
```

**Response**:
```json
{
  "principalId": "user",
  "policyDocument": {
    "Version": "2012-10-17",
    "Statement": [{
      "Action": "execute-api:Invoke",
      "Effect": "Allow",
      "Resource": "arn:aws:execute-api:us-east-1:123456789:abcdef123/prod/GET/users/*"
    }]
  },
  "context": {
    "authorizedToAccess": "mobile-app",
    "clientType": "B2B"
  }
}
```

### Denied Authorization

**Request with insufficient scope**:
```json
{
  "methodArn": "arn:aws:execute-api:us-east-1:123456789:abcdef123/prod/DELETE/users/123",
  "headers": {
    "x-api-key": "sk_test_12345",
    "x-app-name": "mobile-app"
  },
  "requestContext": { "stage": "prod" },
  "httpMethod": "DELETE",
  "path": "/prod/users/123"
}
```

**Response**:
```json
{
  "principalId": "user",
  "policyDocument": {
    "Version": "2012-10-17",
    "Statement": [{
      "Action": "execute-api:Invoke",
      "Effect": "Deny",
      "Resource": "arn:aws:execute-api:us-east-1:123456789:abcdef123/prod/DELETE/users/123"
    }]
  },
  "isAuthorized": false
}
```