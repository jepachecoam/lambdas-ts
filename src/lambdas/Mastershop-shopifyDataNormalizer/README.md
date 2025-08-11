# Mastershop Shopify Data Normalizer Lambda

## Overview

The Mastershop Shopify Data Normalizer Lambda function is a specialized data transformation service that standardizes and normalizes Shopify order data into a consistent format for downstream processing. This function handles complex data mapping, fallback mechanisms, and intelligent data extraction from various Shopify data sources.

## Purpose

This lambda function serves as a data normalization layer that transforms raw Shopify order data into a standardized schema required by the Mastershop platform. It ensures data consistency, handles missing information through intelligent fallback mechanisms, and provides robust error handling for data processing workflows.

## Functionality

### Data Normalization Flow

1. **Order Retrieval**: Fetches complete order data from Shopify using GraphQL API
2. **Data Extraction**: Extracts order information including addresses, customer details, and line items
3. **Fallback Processing**: Implements intelligent fallback mechanisms for missing data
4. **Schema Validation**: Validates normalized data against predefined schemas
5. **Response Generation**: Returns standardized order data with processing metadata

### Data Sources and Mapping

#### Primary Data Sources
- **Billing Address**: Primary source for billing information
- **Shipping Address**: Primary source for shipping information
- **Customer Data**: Customer profile and contact information
- **Custom Attributes**: Additional data stored in Shopify custom fields
- **Line Items**: Product details and quantities

#### Fallback Mechanisms
- **Address Fallback**: Uses billing address when shipping address is missing
- **Custom Attributes**: Extracts data from Shopify custom fields when primary sources are unavailable
- **Cross-Reference Mapping**: Maps data between different address types when information is incomplete

### Intelligent Data Processing

#### Custom Attributes Extraction
The function implements sophisticated pattern matching to extract data from Shopify custom attributes:

- **Geographic Data**: Country, city, state, and address information
- **Personal Information**: Names, phone numbers, and email addresses
- **Documentation**: Document types and numbers
- **Location Data**: Latitude and longitude coordinates

#### Payment Method Normalization
- **COD Detection**: Identifies cash-on-delivery payment methods using fuzzy matching
- **Method Standardization**: Normalizes various payment method names to standard formats

## Business Logic

### Data Normalization Process

1. **Environment Validation**: Verifies required environment variables and configuration
2. **Parameter Extraction**: Extracts order ID, access token, and store URL from request
3. **Shopify API Integration**: Retrieves complete order data using GraphQL queries
4. **Direct Normalization**: Attempts primary data normalization using predefined rules
5. **Fallback Processing**: Applies intelligent fallback mechanisms for missing data
6. **Schema Validation**: Validates normalized data against expected schema
7. **Response Generation**: Returns standardized data with processing metadata

### Data Transformation Rules

#### Address Normalization
```javascript
// Handles address matching and fallback logic
if (addressesMatch) {
  const addr = billing || shipping;
  return { billingAddr: addr, shippingAddr: addr };
}
```

#### Custom Attributes Processing
```javascript
// Implements fuzzy matching for custom attribute extraction
const fuse = new Fuse(possibleKeys, {
  threshold: 0.15,
  includeScore: true
});
```

#### Payment Method Detection
```javascript
// Detects COD payment methods using pattern matching
const codOptions = [
  "cod", "cash on delivery", "contraentrega",
  "pago contra entrega", "efectivo contra entrega"
];
```

## Input/Output

### Input (API Gateway Event)

```json
{
  "pathParameters": {
    "shopifyOrderId": "123456789"
  },
  "headers": {
    "x-shopify-access-token": "shopify-access-token-here"
  },
  "body": {
    "X-Shopify-Url-Store": "store-name.myshopify.com",
    "msApiKey": "mastershop-api-key",
    "configTool": {
      "idUser": "user-id",
      "idConfTool": "config-tool-id"
    }
  }
}
```

### Output (Normalized Order Data)

```json
{
  "success": true,
  "message": "Normalización exitosa con DTO",
  "data": {
    "order": {
      "billing_address": {
        "country": "Colombia",
        "city": "Medellín",
        "address1": "Calle 123 #45-67",
        "address2": "Apto 101",
        "latitude": 6.2442,
        "longitude": -75.5812,
        "first_name": "Juan",
        "last_name": "Pérez",
        "full_name": "Juan Pérez",
        "phone": "+573001234567",
        "state": "Antioquia",
        "state_code": "ANT"
      },
      "shipping_address": {
        "country": "Colombia",
        "city": "Medellín",
        "address1": "Calle 123 #45-67",
        "address2": "Apto 101",
        "latitude": 6.2442,
        "longitude": -75.5812,
        "first_name": "Juan",
        "last_name": "Pérez",
        "full_name": "Juan Pérez",
        "phone": "+573001234567",
        "state": "Antioquia",
        "state_code": "ANT"
      },
      "customer": {
        "full_name": "Juan Pérez",
        "first_name": "Juan",
        "last_name": "Pérez",
        "phone": "+573001234567",
        "email": "juan.perez@email.com",
        "documentType": "CC",
        "documentNumber": "12345678"
      },
      "notes": ["Order note from customer"],
      "tags": ["express", "priority"],
      "payment_method": "cod",
      "line_items": [
        {
          "name": 12345,
          "current_quantity": 2,
          "grams": 500,
          "price": 29.99,
          "title": "Product Name",
          "product_id": 12345,
          "variant_id": 67890
        }
      ]
    },
    "usedFallback": false,
    "usedDefaultValuesInCriticalFields": false
  }
}
```

