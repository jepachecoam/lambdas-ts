# B2C Authentication Lambda Function

## Overview

This Lambda function provides API Gateway authorization for Business-to-Consumer (B2C) clients. It validates JWT tokens from AWS Cognito User Pools, verifies both access and ID tokens, and generates IAM policies to allow or deny access to API resources. The function supports both Cognito JWT verification and alternative JWT verification using a custom secret.

## Purpose

The B2C authentication function is designed to:
- Authenticate B2C clients using Cognito JWT tokens (access and ID tokens)
- Validate token authenticity against AWS Cognito User Pools
- Support alternative JWT verification using custom JWT secrets
- Generate IAM policies for API Gateway authorization
- Support both REST API Gateway and HTTP API Gateway formats
- Ensure token consistency by matching subject IDs between access and ID tokens
- Provide detailed error logging for security auditing

## Technical Details

### Input

The function expects an API Gateway authorization event with the following structure:

```typescript
{
  methodArn: string,           // REST API Gateway ARN
  routeArn?: string,          // HTTP API Gateway ARN (alternative)
  headers: {
    "authorization": string,   // Required: "Bearer <access_token>"
    "x-auth-id": string,      // Required: ID token
    "x-client-type"?: string  // Must NOT be present (B2C only)
  },
  stageVariables: {
    cognitoIssuer: string,     // Required: Cognito issuer URL
    cognitoUserPoolId: string, // Required: Cognito User Pool ID
    cognitoClientId: string    // Required: Cognito Client ID
  },
  pathParameters?: object      // Path parameters for ARN sanitization
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
    "clientType": "B2C"
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
  "isAuthorized": false,
  "error": "Error message"
}
```

### Environment Variables

- **JWT_SECRET**: Required for alternative JWT verification when Cognito verification fails for ID tokens
- **AWS_REGION**: AWS region for Cognito operations (inherited from Lambda environment)

### Dependencies

- **AWS Services**:
  - AWS Cognito User Pools: Primary JWT token verification
- **External Libraries**:
  - `aws-jwt-verify`: Cognito JWT verification
  - `jsonwebtoken`: Alternative JWT verification
- **Shared Utilities**:
  - `../../shared/validation/envChecker` - Environment variable validation

## Setup and Usage

### Local Development

1. Configure AWS credentials with access to Cognito User Pools

2. Set up environment variables:
   ```bash
   export JWT_SECRET=your-jwt-secret-key
   export AWS_REGION=us-east-1
   ```

3. Ensure the following AWS resources exist:
   - Cognito User Pool with the specified User Pool ID
   - Cognito User Pool Client with the specified Client ID

4. Configure API Gateway stage variables:
   - `cognitoIssuer`: Your Cognito issuer URL
   - `cognitoUserPoolId`: Your Cognito User Pool ID
   - `cognitoClientId`: Your Cognito Client ID

### Testing

#### Test Event Structure

```json
{
  "methodArn": "arn:aws:execute-api:us-east-1:123456789:abcdef123/prod/GET/profile",
  "headers": {
    "authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "x-auth-id": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "stageVariables": {
    "cognitoIssuer": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX",
    "cognitoUserPoolId": "us-east-1_XXXXXXXXX",
    "cognitoClientId": "your-client-id"
  },
  "pathParameters": {
    "userId": "123"
  }
}
```

#### Token Requirements

- **Access Token**: Must be a valid Cognito access token with `token_use: "access"`
- **ID Token**: Must be a valid Cognito ID token with `token_use: "id"`, or a custom JWT signed with JWT_SECRET
- **Subject Matching**: Both tokens must have the same `sub` claim (unless using alternative method)

### Build and Deployment

1. Build the function:
   ```bash
   npm run build
   ```
2. Select "b2c-auth" when prompted
3. Deploy the compiled function as an API Gateway authorizer
4. Configure stage variables in API Gateway

## Error Handling and Troubleshooting

### Common Errors

1. **"Missing required"**
   - Ensure all required headers and stage variables are provided
   - Verify authorization header starts with "Bearer "

2. **"Client type not allowed"**
   - Remove `x-client-type` header (B2C clients should not send this)

3. **"token verification failed"**
   - Verify tokens are valid and not expired
   - Check Cognito User Pool configuration
   - Ensure JWT_SECRET is set for alternative verification

