# Mastershop Customer Statistics Preloader

## Overview

This Lambda function processes SQS messages containing customer data and preloads customer statistics in batches to reduce database load. It extracts customer phone numbers from the messages, queries statistics from the database in bulk, and caches the results in Redis for improved performance.

## Purpose

The function optimizes customer statistics access by:
- Processing SQS messages containing customer events
- Extracting and sanitizing customer phone numbers in batches
- Querying customer statistics from the database for multiple customers at once
- Caching the statistics in Redis with 7-day expiration
- Reducing individual database queries by processing customers in bulk

## Functionality

### SQS Message Processing
- **Batch Processing**: Receives multiple customer records from SQS messages
- **Phone Extraction**: Extracts phone numbers from customer detail events
- **Phone Sanitization**: Removes country codes and formats phone numbers
- **Deduplication**: Processes unique phone numbers to avoid redundant queries

### Database Operations
- **Bulk Statistics Query**: Retrieves customer metrics for all phones in a single database query
- **Multi-table Joins**: Queries customer and order data across multiple tables
- **Comprehensive Metrics**: Calculates order counts, returns, deliveries, cancellations, and blocked status

### Cache Management
- **Redis Storage**: Stores statistics in Redis with structured keys (`customerStatistics-{phone}`)
- **7-Day Expiration**: Sets cache expiration to 7 days for optimal performance
- **JSON Serialization**: Stores statistics as JSON strings for easy retrieval

## Business Logic

1. **Message Processing**: Parses SQS records and extracts customer data
2. **Phone Validation**: Sanitizes and validates customer phone numbers
3. **Batch Query**: Retrieves statistics for all valid phones in one database operation
4. **Cache Population**: Stores individual customer statistics in Redis
5. **Error Notification**: Sends Slack notifications for records without phone numbers

## Key Benefits

- **Reduced Database Load**: Processes multiple customers in single queries instead of individual requests
- **Improved Performance**: Pre-caches frequently accessed customer statistics
- **Batch Efficiency**: Handles multiple SQS messages simultaneously
- **Error Monitoring**: Tracks and notifies about data quality issues
- **Scalable Architecture**: Processes varying batch sizes efficiently

## Technical Implementation

The Lambda follows standard architecture with:
- **SQS Integration**: Processes messages from SQS queues
- **Database Layer**: Uses MySQL for customer and order data queries
- **Cache Layer**: Implements Redis for statistics storage
- **Notification System**: Integrates with Slack for error reporting

## Customer Statistics Metrics

The function calculates and caches:
- **cantOrders**: Total number of orders placed by customer
- **cantReturOrders**: Number of returned orders
- **delivered**: Number of successfully delivered orders
- **canceled**: Number of canceled orders
- **blockedBy**: Number of businesses that have blacklisted the customer
- **percentageReturn**: Return rate percentage based on eligible orders

## Input Format

Expected SQS message structure:
```json
{
  "Records": [
    {
      "body": "{
        \"detail\": {
          \"customer\": {
            \"phone\": \"customer_phone_number\"
          }
        }
      }"
    }
  ]
}
```

## Monitoring

The function tracks:
- SQS message processing success rates
- Database query performance
- Cache storage operations
- Phone number validation issues
- Slack notification delivery

This ensures efficient batch processing and optimal database resource utilization.