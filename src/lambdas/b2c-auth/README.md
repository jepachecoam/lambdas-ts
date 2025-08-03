# B2C Authentication Lambda

## Overview

The B2C Authentication Lambda is a custom authorizer function designed to handle authentication and authorization for Business-to-Consumer (B2C) API requests. This function validates AWS Cognito tokens to ensure that end-users have proper authentication before accessing protected resources.

## Purpose

This lambda serves as a security gateway for consumer-facing applications, validating both access tokens and ID tokens from AWS Cognito User Pools to authenticate end-users and authorize their access to specific API resources.

## Functionality

### Core Logic

1. **Token Validation**: Validates both access tokens and ID tokens from AWS Cognito User Pools to ensure user authentication.

2. **Token Verification**: Performs comprehensive verification of token signatures, expiration, and issuer information.

3. **Token Consistency Check**: Ensures that access and ID tokens belong to the same user by comparing subject identifiers.

4. **Policy Generation**: Creates IAM policies that either allow or deny access to the requested resource based on token validation results.

5. **Context Enrichment**: Adds client type information to the authorization context for downstream processing.

### Input Processing

The function processes API Gateway events and extracts:
- Authorization token (access token) from headers
- ID token from headers
- Cognito User Pool ID from stage variables
- Cognito Client ID from stage variables
- Method ARN for policy generation
- Path parameters for ARN sanitization

### Authentication Flow

1. **Environment Validation**: Checks that all required environment variables are properly configured
2. **Header Extraction**: Retrieves and validates authorization and ID tokens from request headers
3. **ARN Sanitization**: Processes the method ARN to handle path parameters correctly
4. **Token Verification**: Validates both tokens against the specified Cognito User Pool
5. **Subject Matching**: Ensures both tokens belong to the same authenticated user
6. **Policy Creation**: Generates appropriate allow/deny IAM policy

### Token Verification Process

The function performs dual token verification:
- **Access Token**: Validates the user's authentication status and permissions
- **ID Token**: Confirms user identity and profile information
- **Subject Consistency**: Ensures both tokens reference the same user account

### Response Format

**Successful Authentication:**
```json
{
  "principalId": "user",
  "policyDocument": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": "execute-api:Invoke",
        "Effect": "Allow",
        "Resource": "arn:aws:execute-api:..."
      }
    ]
  },
  "context": {
    "clientType": "B2C"
  },
  "isAuthorized": true
}
```

**Failed Authentication:**
```json
{
  "principalId": "user",
  "policyDocument": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": "execute-api:Invoke",
        "Effect": "Deny",
        "Resource": "arn:aws:execute-api:..."
      }
    ]
  },
  "isAuthorized": false,
  "error": "Token validation failed"
}
```

## Error Handling

The function implements robust error handling:
- Validates environment configuration before processing
- Catches token validation errors and returns appropriate deny policies
- Logs detailed error information for debugging while maintaining security
- Handles token mismatch scenarios gracefully
- Supports both REST API Gateway and HTTP API Gateway response formats

## Integration Points

- **AWS Cognito**: Validates tokens against specified User Pools
- **API Gateway**: Acts as a custom authorizer for consumer-facing endpoints
- **IAM**: Generates IAM policies for resource access control

## Security Features

- **Dual Token Validation**: Requires both access and ID tokens for complete authentication
- **Token Signature Verification**: Validates cryptographic signatures using Cognito's public keys
- **Expiration Checking**: Ensures tokens haven't expired
- **Subject Consistency**: Prevents token substitution attacks by matching user subjects
- **Fail-Safe Design**: Defaults to deny access for any validation failures

## Configuration Requirements

The function requires the following stage variables:
- `cognitoUserPoolId`: The ID of the Cognito User Pool for token validation
- `cognitoClientId`: The client ID for the Cognito application

## Usage Context

This lambda is automatically invoked by API Gateway when:
- End-users access protected consumer-facing APIs
- Mobile or web applications make authenticated requests
- User sessions need validation before accessing personal data or performing actions

The function ensures that only properly authenticated consumers with valid Cognito tokens can access protected resources in the BeMaster platform.