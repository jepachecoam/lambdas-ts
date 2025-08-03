# Reconciliation Check Document And Load Items To DB Lambda Function

## Overview

This Lambda function processes reconciliation documents stored in S3, validates their content, and loads the reconciliation items into the database. It handles Excel workbooks containing reconciliation data, processes worksheets based on conciliation type, and provides error handling with Slack notifications for monitoring failed reconciliation processes.

## Purpose

The reconciliation document processing function is designed to:
- Retrieve and process reconciliation documents from S3 storage
- Read and parse Excel workbooks containing reconciliation data
- Validate reconciliation document structure and content
- Load reconciliation items into the database for further processing
- Handle different types of reconciliation processes based on conciliation type
- Provide error handling and monitoring through Slack notifications
- Support automated reconciliation workflows and batch processing

## Technical Details

### Input

The function expects an event with the following structure:

```typescript
{
  bucket: string,           // Required: S3 bucket containing the reconciliation document
  key: string,             // Required: S3 object key for the reconciliation file
  conciliationType: string, // Required: Type of reconciliation process
  environment: string      // Required: Environment (dev, prod, etc.)
}
```

### Output

The function does not return a specific response structure. It performs document processing and database operations, logging the results. Success is indicated through console logs.

**Console Output Example**:
```
Finished processWorksheet
```

### Environment Variables

- **Database Environment Variables**: Inherited from `dbEnv` shared type
  - Database connection parameters
  - Environment-specific configuration
- **Function-Specific Variables**: Defined in `Envs` type
  - S3 access configuration
  - Slack webhook configuration for notifications
  - Reconciliation processing settings

### Dependencies

- **AWS Services**:
  - S3: For retrieving reconciliation documents
  - Database services: For storing reconciliation items
- **External Libraries**:
  - Excel processing libraries for workbook reading
- **Shared Utilities**:
  - `../../shared/types/database` - Database type definitions and environment variables
  - `../../shared/validation/envChecker` - Environment variable validation
- **Internal Components**:
  - `./dto` - Data transfer object for parameter extraction
  - `./model` - Business logic for document processing and database operations
  - `./types` - Type definitions and environment variables

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

2. Configure AWS credentials for S3 access:
   ```bash
   export AWS_REGION=us-east-1
   ```

3. Set up Slack webhook for error notifications:
   ```bash
   export SLACK_WEBHOOK_URL=your-slack-webhook-url
   ```

4. Ensure S3 bucket permissions for reading reconciliation documents

### Testing

#### Test Event Structure

```json
{
  "bucket": "reconciliation-documents-bucket",
  "key": "reconciliation/2024/01/reconciliation-report-20240115.xlsx",
  "conciliationType": "payment-reconciliation",
  "environment": "dev"
}
```

#### Document Requirements

- Excel workbook format (.xlsx)
- Proper worksheet structure based on conciliation type
- Valid data format for reconciliation items
- Accessible from specified S3 bucket and key

### Build and Deployment

1. Build the function:
   ```bash
   npm run build
   ```
2. Select "reconciliation-checkReconciliationDocumentAndLoadItemsToDb" when prompted
3. Deploy as an event-driven Lambda function
4. Configure appropriate triggers (S3 events, SQS, EventBridge)

## Error Handling and Troubleshooting

### Common Errors

1. **S3 Access Errors**
   - Verify S3 bucket and key exist
   - Check AWS credentials and permissions
   - Ensure bucket is accessible from Lambda execution role

2. **Document Format Errors**
   - Verify document is a valid Excel workbook
   - Check worksheet structure matches expected format
   - Ensure data types and columns are correct

3. **Database Connection Errors**
   - Verify database environment variables are set correctly
   - Check database connectivity and permissions
   - Ensure reconciliation tables exist

4. **Processing Errors**
   - Check conciliation type is supported
   - Verify document content matches expected schema
   - Ensure data validation rules are met

### Slack Notification Integration

The function sends Slack notifications for:
- Critical processing errors
- Document validation failures
- Database operation errors
- Unhandled exceptions during processing

### Troubleshooting

1. Check CloudWatch logs for detailed processing information
2. Verify S3 document accessibility and format
3. Test database connectivity and table structure
4. Validate document content against expected schema
5. Check Slack webhook configuration for error notifications
6. Ensure proper AWS permissions for S3 and database access

## Examples

### Successful Document Processing

**Request**:
```json
{
  "bucket": "mastershop-reconciliation",
  "key": "monthly-reports/2024-01-15-payment-reconciliation.xlsx",
  "conciliationType": "payment-reconciliation",
  "environment": "prod"
}
```

**Expected Log Output**:
```
Finished processWorksheet
```

**Processing Steps**:
1. Document retrieved from S3
2. Excel workbook parsed successfully
3. Reconciliation items validated and loaded to database
4. Processing completed without errors

### S3 Access Error

**Request with Invalid Bucket**:
```json
{
  "bucket": "non-existent-bucket",
  "key": "reconciliation-report.xlsx",
  "conciliationType": "payment-reconciliation",
  "environment": "prod"
}
```

**Expected Behavior**:
- Error logged to CloudWatch
- Slack notification sent with error details
- Function execution fails gracefully

### Document Format Error

**Request with Invalid Document**:
```json
{
  "bucket": "reconciliation-documents",
  "key": "invalid-document.txt",
  "conciliationType": "payment-reconciliation",
  "environment": "prod"
}
```

**Expected Behavior**:
- Document parsing fails
- Error details logged
- Slack notification sent
- Processing stops with appropriate error handling

## Data Processing Flow

1. **Environment Validation**: Validates required environment variables
2. **Parameter Extraction**: Extracts S3 location and processing parameters
3. **Document Retrieval**: Gets workbook reader stream from S3
4. **Worksheet Processing**: Processes Excel worksheet based on conciliation type
5. **Data Validation**: Validates reconciliation data format and content
6. **Database Loading**: Loads validated reconciliation items to database
7. **Completion Logging**: Logs successful processing completion
8. **Error Handling**: Sends Slack notifications for any processing errors

## Reconciliation Types

The function supports different conciliation types, each with specific processing logic:
- Payment reconciliation
- Order reconciliation
- Inventory reconciliation
- Custom reconciliation types based on business requirements

## Integration Considerations

- Function is designed for batch processing of reconciliation documents
- Supports automated workflows triggered by S3 document uploads
- Integrates with monitoring systems through Slack notifications
- Handles large Excel documents efficiently through streaming
- Provides foundation for automated reconciliation processes

## Business Value

- Automates manual reconciliation document processing
- Ensures data consistency and accuracy in reconciliation processes
- Provides scalable solution for handling large reconciliation datasets
- Enables real-time monitoring of reconciliation operations
- Supports compliance and audit requirements through detailed logging

## Security Considerations

- Secure handling of sensitive reconciliation data
- Proper S3 bucket permissions and access controls
- Validate document content to prevent malicious data injection
- Implement proper error handling to prevent data leakage
- Ensure secure database connections and operations
- Log security-relevant events for monitoring and auditing