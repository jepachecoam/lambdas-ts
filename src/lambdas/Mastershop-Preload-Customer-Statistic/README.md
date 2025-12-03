# Mastershop Customer Statistics Lambda

## Overview

This Lambda function maintains real-time customer metrics by listening to order creation and status change events. It ensures that customer statistics are always up-to-date in the cache for instant display when users hover over the quick metrics modal in the application.

## Purpose

The function automatically recalculates and refreshes customer metrics whenever:
- A new order is created
- An existing order changes to status 8, 9, or 10

This proactive approach ensures that customer statistics are immediately available when needed, providing a seamless user experience in the application.

## Functionality

### Event Listening
- **Order Creation**: Triggers metric recalculation for the customer
- **Status Changes**: Monitors orders transitioning to states 8, 9, and 10
- **Real-time Processing**: Processes events as they occur across the application

### Metric Management
- **Cache Refresh**: Updates cached customer metrics immediately
- **Performance Optimization**: Pre-calculates metrics to avoid delays during UI interactions
- **Data Consistency**: Ensures all customer statistics reflect the latest order information

### Integration Points
- **Order Management System**: Receives order events and status updates
- **Cache Layer**: Updates customer metrics in cache storage
- **Frontend Application**: Provides fresh data for quick metrics modal

## Business Logic

1. **Event Reception**: Receives order creation or status change events
2. **Customer Identification**: Extracts customer information from the order data
3. **Metric Calculation**: Triggers recalculation of all customer statistics
4. **Cache Update**: Stores updated metrics in cache for instant retrieval
5. **Cross-Application Sync**: Ensures consistency across all application modules

## Key Benefits

- **Instant Response**: Metrics are pre-calculated and cached
- **Real-time Updates**: Statistics reflect the most current order information
- **Improved UX**: No loading delays when displaying customer metrics
- **System Efficiency**: Reduces database queries during UI interactions
- **Data Accuracy**: Maintains synchronized metrics across the entire platform

## Technical Implementation

The Lambda follows the standard architecture pattern with:
- **Event Processing**: Handles incoming order events
- **Business Logic**: Orchestrates metric recalculation workflows
- **Data Access**: Interfaces with order and customer databases
- **Cache Management**: Updates and maintains metric cache storage

## Monitoring

The function tracks:
- Event processing success rates
- Metric calculation performance
- Cache update operations
- Error rates and failure scenarios

This ensures reliable operation and quick identification of any issues affecting customer metric accuracy.