## Dependencies

- **Shopify GraphQL API**: For retrieving order data
- **Redis Cache**: For storing normalization functions and data
- **Mastershop AI Service**: For intelligent data normalization
- **Slack Integration**: For error notifications and monitoring
- **Zod Schema Validation**: For data structure validation

## Environment Variables

- `REDIS_HOST`: Redis server host address
- `REDIS_PORT`: Redis server port number
- `B2B_BASE_URL`: Base URL for B2B API services
- `API_KEY_MS`: Mastershop API authentication key
- `APP_NAME_MS`: Mastershop application identifier
- `REDIS_TTL_IN_MINUTES`: Cache expiration time in minutes
- `SLACK_URL_NOTIFICATION`: Slack webhook URL for notifications

## Error Handling

- **Missing Parameters**: Returns 400 error for missing required parameters
- **Authentication Errors**: Returns 400 error for invalid access tokens
- **Shopify API Errors**: Handles API failures with appropriate error messages
- **Normalization Failures**: Returns 422 error when data cannot be normalized
- **System Errors**: Returns 500 error for internal processing failures
- **Slack Notifications**: Sends alerts for critical errors and failures

## Data Processing Features

### Intelligent Fallback System
- **Address Fallback**: Uses alternative address sources when primary data is missing
- **Custom Attributes**: Extracts data from Shopify custom fields as backup
- **Cross-Reference Mapping**: Maps data between different object types
- **Default Values**: Provides sensible defaults for critical fields

### Fuzzy Matching
- **Custom Attributes**: Uses fuzzy matching to identify relevant custom fields
- **Payment Methods**: Implements pattern matching for payment method detection
- **Field Mapping**: Maps similar field names across different data structures

### Data Validation
- **Schema Validation**: Ensures normalized data meets expected structure
- **Type Checking**: Validates data types and formats
- **Required Field Validation**: Ensures critical fields are present
- **Data Integrity**: Maintains data consistency across transformations

## Monitoring and Logging

The function provides comprehensive logging for:

- **Order Processing**: Tracks order retrieval and processing steps
- **Fallback Usage**: Monitors when fallback mechanisms are employed
- **Error Conditions**: Logs detailed error information for debugging
- **Performance Metrics**: Tracks processing time and success rates
- **Data Quality**: Monitors data completeness and validation results

## Usage Examples

### Basic Order Normalization
```javascript
// API Gateway triggers lambda with Shopify order ID
// Lambda retrieves order data and normalizes it
const result = await model.normalizeShopifyOrder({
  orderId: 123456789,
  accessToken: "shopify-token",
  storeUrl: "store.myshopify.com"
});
```

### Custom Attributes Processing
```javascript
// Extracts data from Shopify custom attributes
const customData = extractFromCustomAttributes(order.customAttributes);
// Maps custom fields to standard schema fields
```

### Address Normalization
```javascript
// Handles address matching and fallback logic
const { billingAddr, shippingAddr } = normalizeAddresses(
  billing, shipping, addressesMatch
);
```

## Configuration

### Shopify Integration
```javascript
// GraphQL query for order data retrieval
const graphqlQuery = `
  query Order {
    order(id: "gid://shopify/Order/${orderId}") {
      billingAddress { ... }
      shippingAddress { ... }
      customer { ... }
      lineItems { ... }
    }
  }
`;
```

### Cache Configuration
```javascript
// Redis cache settings for normalization functions
const cacheConfig = {
  key: accessToken,
  value: JSON.stringify(normalizationFunctions),
  expireInSeconds: REDIS_TTL_IN_MINUTES * 60
};
```

## Related Components

- **DTO**: Handles parameter extraction and data transformation logic
- **Model**: Contains business logic for order normalization
- **DAO**: Manages external API calls and data persistence
- **Schema**: Defines expected data structure and validation rules
- **Types**: Common type definitions and interfaces
- **Utils**: Helper functions for data processing and notifications

## Deployment

This lambda function is deployed as an API Gateway endpoint and is triggered by HTTP requests containing Shopify order information. It integrates with the Mastershop platform for order processing workflows.

## Best Practices

- **Data Validation**: Always validate input parameters and normalized data
- **Error Handling**: Implement comprehensive error handling with appropriate responses
- **Caching**: Use Redis cache for frequently accessed normalization functions
- **Monitoring**: Monitor processing success rates and data quality metrics
- **Fallback Mechanisms**: Implement robust fallback systems for data completeness
- **Performance**: Optimize GraphQL queries and data processing for efficiency 