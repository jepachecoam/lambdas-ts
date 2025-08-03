# MasterShop Handle Shipment Updates Coordinadora Lambda Function

## Overview

This Lambda function processes general shipment updates from Coordinadora carrier for MasterShop orders. It handles webhook events containing shipment incidents and novelties, transforms the data into a standardized format, and forwards it to the order update system. The function is specifically designed to handle incident reports and tracking updates from Coordinadora's logistics system.

## Purpose

The MasterShop shipment updates function is designed to:
- Process webhook events from Coordinadora containing shipment incidents and novelties
- Transform Coordinadora-specific data format into standardized carrier data structure
- Handle incident reports with status code 409 (Incident status)
- Extract and process novelty information (incident descriptions and codes)
- Forward processed data to the order update system
- Provide webhook acknowledgment responses to Coordinadora
- Maintain audit trail of shipment incidents and updates

## Technical Details

### Input

The function expects a webhook event from Coordinadora with the following structure:

```typescript
{
  body: string // JSON string containing:
  {
    numero_guia: string,           // Required: Tracking number
    id_novedad?: number,           // Optional: Novelty/incident ID
    descripcion_novedad?: string,  // Optional: Novelty/incident description
    // Additional management information fields
  }
}
```

### Output

**Success Response**:
```json
{
  "statusCode": 200,
  "body": "{\"message\":\"OK\"}"
}
```

**Error Response**:
```json
{
  "statusCode": 500,
  "body": "Error message details"
}
```

### Environment Variables

This function does not require specific environment variables but may inherit configuration from the model component for order update operations.

### Dependencies

- **Internal Components**:
  - `./model` - Business logic for sending carrier data to order update system
- **External Services**:
  - Order update system (via model component)

## Setup and Usage

### Local Development

1. Ensure the model component is properly configured for order updates

2. Set up webhook endpoint to receive Coordinadora events

3. Configure any required credentials for the order update system

### Testing

#### Test Event Structure

```json
{
  "body": "{\"numero_guia\":\"COORD123456789\",\"id_novedad\":101,\"descripcion_novedad\":\"Dirección incompleta - requiere contacto con destinatario\",\"fecha_novedad\":\"2024-01-15 14:30:00\",\"ciudad\":\"Bogotá\"}"
}
```

#### Webhook Integration

- Configure Coordinadora webhook to send incident notifications to this function
- Ensure proper API Gateway configuration for webhook endpoint
- Set up appropriate security measures for webhook validation

### Build and Deployment

1. Build the function:
   ```bash
   npm run build
   ```
2. Select "MasterShop-handleShipmentUpdatesCoordinadora" when prompted
3. Deploy as a webhook handler Lambda function
4. Configure API Gateway endpoint for Coordinadora webhooks

## Error Handling and Troubleshooting

### Common Errors

1. **JSON Parsing Errors**
   - Ensure webhook body contains valid JSON
   - Verify Coordinadora sends properly formatted data

2. **Missing Tracking Number**
   - Verify `numero_guia` field is present in webhook payload
   - Check Coordinadora webhook configuration

3. **Order Update System Errors**
   - Check model component configuration
   - Verify order update system connectivity
   - Ensure proper authentication for order updates

### Data Transformation

The function transforms Coordinadora data into a standardized format:

- **trackingNumber**: Extracted from `numero_guia`
- **status**: Fixed to code "409" (Incident) with name "Incidente"
- **novelty**: Extracted from `id_novedad` and `descripcion_novedad`
- **returnProcess**: Set to null (not applicable for incidents)
- **carrierData**: Raw webhook data preserved for audit purposes

### Troubleshooting

1. Check CloudWatch logs for detailed processing information
2. Verify webhook payload format matches expected structure
3. Test JSON parsing with sample Coordinadora data
4. Ensure order update system is accessible and responding
5. Validate tracking numbers exist in the system

## Examples

### Successful Incident Processing

**Request**:
```json
{
  "body": "{\"numero_guia\":\"COORD987654321\",\"id_novedad\":205,\"descripcion_novedad\":\"Destinatario no se encuentra en la dirección\",\"fecha_novedad\":\"2024-01-15 16:45:00\",\"ciudad\":\"Medellín\",\"observaciones\":\"Se intentó entrega 3 veces\"}"
}
```

**Expected Log Output**:
```
event =>>> {"body":"{\"numero_guia\":\"COORD987654321\",...}"}
updatedStatusGuideResult =>>> [result details]
```

**Transformed Carrier Data**:
```json
{
  "trackingNumber": "COORD987654321",
  "status": {
    "statusCode": "409",
    "statusName": "Incidente"
  },
  "novelty": {
    "noveltyCode": "205",
    "description": "Destinatario no se encuentra en la dirección",
    "note": null
  },
  "returnProcess": {
    "returnTrackingNumber": null
  },
  "carrierData": "{\"managementInformation\":{\"numero_guia\":\"COORD987654321\",\"id_novedad\":205,\"descripcion_novedad\":\"Destinatario no se encuentra en la dirección\",\"fecha_novedad\":\"2024-01-15 16:45:00\",\"ciudad\":\"Medellín\",\"observaciones\":\"Se intentó entrega 3 veces\"}}"
}
```

**Response**:
```json
{
  "statusCode": 200,
  "body": "{\"message\":\"OK\"}"
}
```

### Processing Without Novelty Information

**Request**:
```json
{
  "body": "{\"numero_guia\":\"COORD111222333\",\"fecha_actualizacion\":\"2024-01-15 12:00:00\",\"estado\":\"en_transito\"}"
}
```

**Transformed Carrier Data**:
```json
{
  "trackingNumber": "COORD111222333",
  "status": {
    "statusCode": "409",
    "statusName": "Incidente"
  },
  "novelty": {
    "noveltyCode": null,
    "description": null,
    "note": null
  },
  "returnProcess": {
    "returnTrackingNumber": null
  },
  "carrierData": "{\"managementInformation\":{\"numero_guia\":\"COORD111222333\",\"fecha_actualizacion\":\"2024-01-15 12:00:00\",\"estado\":\"en_transito\"}}"
}
```

### Error Scenario

**Request with Invalid JSON**:
```json
{
  "body": "invalid json string"
}
```

**Response**:
```json
{
  "statusCode": 500,
  "body": "Unexpected token i in JSON at position 0"
}
```

## Data Processing Flow

1. **Event Reception**: Receives webhook event from Coordinadora
2. **JSON Parsing**: Parses the webhook body to extract shipment data
3. **Data Transformation**: Converts Coordinadora format to standardized carrier data
4. **Status Assignment**: Assigns fixed incident status (409 - Incidente)
5. **Novelty Processing**: Extracts incident codes and descriptions
6. **Data Forwarding**: Sends transformed data to order update system
7. **Response Generation**: Returns success or error response

## Integration Considerations

- Function is specifically designed for Coordinadora incident webhooks
- All shipments processed through this function are marked as incidents (status 409)
- Raw webhook data is preserved in carrierData field for audit purposes
- Function focuses on incident handling rather than general status updates
- Integrates with broader MasterShop order management system

## Business Value

- Enables real-time incident tracking for Coordinadora shipments
- Provides standardized incident data format for order management
- Supports customer service with detailed incident information
- Maintains audit trail of all shipment incidents
- Facilitates automated incident response and customer notifications

## Security Considerations

- Validate webhook authenticity from Coordinadora
- Implement proper error handling to prevent data leakage
- Ensure secure communication with order update system
- Consider rate limiting for webhook endpoints
- Log security-relevant events for monitoring