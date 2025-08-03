# Reconciliation Document Check and Load Lambda

## Overview

The Reconciliation Document Check and Load Lambda function processes reconciliation documents (Excel files) from S3 and loads the data into the database. This function handles financial reconciliation processes for payments and charges, ensuring data accuracy and completeness.

## Purpose

This lambda function serves as a data processing engine for financial reconciliation, processing Excel documents containing payment and charge information. It validates, transforms, and loads reconciliation data into the database for further processing and analysis.

## Functionality

### Core Operations

1. **Document Processing**: Processes Excel files from S3 buckets
2. **Data Validation**: Validates data format and content
3. **Data Transformation**: Converts Excel data to database format
4. **Batch Loading**: Loads validated data into the database
5. **Error Handling**: Manages processing errors and validation failures
6. **Notification System**: Sends Slack notifications for processing status

### Supported Document Types

- **Payment Reconciliation**: Payment data from financial institutions
- **Charge Reconciliation**: Charge data from payment processors
- **Excel Formats**: .xlsx and .xls file formats
- **Multiple Sheets**: Processes first worksheet of Excel files

### Processing Features

- **Stream Processing**: Processes large Excel files efficiently
- **Batch Operations**: Handles data in configurable batch sizes
- **Data Validation**: Validates data types and formats
- **Error Reporting**: Comprehensive error reporting and logging
- **Progress Tracking**: Monitors processing progress and completion

## Business Logic

### Document Processing Workflow

1. **S3 File Retrieval**: Retrieves Excel file from S3 bucket
2. **Stream Creation**: Creates Excel stream reader for processing
3. **Worksheet Processing**: Processes the first worksheet of the Excel file
4. **Header Extraction**: Extracts column headers from the first row
5. **Row Processing**: Processes each data row with validation
6. **Batch Loading**: Loads validated data in batches
7. **Error Handling**: Manages validation and processing errors
8. **Notification**: Sends processing status notifications

### Data Validation Process

- **Schema Validation**: Validates data against predefined schemas
- **Type Checking**: Ensures data types match expected formats
- **Required Field Validation**: Checks for required fields
- **Format Validation**: Validates data formats (dates, numbers, etc.)
- **Business Rule Validation**: Applies business-specific validation rules

### Reconciliation Types

#### Payment Reconciliation
- **Schema**: Payment-specific data schema
- **Validation**: Payment amount, date, reference validation
- **Transformation**: Converts to payment database format
- **Loading**: Loads into payment reconciliation tables

#### Charge Reconciliation
- **Schema**: Charge-specific data schema
- **Validation**: Charge amount, date, reference validation
- **Transformation**: Converts to charge database format
- **Loading**: Loads into charge reconciliation tables

## Input/Output

### Input (Event)

```json
{
  "bucket": "reconciliation-bucket",
  "key": "documents/payments-2024-01.xlsx",
  "conciliationType": "payments|charges",
  "environment": "production"
}
```

### Output

- **Success**: Data loaded successfully
- **Error**: Error logged and Slack notification sent

## Dependencies

- **S3**: For document storage and retrieval
- **ExcelJS**: For Excel file processing
- **Database**: MySQL database for data storage
- **Slack**: For notification system
- **AWS Services**: For logging and monitoring

## Environment Variables

- `BATCH_SIZE`: Number of records to process in each batch
- `SLACK_WEBHOOK_URL`: Slack webhook for notifications
- Database connection configurations
- S3 bucket configurations

## Error Handling

- **File Access Errors**: Handles S3 file access failures
- **Excel Processing Errors**: Manages Excel file parsing errors
- **Validation Errors**: Handles data validation failures
- **Database Errors**: Manages database connection and insertion errors
- **Notification Errors**: Handles Slack notification failures

## Security Features

- **Data Validation**: Validates all input data before processing
- **Error Masking**: Prevents sensitive data leakage in error messages
- **Access Control**: Ensures secure access to S3 and database
- **Audit Logging**: Maintains complete audit trail of processing

## Monitoring and Logging

The function provides detailed logging for:

- File processing start and completion
- Row processing progress
- Validation results and errors
- Database loading operations
- Error conditions and recovery
- Performance metrics and timing

## Usage Examples

### Basic Document Processing
```javascript
// Process reconciliation document
await model.processWorksheet(workbookReaderStream, conciliationType);
```

### Batch Processing
```javascript
// Process data in batches
if (validRows.length >= batchSize) {
  await this.saveRows(records, conciliationType);
}
```

### Error Notification
```javascript
// Send Slack notification for errors
await Model.sendSlackNotification({
  conciliationType: "payments",
  step: "Validation",
  data: errors,
  environment: "production"
});
```

## Related Components

- **DAO**: Manages database interactions and S3 operations
- **Model**: Contains business logic for document processing
- **DTO**: Manages data transformation and validation
- **Schemas**: Data validation schemas for different reconciliation types
- **Validators**: Data validation utilities
- **Types**: Common type definitions and enums

## Deployment

This lambda function is typically triggered by:
- S3 events when new documents are uploaded
- Scheduled events for batch processing
- API Gateway for manual processing
- EventBridge for automated processing

## Best Practices

- **Data Validation**: Implement comprehensive data validation
- **Batch Processing**: Use appropriate batch sizes for performance
- **Error Handling**: Implement robust error handling and recovery
- **Monitoring**: Set up comprehensive monitoring and alerting
- **Audit Trail**: Maintain logs for compliance and debugging

## Performance Considerations

- **Stream Processing**: Use streaming for large Excel files
- **Batch Sizes**: Optimize batch sizes for database performance
- **Memory Management**: Efficient memory usage for large datasets
- **Concurrent Processing**: Handle multiple simultaneous documents

## Business Impact

- **Financial Accuracy**: Ensures accurate financial reconciliation
- **Compliance**: Maintains audit trails for regulatory requirements
- **Operational Efficiency**: Automates manual reconciliation processes
- **Cost Reduction**: Reduces manual data entry and processing

## Integration Points

- **S3 Storage**: For document storage and retrieval
- **Database Systems**: For data storage and retrieval
- **Slack**: For notification system
- **Analytics Systems**: For reconciliation analytics
- **Reporting Systems**: For financial reporting

## Data Quality

- **Validation**: Comprehensive data validation before processing
- **Accuracy**: Ensures data accuracy and completeness
- **Consistency**: Maintains data consistency across processing
- **Completeness**: Ensures all required data is processed

## Error Scenarios

- **Invalid File Format**: Handles non-Excel files
- **Missing Data**: Manages missing required fields
- **Invalid Data Types**: Handles incorrect data types
- **Database Failures**: Manages database connection issues
- **Processing Timeouts**: Handles long-running processes 