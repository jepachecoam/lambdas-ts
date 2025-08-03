# Reconciliation Mastershop Load Items To Queue Process Lambda Function

## Overview

This Lambda function loads reconciliation items from the database into a processing queue for the Mastershop reconciliation system. It retrieves pending reconciliation items based on operation type, queues them for processing, and manages the workflow for automated reconciliation operations. The function serves as a bridge between stored reconciliation data and the processing pipeline.

## Purpose

The reconciliation queue loading function is designed to:
- Retrieve pending reconciliation items from the database based on operation type
- Load reconciliation items into processing queues for automated processing
- Manage different types of reconciliation operations (payments, orders, inventory)
- Support batch processing of reconciliation items
- Provide workflow orchestration for reconciliation processes
- Handle environment-specific queue configurations
- Enable scalable processing of large reconciliation datasets

## Technical Details

### Input

The function expects an event with the following structure:

```typescript
{
  operationType: string,  // Required: Type of reconciliation operation
  environment: string     // Required: Environment (dev, prod, etc.)
}
```

### Output

The function does not return a specific response structure. It performs queue loading operations and logs the results. Success is indicated through console logs.

**Console Output Example**:
```
event =>>> {"operationType":"payment-reconciliation","environment":"prod"}
Finished loadItemsToQueueReconciliationProcess
```

### Environment Variables

- **Database Environment Variables**: Inherited from `dbEnv` shared type
  - Database connection parameters
  - Environment-specific configuration
- **Function-Specific Variables**: Defined in `Envs` type
  - Queue configuration settings
  - SQS queue URLs and parameters
  - Batch processing configuration

### Dependencies

- **AWS Services**:
  - SQS: For queuing reconciliation items for processing
  - Database services: For retrieving pending reconciliation items
- **Shared Utilities**:
  - `../../shared/types/database` - Database type definitions and environment variables
  - `../../shared/validation/envChecker` - Environment variable validation
- **Internal Components**:
  - `./dto` - Data transfer object for event parsing
  - `./model` - Business logic for queue loading operations
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

2. Configure SQS queue settings:
   ```bash
   export AWS_REGION=us-east-1
   export RECONCILIATION_QUEUE_URL=your-sqs-queue-url
   ```

3. Set up environment-specific configurations as defined in Envs type

4. Ensure database tables contain reconciliation items ready for processing

### Testing

#### Test Event Structure

```json
{
  "operationType": "payment-reconciliation",
  "environment": "dev"
}
```

#### Alternative Operation Types

```json
{
  "operationType": "order-reconciliation",
  "environment": "prod"
}
```

#### Database Requirements

- Reconciliation items table with pending items
- Proper indexing for efficient item retrieval
- Status tracking for processed vs pending items

### Build and Deployment

1. Build the function:
   ```bash
   npm run build
   ```
2. Select "reconciliation-mastershop-loadItemsToQueueReconciliationProcess" when prompted
3. Deploy as a scheduled or event-driven Lambda function
4. Configure appropriate triggers (EventBridge scheduled events, manual triggers)

## Error Handling and Troubleshooting

### Common Errors

1. **Database Connection Errors**
   - Verify database environment variables are set correctly
   - Check database connectivity and permissions
   - Ensure reconciliation tables exist and are accessible

2. **Queue Access Errors**
   - Verify SQS queue URLs are correct
   - Check AWS credentials and permissions for SQS operations
   - Ensure queue exists and is accessible

3. **Operation Type Errors**
   - Verify operation type is supported by the system
   - Check that corresponding reconciliation data exists
   - Ensure operation type matches expected format

4. **Environment Configuration Errors**
   - Verify environment parameter matches deployed environment
   - Check environment-specific configurations are correct

### Operation Types

The function supports different operation types for reconciliation:
- Payment reconciliation operations
- Order reconciliation operations
- Inventory reconciliation operations
- Custom reconciliation types based on business requirements

### Troubleshooting

1. Check CloudWatch logs for detailed processing information
2. Verify database contains pending reconciliation items
3. Test SQS queue accessibility and permissions
4. Ensure operation type is properly configured
5. Check environment-specific settings and configurations
6. Validate database query performance for large datasets

## Examples

### Successful Queue Loading

**Request**:
```json
{
  "operationType": "payment-reconciliation",
  "environment": "prod"
}
```

**Expected Log Output**:
```
event =>>> {
  "operationType": "payment-reconciliation",
  "environment": "prod"
}
Finished loadItemsToQueueReconciliationProcess
```

**Processing Steps**:
1. Pending payment reconciliation items retrieved from database
2. Items formatted for queue processing
3. Items loaded into SQS queue in batches
4. Queue loading completed successfully

### Order Reconciliation Processing

**Request**:
```json
{
  "operationType": "order-reconciliation",
  "environment": "dev"
}
```

**Processing Steps**:
1. Order reconciliation items retrieved from database
2. Items validated and prepared for processing
3. Items queued for reconciliation processing
4. Process completed with appropriate logging

### No Items to Process

**Request**:
```json
{
  "operationType": "inventory-reconciliation",
  "environment": "prod"
}
```

**Expected Behavior**:
- Database query executed successfully
- No pending items found for processing
- Function completes without errors
- Appropriate logging indicates no items processed

## Data Processing Flow

1. **Event Logging**: Logs incoming event for debugging and monitoring
2. **Environment Validation**: Validates required environment variables
3. **Parameter Extraction**: Extracts operation type and environment from event
4. **Model Initialization**: Creates model instance with environment configuration
5. **Queue Loading**: Retrieves and loads reconciliation items to processing queue
6. **Completion Logging**: Logs successful completion of queue loading process
7. **Error Handling**: Catches and re-throws errors for proper Lambda error handling

## Queue Processing Workflow

1. **Item Retrieval**: Queries database for pending reconciliation items
2. **Batch Formation**: Groups items into appropriate batch sizes for queue processing
3. **Queue Submission**: Sends batches to SQS queue for processing
4. **Status Tracking**: Updates item status to indicate queuing completion
5. **Monitoring**: Provides logging for queue loading metrics and status

## Integration Considerations

- Function serves as orchestrator for reconciliation processing pipeline
- Integrates with downstream reconciliation processing functions
- Supports batch processing for efficient queue utilization
- Handles different reconciliation workflows based on operation type
- Provides foundation for automated reconciliation scheduling

## Business Value

- Enables automated reconciliation processing workflows
- Supports scalable processing of large reconciliation datasets
- Provides reliable queuing mechanism for reconciliation operations
- Facilitates batch processing for improved efficiency
- Enables monitoring and tracking of reconciliation processing status

## Performance Considerations

- Optimized database queries for efficient item retrieval
- Batch processing to minimize queue operations
- Environment-specific configurations for different load requirements
- Proper indexing on reconciliation tables for query performance
- Queue batch size optimization for processing efficiency

## Security Considerations

- Secure database connections and query operations
- Proper AWS IAM permissions for SQS queue access
- Validate operation types to prevent unauthorized processing
- Implement proper error handling to prevent data leakage
- Log security-relevant events for monitoring and auditing
- Ensure sensitive reconciliation data is properly protected