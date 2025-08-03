# B2B Authentication Lambda

## Overview

The B2B Authentication Lambda is a custom authorizer function designed to handle authentication and authorization for Business-to-Business (B2B) API requests. This function validates API keys and application permissions to determine whether incoming requests should be allowed or denied access to protected resources.

## Purpose

This lambda serves as a security gateway for B2B integrations, ensuring that only authorized applications with valid API keys can access specific resources and HTTP methods within the BeMaster ecosystem.

## Functionality

### Core Logic

1. **Request Analysis**: Extracts authentication parameters from the incoming event, including API key, application name, HTTP method, and resource path.

2. **ARN Normalization**: Processes and normalizes the method ARN to handle both REST API Gateway and HTTP API Gateway formats.

3. **Authorization Check**: Validates the provided API key against the configured application permissions for the specific resource and HTTP method.

4. **Policy Generation**: Creates an IAM policy response that either allows or denies access to the requested resource.

5. **Context Enrichment**: When authorization is successful, adds contextual information about the authorized application and client type.

### Input Processing

The function processes events from API Gateway and extracts:
- Stage information
- API key for authentication
- Application name identifier
- HTTP method being requested
- Resource path being accessed
- Method ARN for policy generation

### Authorization Flow

1. **Parameter Extraction**: Retrieves authentication details from the event
2. **Model Initialization**: Creates a model instance with the appropriate stage configuration
3. **Permission Validation**: Checks if the API key has permission to access the requested resource
4. **Response Generation**: Creates appropriate allow/deny policy with context information

### Response Format

**Successful Authorization:**
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
    "authorizedToAccess": "application-name",
    "clientType": "B2B"
  },
  "isAuthorized": true
}
```

**Failed Authorization:**
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
  "isAuthorized": false
}
```

## Error Handling

The function implements comprehensive error handling:
- Catches and logs authorization errors
- Returns deny policy for any authentication failures
- Provides appropriate error context while maintaining security
- Handles both REST API Gateway and HTTP API Gateway formats

## Integration Points

- **API Gateway**: Acts as a custom authorizer for API Gateway endpoints
- **Database**: Queries application and API key configurations through the model layer
- **IAM**: Generates IAM policies for resource access control

## Security Features

- **API Key Validation**: Ensures only valid API keys can access resources
- **Resource-Level Authorization**: Granular control over which resources each application can access
- **Method-Level Permissions**: Controls access based on HTTP methods (GET, POST, PUT, DELETE, etc.)
- **Fail-Safe Design**: Defaults to deny access in case of errors or invalid configurations

## Usage Context

This lambda is typically invoked automatically by API Gateway when:
- B2B partners make API calls to protected endpoints
- Applications attempt to access resources requiring authentication
- Integration services need to validate permissions before processing requests

The function ensures that only properly authenticated and authorized B2B clients can access the BeMaster platform's protected resources.