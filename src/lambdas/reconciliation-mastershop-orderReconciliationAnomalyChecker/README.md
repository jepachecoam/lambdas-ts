# Reconciliation Mastershop Order Reconciliation Anomaly Checker Lambda Function

## Overview

This Lambda function processes reconciliation records to detect and handle anomalies in order reconciliation data for the Mastershop system. It analyzes reconciliation records, identifies discrepancies, inconsistencies, and anomalies in order data, and takes appropriate actions to resolve or flag these issues for further investigation.

## Purpose

The order reconciliation anomaly checker function is designed to:
- Process reconciliation records to identify data anomalies and discrepancies
- Detect inconsistencies between order data and reconciliation records
- Analyze patterns that may indicate reconciliation issues or errors
- Flag suspicious or anomalous reconciliation data for review
- Implement automated anomaly resolution where possible
- Generate alerts and notifications for critical anomalies
- Maintain data quality and integrity in the reconciliation process
- Support compliance and audit requirements through anomaly tracking

## Technical Details

### Input

The function expects an event with the following structure:

```typescript
{
  records: Array<{
    // Reconciliation record data
    orderId: string,
    reconciliationData: object,
    timestamp: string,
    // Additional record fields
  }>,
  environment: string  // Required: Environment (dev, prod, etc.)
}
```

### Output

The function does not return a specific response structure. It processes records and performs anomaly detection operations, logging the results. Success is indicated through console logs.

**Console Output Example**:
```
Finished processRecords
```

### Environment Variables

- **Database Environment Variables**: Inherited from `dbEnv` shared type
  - Database connection parameters
  - Environment-specific configuration
- **Function-Specific Variables**: Defined in `Envs` type
  - Anomaly detection thresholds and parameters
  - Alert and notification configurations
  - Processing rules and validation settings

### Dependencies

- **AWS Services**:
  - Database services: For accessing order and reconciliation data
  - Notification services: For anomaly alerts (SNS, SES, etc.)
- **Shared Utilities**:
  - `../../shared/types/database` - Database type definitions and environment variables
  - `../../shared/validation/envChecker` - Environment variable validation
- **Internal Components**:
  - `./dto` - Data transfer object for event parsing
  - `./model` - Business logic for anomaly detection and processing
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

2. Configure anomaly detection settings as defined in Envs type

3. Set up notification channels for anomaly alerts

4. Ensure access to order and reconciliation data tables

### Testing

#### Test Event Structure

```json
{
  "records": [
    {
      "orderId": "ORD123456",
      "reconciliationData": {
        "expectedAmount": 100.00,
        "actualAmount": 95.00,
        "discrepancy": 5.00,
        "status": "processed"
      },
      "timestamp": "2024-01-15T14:30:00Z",
      "source": "payment-processor"
    },
    {
      "orderId": "ORD789012",
      "reconciliationData": {
        "expectedAmount": 250.00,
        "actualAmount": 250.00,
        "discrepancy": 0.00,
        "status": "matched"
      },
      "timestamp": "2024-01-15T14:35:00Z",
      "source": "payment-processor"
    }
  ],
  "environment": "prod"
}
```

#### Anomaly Detection Scenarios

- Amount discrepancies beyond acceptable thresholds
- Missing reconciliation data for processed orders
- Duplicate reconciliation records
- Timing anomalies in reconciliation processing
- Status inconsistencies between systems

### Build and Deployment

1. Build the function:
   ```bash
   npm run build
   ```
2. Select "reconciliation-mastershop-orderReconciliationAnomalyChecker" when prompted
3. Deploy as an event-driven Lambda function
4. Configure triggers from reconciliation processing queues or scheduled events

## Error Handling and Troubleshooting

### Common Errors

1. **Database Connection Errors**
   - Verify database environment variables are set correctly
   - Check database connectivity and permissions
   - Ensure order and reconciliation tables are accessible

2. **Record Processing Errors**
   - Verify record format matches expected structure
   - Check that required fields are present in records
   - Ensure data types are correct for anomaly detection

3. **Anomaly Detection Configuration Errors**
   - Verify anomaly detection thresholds are properly configured
   - Check that detection rules are appropriate for data patterns
   - Ensure notification configurations are correct

### Anomaly Types Detected

The function can detect various types of anomalies:
- **Amount Discrepancies**: Differences between expected and actual amounts
- **Missing Data**: Orders without corresponding reconciliation records
- **Duplicate Records**: Multiple reconciliation entries for the same order
- **Timing Anomalies**: Unusual delays or timing patterns in reconciliation
- **Status Inconsistencies**: Mismatched status between different systems

