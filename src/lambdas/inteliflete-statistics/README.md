# Inteliflete Statistics Lambda Function

## Overview

This Lambda function processes and updates carrier statistics for the Inteliflete system. It calculates and stores various shipping and return statistics including state-level return rates, city-level return rates, and origin-destination delivery time averages. The function aggregates data from order history and updates a DynamoDB table with current statistics for carrier performance analysis.

## Purpose

The Inteliflete statistics function is designed to:
- Calculate return statistics by states and cities for different payment methods
- Compute average delivery time differences between origin and destination cities
- Update carrier performance statistics in DynamoDB
- Provide data for carrier performance analysis and decision-making
- Support business intelligence and reporting for shipping operations
- Maintain historical statistics with timestamp tracking

## Technical Details

### Input

The function expects an event with the following structure:

```typescript
{
  stage: string  // Required: Environment stage ("dev" or "prod")
}
```

### Output

The function does not return a specific response structure. It performs database operations and logs the results. Success is indicated through console logs showing the number of statistics updated.

**Console Output Example**:
```
Statistics updated 150
Finished updateStatistics
```

### Environment Variables

- **Database Environment Variables**: Inherited from `dbEnv` shared type
  - Database connection parameters for order data retrieval
  - Environment-specific configuration
- **AWS_REGION**: AWS region for DynamoDB operations

### Dependencies

- **AWS Services**:
  - DynamoDB: Stores carrier statistics (`Mastershop-Carrier-Stats` table)
  - Database services: Source data for statistics calculation
- **Shared Utilities**:
  - `../../shared/responses/http` - HTTP response formatting
  - `../../shared/types/database` - Database type definitions and environment variables
  - `../../shared/validation/envChecker` - Environment variable validation
- **Internal Components**:
  - `./dto` - Data transfer object for parameter validation
  - `./model` - Business logic for statistics calculation
  - `./types` - Type definitions and enums
  - `./utils` - Utility functions for date formatting

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

2. Configure AWS credentials for DynamoDB access:
   ```bash
   export AWS_REGION=us-east-1
   ```

3. Ensure required database tables and DynamoDB table exist:
   - Source tables with order and shipping data
   - `Mastershop-Carrier-Stats` DynamoDB table

### Testing

#### Test Event Structure

```json
{
  "stage": "dev"
}
```

or

```json
{
  "stage": "prod"
}
```

#### Expected Database Structure

The function expects source data with:
- Order information with carrier details
- Shipping addresses with state and city information
- Return status tracking
- Payment method information (COD/PIA)
- Timestamp data for delivery time calculations

### Build and Deployment

1. Build the function:
   ```bash
   npm run build
   ```
2. Select "inteliflete-statistics" when prompted
3. Deploy as a scheduled Lambda function (typically run periodically)
4. Configure appropriate triggers (EventBridge scheduled events)

## Error Handling and Troubleshooting

### Common Errors

1. **"stage not found"**
   - Ensure the `stage` parameter is provided
   - Verify stage value is either "dev" or "prod"

2. **Database Connection Errors**
   - Verify database environment variables are set correctly
   - Check database connectivity and permissions
   - Ensure source tables exist and contain data

3. **DynamoDB Access Errors**
   - Verify AWS credentials and permissions
   - Check that `Mastershop-Carrier-Stats` table exists
   - Ensure proper IAM permissions for DynamoDB operations

### Statistics Categories

The function processes three types of statistics:

1. **STATES_RETURN_STATISTICS**: Return rates by state and payment method
2. **CITIES_RETURN_STATISTICS**: Return rates by city and payment method  
3. **ORIGIN_AND_DESTINATION_AVG_HOUR_DIFF**: Average delivery times between cities

### Minimum Order Requirements

- All statistics require a minimum of 30 orders to be included
- This threshold ensures statistical significance
- Carriers/routes with fewer orders are excluded from statistics

### Troubleshooting

1. Check CloudWatch logs for detailed processing information
2. Verify source data quality and completeness
3. Ensure DynamoDB table has proper read/write capacity
4. Check that carrier IDs and city codes are properly formatted
5. Verify date/time data is available for delivery time calculations

## Examples

### Successful Statistics Update

**Request**:
```json
{
  "stage": "prod"
}
```

**Expected Log Output**:
```
params =>>> {"stage":"prod"}
Statistics updated 150
Finished updateStatistics
```

**DynamoDB Records Created**:

**State Return Statistics**:
```json
{
  "pk": "123",
  "sk": "cod-State-Antioquia",
  "shippingStateName": "Antioquia",
  "totalOrders": 1250,
  "totalOrdersReturned": 75,
  "returnPercentage": 6.0,
  "lastUpdate": "2024-01-15 14:30",
  "category": "STATES_RETURN_STATISTICS"
}
```

**City Return Statistics**:
```json
{
  "pk": "123",
  "sk": "pia-City-05001",
  "shippingCityName": "Medellín",
  "totalOrders": 850,
  "totalOrdersReturned": 42,
  "returnPercentage": 4.9,
  "lastUpdate": "2024-01-15 14:30",
  "category": "CITIES_RETURN_STATISTICS"
}
```

**Origin-Destination Statistics**:
```json
{
  "pk": "123",
  "sk": "cod-11001-05001",
  "avgHourDiff": 26.5,
  "totalOrders": 320,
  "lastUpdate": "2024-01-15 14:30",
  "category": "ORIGIN_AND_DESTINATION_AVG_HOUR_DIFF",
  "originCityName": "Bogotá",
  "shippingCityName": "Medellín"
}
```

### Error Scenarios

**Invalid Stage**:
```json
{
  "stage": "invalid"
}
```

**Error Response**:
```
Error: stage not found
```

**Missing Stage**:
```json
{}
```

**Error Response**:
```
Error: stage not found
```

## Data Processing Flow

1. **Parameter Validation**: Validates stage parameter
2. **Environment Check**: Validates database environment variables
3. **Parallel Data Retrieval**: Fetches three types of statistics concurrently:
   - Return statistics by states
   - Return statistics by cities
   - Origin and destination delivery time statistics
4. **Data Transformation**: Formats data for DynamoDB storage
5. **Batch Updates**: Performs parallel DynamoDB put operations
6. **Completion Logging**: Reports number of statistics updated

## Performance Considerations

- Uses Promise.all() for parallel database operations
- Processes statistics in batches for efficiency
- Minimum order thresholds reduce processing overhead
- Timestamps enable incremental updates in future enhancements

## Business Value

- Enables carrier performance monitoring and comparison
- Supports route optimization decisions
- Provides data for customer service improvements
- Facilitates business intelligence and reporting
- Helps identify problematic shipping routes or carriers