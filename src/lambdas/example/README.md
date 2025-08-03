# Example Lambda Function

## Overview

This is a basic example Lambda function that demonstrates the fundamental structure and patterns used across all Lambda functions in this repository. It serves as a template and reference implementation for developers getting started with the project.

## Purpose

The example Lambda function is designed to:
- Demonstrate the basic Lambda handler structure
- Show how to use shared utilities (HTTP response formatting)
- Provide a simple "Hello World" implementation
- Serve as a starting point for new Lambda function development
- Illustrate proper error handling patterns

## Technical Details

### Input

- **Event**: `unknown` - Generic event object that can contain any data
- **Context**: `unknown` - Lambda execution context (not used in this implementation)

The function accepts any event structure as it's designed to be a generic example.

### Output

- **Success Response**: HTTP 200 with "hello word from lambda" message
- **Error Response**: HTTP 500 with error details

Response format follows the standard HTTP response structure using the shared `httpResponse` utility.

### Environment Variables

This function does not require any specific environment variables.

### Dependencies

- **Shared Utilities**: 
  - `../../shared/responses/http` - HTTP response formatting utility
- **External Libraries**: None specific to this function

## Setup and Usage

### Local Development

1. Ensure you have Node.js and TypeScript installed
2. Install project dependencies:
   ```bash
   npm install
   ```
3. The function can be invoked locally using the development setup

### Testing

To test this function locally:

1. Create a test event (any JSON object will work)
2. The function will log the received event and return a success response
3. Example test event:
   ```json
   {
     "test": "data",
     "message": "Hello from test"
   }
   ```

### Build and Deployment

1. Use the build script to compile with ncc:
   ```bash
   npm run build
   ```
2. Select "example" when prompted for the Lambda function to build
3. The compiled function will be available in `./dist/index.js`

## Error Handling and Troubleshooting

### Common Errors

- **Compilation Errors**: Ensure TypeScript is properly configured
- **Import Errors**: Verify that shared utilities are accessible

### Error Response Format

```json
{
  "statusCode": 500,
  "body": "{\"error_details\"}"
}
```

### Troubleshooting

- Check console logs for event details and error messages
- Verify that the shared HTTP response utility is properly imported
- Ensure the function handler is exported correctly

## Examples

### Sample Invocation

```typescript
// Event input
{
  "message": "Test message",
  "data": {
    "key": "value"
  }
}
```

### Expected Response

```json
{
  "statusCode": 200,
  "body": "\"hello word from lambda\""
}
```

### Error Response Example

```json
{
  "statusCode": 500,
  "body": "{\"message\":\"Error details here\"}"
}
```

## Notes

- This function serves as a template for creating new Lambda functions
- The typo "hello word" is preserved from the original implementation
- Consider this function as a starting point for more complex implementations
- Always follow the established patterns when creating new Lambda functions