### Troubleshooting

1. Check CloudWatch logs for detailed processing information
2. Verify record format and data quality
3. Test anomaly detection rules with known anomalous data
4. Ensure database queries are performing efficiently
5. Check notification delivery for anomaly alerts
6. Validate anomaly detection thresholds and parameters

## Examples

### Successful Anomaly Detection

**Request**:
```json
{
  "records": [
    {
      "orderId": "ORD456789",
      "reconciliationData": {
        "expectedAmount": 150.00,
        "actualAmount": 120.00,
        "discrepancy": 30.00,
        "status": "processed"
      },
      "timestamp": "2024-01-15T16:00:00Z",
      "source": "payment-processor"
    }
  ],
  "environment": "prod"
}
```

**Expected Processing**:
1. Record analyzed for anomalies
2. Amount discrepancy of $30.00 detected as anomaly
3. Anomaly flagged for investigation
4. Alert notification sent to operations team
5. Record marked for manual review

**Expected Log Output**:
```
Finished processRecords
```

### Normal Reconciliation Processing

**Request**:
```json
{
  "records": [
    {
      "orderId": "ORD987654",
      "reconciliationData": {
        "expectedAmount": 75.00,
        "actualAmount": 75.00,
        "discrepancy": 0.00,
        "status": "matched"
      },
      "timestamp": "2024-01-15T16:05:00Z",
      "source": "payment-processor"
    }
  ],
  "environment": "prod"
}
```

**Expected Processing**:
1. Record analyzed for anomalies
2. No anomalies detected (perfect match)
3. Record processed normally
4. No alerts generated

### Multiple Records with Mixed Results

**Request**:
```json
{
  "records": [
    {
      "orderId": "ORD111222",
      "reconciliationData": {
        "expectedAmount": 200.00,
        "actualAmount": 200.00,
        "discrepancy": 0.00,
        "status": "matched"
      },
      "timestamp": "2024-01-15T16:10:00Z"
    },
    {
      "orderId": "ORD333444",
      "reconciliationData": {
        "expectedAmount": 300.00,
        "actualAmount": 250.00,
        "discrepancy": 50.00,
        "status": "processed"
      },
      "timestamp": "2024-01-15T16:15:00Z"
    }
  ],
  "environment": "prod"
}
```

**Expected Processing**:
1. First record processed normally (no anomaly)
2. Second record flagged as anomaly (significant discrepancy)
3. Anomaly alert generated for second record
4. Both records processed successfully

## Data Processing Flow

1. **Environment Validation**: Validates required environment variables
2. **Event Parsing**: Extracts records and environment from event
3. **Model Initialization**: Creates model instance with environment configuration
4. **Record Processing**: Analyzes each record for anomalies using detection algorithms
5. **Anomaly Detection**: Applies business rules and thresholds to identify anomalies
6. **Action Taking**: Executes appropriate actions for detected anomalies
7. **Notification**: Sends alerts for critical anomalies
8. **Completion Logging**: Logs successful completion of record processing

## Anomaly Detection Logic

The function implements various anomaly detection algorithms:
- **Threshold-based Detection**: Compares values against predefined thresholds
- **Pattern Analysis**: Identifies unusual patterns in reconciliation data
- **Statistical Analysis**: Uses statistical methods to detect outliers
- **Rule-based Validation**: Applies business rules to validate data consistency
- **Historical Comparison**: Compares current data with historical patterns

## Integration Considerations

- Function integrates with reconciliation processing pipeline
- Supports real-time anomaly detection for streaming reconciliation data
- Provides feedback to upstream reconciliation processes
- Integrates with alerting and monitoring systems
- Supports audit and compliance reporting requirements

## Business Value

- Improves data quality and accuracy in reconciliation processes
- Enables early detection of reconciliation issues and discrepancies
- Reduces manual review effort through automated anomaly detection
- Supports compliance and audit requirements
- Provides insights into reconciliation process performance
- Enables proactive resolution of reconciliation problems

## Security Considerations

- Secure handling of sensitive financial reconciliation data
- Proper access controls for reconciliation and order data
- Validate input data to prevent malicious anomaly injection
- Implement proper error handling to prevent data leakage
- Ensure secure communication with notification systems
- Log security-relevant events for monitoring and auditing
- Protect anomaly detection algorithms and thresholds from unauthorized access