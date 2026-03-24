# B2C Authentication Lambda

## Overview

The B2C Authentication Lambda function provides API Gateway authorization for B2C (Business-to-Consumer) applications. This function validates JWT tokens from AWS Cognito and manages user authentication for consumer-facing applications.

## Purpose

This lambda function serves as an authorization layer for API Gateway, ensuring that only authenticated consumers can access specific API endpoints. It validates both access tokens and ID tokens from AWS Cognito User Pool.

## Functionality

### Authentication Flow

1. **Token Validation**: Validates JWT tokens (access and ID tokens) from AWS Cognito
2. **Token Verification**: Verifies token signatures and expiration
3. **Alternative Method**: Falls back to custom JWT verification for ID tokens
4. **Policy Generation**: Generates AWS IAM policies for API Gateway authorization
5. **Context Provision**: Provides user context for downstream services

### Token Types Supported

- **Access Token**: Short-lived token for API access
- **ID Token**: Contains user identity information
- **Custom JWT**: Fallback verification method for ID tokens

### Security Features

- **Cognito Integration**: Native AWS Cognito token verification
- **Alternative Verification**: Custom JWT verification for specific scenarios
- **Token Mismatch Detection**: Ensures access and ID tokens belong to the same user
- **Error Handling**: Comprehensive error handling with appropriate responses

## Business Logic

### Authentication Process

1. **Environment Validation**: Checks required environment variables
2. **Header Validation**: Extracts and validates authorization headers
3. **Access Token Verification**: Verifies the access token with Cognito
4. **ID Token Verification**: Verifies the ID token with Cognito or custom method
5. **Token Consistency Check**: Ensures both tokens belong to the same user
6. **Policy Generation**: Creates appropriate IAM policy for API Gateway

### Token Verification Methods

#### Primary Method (Cognito)
```javascript
// Uses AWS Cognito JWT verifier for both access and ID tokens
const verifier = CognitoJwtVerifier.create({
  userPoolId: cognitoUserPoolId,
  tokenUse: typeTokenUse,
  clientId: cognitoClientId
});
```

#### Alternative Method (Custom JWT)
```javascript
// Falls back to custom JWT verification for ID tokens
const decoded = jwt.verify(token, JWT_SECRET);
```

## Input/Output

### Input (API Gateway Event)

```json
{
  "methodArn": "arn:aws:execute-api:region:account:api-id/stage/HTTP-METHOD/resource",
  "headers": {
    "Authorization": "Bearer access-token-here",
    "Id-Token": "id-token-here"
  },
  "stageVariables": {
    "cognitoUserPoolId": "us-east-1_xxxxx",
    "cognitoClientId": "client-id-here"
  }
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
    "clientType": "B2C"
  }
}
```

## Dependencies

- **AWS Cognito**: For token verification and user management
- **aws-jwt-verify**: Official AWS JWT verification library
- **jsonwebtoken**: For custom JWT verification
- **AWS SDK**: For AWS service interactions

## Environment Variables

- `JWT_SECRET`: Secret key for custom JWT verification
- `COGNITO_USER_POOL_ID`: AWS Cognito User Pool ID
- `COGNITO_CLIENT_ID`: AWS Cognito Client ID

## Error Handling

- **Missing Tokens**: Returns deny policy for missing authorization headers
- **Invalid Tokens**: Returns deny policy for invalid or expired tokens
- **Token Mismatch**: Returns deny policy when access and ID tokens don't match
- **Verification Errors**: Returns deny policy for verification failures
- **System Errors**: Returns deny policy for internal errors

## Security Features

- **Token Encryption**: JWT tokens are cryptographically signed
- **Expiration Validation**: Checks token expiration times
- **Signature Verification**: Validates token signatures
- **User Consistency**: Ensures tokens belong to the same user
- **Error Masking**: Prevents information leakage in error responses

## Monitoring and Logging

The function provides detailed logging for:

- Token verification attempts
- Authentication decisions
- Error conditions
- Performance metrics
- Token type verification methods used

## Usage Examples

### Basic Authentication
```javascript
// API Gateway triggers this lambda with the event
// Lambda validates JWT tokens and returns authorization policy
```

### Token Verification
```javascript
// Primary method: Cognito verification
const payload = await verifier.verify(token);

// Alternative method: Custom JWT verification
const decoded = jwt.verify(token, JWT_SECRET);
```

## Configuration

### Cognito Setup
```javascript
// Required Cognito configuration
const cognitoConfig = {
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  clientId: process.env.COGNITO_CLIENT_ID
};
```

### Environment Variables
```bash
JWT_SECRET=your-jwt-secret
COGNITO_USER_POOL_ID=us-east-1_xxxxx
COGNITO_CLIENT_ID=client-id-here
```

## Related Components

- **DTO**: Handles parameter extraction and validation
- **Model**: Contains token verification logic
- **Types**: Common type definitions and constants
- **Validation**: Environment variable validation

## Deployment

This lambda function is deployed as an API Gateway authorizer and is triggered automatically for all API requests that require B2C authentication.

## Best Practices

- **Token Expiration**: Configure appropriate token expiration times
- **Secret Management**: Store JWT secrets securely
- **Error Logging**: Monitor authentication failures
- **Performance**: Optimize token verification for high-traffic scenarios 