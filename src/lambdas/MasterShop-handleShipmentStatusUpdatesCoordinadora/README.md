# MasterShop Shipment Status Updates Lambda

## Overview

The MasterShop Shipment Status Updates Lambda function processes shipment status updates from the Coordinadora carrier. This function handles real-time shipment tracking information and updates the order management system with current shipment status and delivery information.

## Purpose

This lambda function serves as an integration point between the Coordinadora shipping carrier and the MasterShop order management system. It processes shipment status updates and ensures that order tracking information is current and accurate for customers and business operations.

## Functionality

### Core Operations

1. **Status Update Processing**: Receives and processes shipment status updates from Coordinadora
2. **Order Source Identification**: Identifies the source order for the shipment
3. **Shipment Data Retrieval**: Fetches relevant shipment information from the database
4. **Conversation Logging**: Records shipment status changes for audit purposes
5. **History Updates**: Updates order history with current shipment status

### Supported Status Types

- **In Transit**: Shipment is being transported
- **Out for Delivery**: Shipment is out for final delivery
- **Delivered**: Shipment has been successfully delivered
- **Exception**: Shipment has encountered an issue or delay
- **Returned**: Shipment is being returned to sender

### Processing Features

- **Real-time Updates**: Processes updates as they are received
- **Data Validation**: Validates shipment data before processing
- **Error Handling**: Manages processing failures gracefully
- **Audit Trail**: Maintains complete history of status changes

## Business Logic

### Status Update Process

1. **Event Reception**: Receives shipment status update event from Coordinadora
2. **Parameter Validation**: Validates required shipment data (tracking code, date, status)
3. **Order Source Lookup**: Identifies the source order for the shipment
4. **Shipment Data Retrieval**: Fetches complete shipment information
5. **Status Processing**: Processes the status update based on business rules
6. **Database Updates**: Updates order history and conversation logs
7. **Response Generation**: Returns appropriate response to the carrier

### Order Source Types

The function handles different order source types:
- **Order**: Regular customer orders
- **Return**: Return shipments
- **Exchange**: Product exchange shipments
- **Special**: Special handling shipments

### Status Processing Logic

- **Approved Solutions**: Processes positive status updates
- **Exception Handling**: Manages shipment exceptions and delays
- **Delivery Confirmation**: Handles successful delivery confirmations
- **Return Processing**: Manages return shipment status updates

## Input/Output

### Input (Event)

```json
{
  "carrierTrackingCode": "CO123456789",
  "dateSolution": "2024-01-15T10:30:00Z",
  "eventData": {
    "status": "delivered",
    "location": "Customer Address",
    "notes": "Delivered to customer"
  },
  "isApprovedSolution": true,
  "environment": "production"
}
```

### Output

```json
{
  "statusCode": 202,
  "body": {
    "message": "Accepted"
  }
}
```

## Dependencies

- **Database**: MySQL database for order and shipment data
- **Carrier API**: Integration with Coordinadora carrier system
- **AWS Services**: For logging, monitoring, and data processing

## Environment Variables

- Database connection configurations
- Carrier API configurations
- Environment-specific settings
- Processing parameters and thresholds

## Error Handling

- **Missing Data**: Handles missing required shipment information
- **Invalid Tracking Codes**: Manages invalid or unrecognized tracking codes
- **Database Errors**: Handles database connection and query errors
- **Processing Errors**: Manages status processing failures
- **Carrier Errors**: Handles carrier API communication issues

## Security Features

- **Data Validation**: Validates all input data before processing
- **Audit Logging**: Maintains complete audit trail of all updates
- **Error Isolation**: Prevents partial updates from corrupting data
- **Access Control**: Ensures only authorized updates are processed

## Monitoring and Logging

The function provides detailed logging for:

- Status update reception and processing
- Order source identification
- Shipment data retrieval operations
- Database update operations
- Error conditions and recovery
- Performance metrics and timing

## Usage Examples

### Basic Status Update
```javascript
// Process a shipment status update
const result = await model.updateHistoryStatus({
  orderSource: "ORDER",
  idOrderHistory: "history-123",
  isApprovedSolution: true,
  shipmentData: shipmentInfo
});
```

### Conversation Logging
```javascript
// Log shipment status change for audit
await model.saveConversation({
  dataForSaveConversation: {
    carrierTrackingCode: "CO123456789",
    status: "delivered",
    timestamp: "2024-01-15T10:30:00Z"
  }
});
```

## Related Components

- **DAO**: Manages database interactions and data retrieval
- **Model**: Contains business logic for status processing
- **DTO**: Manages data transfer and parameter parsing
- **Types**: Common type definitions and enums
- **Utils**: Utility functions for data processing

## Deployment

This lambda function is typically triggered by:
- Webhook from Coordinadora carrier system
- API Gateway for manual status updates
- EventBridge for automated processing
- SQS for queued status updates

## Best Practices

- **Data Validation**: Validate all shipment data before processing
- **Error Handling**: Implement robust error handling and recovery
- **Audit Trail**: Maintain comprehensive logs for compliance
- **Performance**: Optimize for real-time processing
- **Monitoring**: Set up alerts for failed status updates

## Performance Considerations

- **Real-time Processing**: Ensure fast response times for status updates
- **Database Optimization**: Optimize database queries for speed
- **Memory Management**: Efficient memory usage for large datasets
- **Concurrent Processing**: Handle multiple simultaneous updates

## Business Impact

- **Customer Experience**: Provides accurate shipment tracking information
- **Operational Efficiency**: Automates shipment status management
- **Compliance**: Maintains audit trails for regulatory requirements
- **Cost Reduction**: Reduces manual intervention in shipment tracking

## Integration Points

- **Coordinadora Carrier**: Receives shipment status updates
- **Order Management System**: Updates order status and history
- **Customer Notification System**: Triggers customer notifications
- **Analytics System**: Provides data for shipment analytics 