4. **"Token mismatch"**
   - Verify both access and ID tokens belong to the same user
   - Check that `sub` claims match between tokens

### Token Verification Flow

1. **Access Token**: Always verified against Cognito User Pool
2. **ID Token**: 
   - First attempts Cognito verification
   - Falls back to custom JWT verification using JWT_SECRET
   - Alternative method sets `alternativeMethod: true` flag

### Troubleshooting

1. Check CloudWatch logs for detailed token verification errors
2. Verify Cognito User Pool and Client configuration
3. Test tokens using AWS CLI or Cognito console
4. Ensure JWT_SECRET matches the signing key for custom tokens
5. Verify stage variables are properly configured in API Gateway

## Examples

### Successful Authorization with Cognito Tokens

**Request**:
```json
{
  "methodArn": "arn:aws:execute-api:us-east-1:123456789:abcdef123/prod/GET/profile/user123",
  "headers": {
    "authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwidG9rZW5fdXNlIjoiYWNjZXNzIiwic2NvcGUiOiJhd3MuY29nbml0by5zaWduaW4udXNlci5hZG1pbiIsImF1dGhfdGltZSI6MTY0MDk5NTIwMCwiaXNzIjoiaHR0cHM6Ly9jb2duaXRvLWlkcC51cy1lYXN0LTEuYW1hem9uYXdzLmNvbS91cy1lYXN0LTFfWFhYWFhYWFhYIiwiZXhwIjoxNjQwOTk4ODAwLCJpYXQiOjE2NDA5OTUyMDAsInZlcnNpb24iOjIsImp0aSI6ImFiY2RlZi0xMjM0LTU2NzgtOTBhYi1jZGVmZ2hpams5MDEiLCJjbGllbnRfaWQiOiJ5b3VyLWNsaWVudC1pZCJ9...",
    "x-auth-id": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwidG9rZW5fdXNlIjoiaWQiLCJhdWQiOiJ5b3VyLWNsaWVudC1pZCIsImF1dGhfdGltZSI6MTY0MDk5NTIwMCwiaXNzIjoiaHR0cHM6Ly9jb2duaXRvLWlkcC51cy1lYXN0LTEuYW1hem9uYXdzLmNvbS91cy1lYXN0LTFfWFhYWFhYWFhYIiwiZXhwIjoxNjQwOTk4ODAwLCJpYXQiOjE2NDA5OTUyMDAsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSJ9..."
  },
  "stageVariables": {
    "cognitoIssuer": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX",
    "cognitoUserPoolId": "us-east-1_XXXXXXXXX",
    "cognitoClientId": "your-client-id"
  },
  "pathParameters": {
    "userId": "user123"
  }
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
      "Resource": "arn:aws:execute-api:us-east-1:123456789:abcdef123/prod/GET/profile/*"
    }]
  },
  "context": {
    "clientType": "B2C"
  }
}
```

### Authorization with Alternative JWT Verification

**Request with Custom ID Token**:
```json
{
  "methodArn": "arn:aws:execute-api:us-east-1:123456789:abcdef123/prod/POST/orders",
  "headers": {
    "authorization": "Bearer <cognito-access-token>",
    "x-auth-id": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.custom-signature"
  },
  "stageVariables": {
    "cognitoUserPoolId": "us-east-1_XXXXXXXXX",
    "cognitoClientId": "your-client-id"
  }
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
      "Resource": "arn:aws:execute-api:us-east-1:123456789:abcdef123/prod/POST/orders"
    }]
  },
  "context": {
    "clientType": "B2C"
  }
}
```

### Failed Authorization

**Request with Invalid Token**:
```json
{
  "methodArn": "arn:aws:execute-api:us-east-1:123456789:abcdef123/prod/GET/profile",
  "headers": {
    "authorization": "Bearer invalid-token",
    "x-auth-id": "invalid-id-token"
  },
  "stageVariables": {
    "cognitoUserPoolId": "us-east-1_XXXXXXXXX",
    "cognitoClientId": "your-client-id"
  }
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
      "Resource": "arn:aws:execute-api:us-east-1:123456789:abcdef123/prod/GET/profile"
    }]
  },
  "isAuthorized": false,
  "error": "token verification failed"
}
```