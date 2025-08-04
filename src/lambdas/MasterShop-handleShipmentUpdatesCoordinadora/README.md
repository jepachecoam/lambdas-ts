# MasterShop Shipment Updates Lambda

## Overview

The MasterShop Shipment Updates Lambda function processes shipment update notifications from the Coordinadora carrier. This function handles incident reports, delivery status changes, and shipment anomalies, providing real-time updates to the order management system.

## Purpose

This lambda function serves as a webhook handler for Coordinadora carrier notifications, processing shipment incidents and status changes. It ensures that shipment issues are properly recorded and the order management system is updated with current shipment information.

## Functionality

### Core Operations

1. **Incident Processing**: Handles shipment incidents and exceptions from Coordinadora
2. **Status Updates**: Processes delivery status changes and notifications
3. **Data Transformation**: Converts carrier data format to internal system format
4. **Order Updates**: Updates order management system with shipment information
5. **Response Handling**: Provides appropriate responses to carrier notifications

### Supported Notification Types

- **Incident Reports**: Shipment delays, damages, or issues
- **Status Changes**: Delivery status updates
- **Exception Handling**: Special handling requirements
- **Return Processing**: Return shipment notifications
- **Delivery Confirmations**: Successful delivery notifications

### Processing Features

- **Real-time Processing**: Handles notifications as they are received
- **Data Validation**: Validates carrier data before processing
- **Error Handling**: Manages processing failures gracefully
- **Audit Trail**: Maintains complete history of all updates

## Business Logic

### Notification Processing Process

1. **Webhook Reception**: Receives notification from Coordinadora carrier
2. **Data Extraction**: Extracts shipment data from the notification
3. **Data Transformation**: Converts carrier format to internal format
4. **Status Processing**: Processes the shipment status or incident
5. **Order Update**: Updates the order management system
6. **Response Generation**: Returns appropriate response to carrier

### Data Structure

The function processes carrier data with the following structure:
- **Tracking Number**: Shipment tracking identifier
- **Status Information**: Current shipment status
- **Incident Details**: Description of any incidents or issues
- **Management Information**: Additional carrier-specific data

### Status Processing Logic

- **Incident Handling**: Processes shipment incidents and exceptions
- **Status Updates**: Updates shipment status in the system
- **Data Enrichment**: Adds carrier-specific information to shipment records
- **Notification Routing**: Routes updates to appropriate systems

## Input/Output

### Input (Webhook Event)

```json
{
  "body": {
    "numero_guia": "CO123456789",
    "id_novedad": "123",
    "descripcion_novedad": "Shipment delayed due to weather",
    "status": "incident"
  }
}
```

### Output

```json
{
  "statusCode": 200,
  "body": {
    "message": "OK"
  }
}
```

## Dependencies

- **Order Management System**: For updating order and shipment data
- **Carrier API**: Integration with Coordinadora carrier system
- **AWS Services**: For logging, monitoring, and data processing

## Environment Variables

- Order management system configurations
- Carrier API configurations
- Environment-specific settings
- Processing parameters and thresholds

## Error Handling

- **Invalid Data**: Handles malformed or invalid carrier data
- **Processing Errors**: Manages data transformation failures
- **System Errors**: Handles order management system errors
- **Carrier Errors**: Manages carrier API communication issues
- **Timeout Errors**: Handles processing timeouts

## Security Features

- **Data Validation**: Validates all carrier data before processing
- **Input Sanitization**: Sanitizes input data to prevent injection attacks
- **Error Masking**: Prevents information leakage in error responses
- **Access Control**: Ensures only authorized notifications are processed

## Monitoring and Logging

The function provides detailed logging for:

- Webhook reception and processing
- Data transformation operations
- Order update operations
- Error conditions and recovery
- Performance metrics and timing
- Carrier notification patterns

## Usage Examples

### Basic Incident Processing
```javascript
// Process a shipment incident
const carrierData = {
  trackingNumber: "CO123456789",
  status: {
    statusCode: "409",
    statusName: "Incident"
  },
  novelty: {
    noveltyCode: "123",
    description: "Shipment delayed"
  }
};

await model.sendCarrierDataToUpdateOrder({ carrierData });
```

### Data Transformation
```javascript
// Transform carrier data to internal format
const transformedData = {
  trackingNumber: body.numero_guia,
  status: {
    statusCode: "409",
    statusName: "Incident"
  },
  novelty: {
    noveltyCode: body.id_novedad,
    description: body.descripcion_novedad
  }
};
```

## Related Components

- **Model**: Contains business logic for data processing
- **DTO**: Manages data transfer and validation
- **Types**: Common type definitions and interfaces
- **Utils**: Utility functions for data transformation

## Deployment

This lambda function is typically triggered by:
- Webhook from Coordinadora carrier system
- API Gateway for manual updates
- EventBridge for automated processing
- SQS for queued notifications

## Best Practices

- **Data Validation**: Validate all carrier data before processing
- **Error Handling**: Implement robust error handling and recovery
- **Performance**: Optimize for real-time processing
- **Monitoring**: Set up alerts for failed notifications
- **Audit Trail**: Maintain logs for compliance and debugging

## Performance Considerations

- **Real-time Processing**: Ensure fast response times for webhooks
- **Data Transformation**: Optimize data conversion operations
- **Memory Management**: Efficient memory usage for data processing
- **Concurrent Processing**: Handle multiple simultaneous notifications

## Business Impact

- **Customer Service**: Provides accurate shipment information to customers
- **Operational Efficiency**: Automates shipment incident processing
- **Compliance**: Maintains audit trails for regulatory requirements
- **Cost Reduction**: Reduces manual intervention in shipment tracking

## Integration Points

- **Coordinadora Carrier**: Receives shipment notifications
- **Order Management System**: Updates order and shipment data
- **Customer Notification System**: Triggers customer alerts
- **Analytics System**: Provides data for shipment analytics
- **Reporting System**: Generates shipment reports

## Error Scenarios

- **Missing Tracking Number**: Handles notifications without valid tracking
- **Invalid Status Codes**: Manages unrecognized status codes
- **System Unavailability**: Handles order management system downtime
- **Data Format Changes**: Adapts to carrier data format changes 