# Mastershop Customer Statistics Preloader

## Overview

This Lambda function triggers the preloading of customer statistics by calling a dedicated API endpoint. The endpoint handles all cache management and metric calculations, while this Lambda serves as a simple trigger mechanism for the preloading process.

## Purpose

The function initiates customer statistics preloading by:
- Receiving a customer phone number as input
- Calling the customer metrics API endpoint with cache bypass
- Allowing the endpoint to handle cache preloading automatically

## Functionality

### API Integration
- **Endpoint Call**: Makes HTTP request to `/api/b2b/orderLogistics/customer/metrics/byPhone/{phone}?withoutCache=1`
- **Cache Bypass**: Uses `withoutCache=1` parameter to force fresh data calculation
- **Automatic Preloading**: The endpoint handles cache population during the request

### Retry Logic
- **Resilient Processing**: Implements exponential backoff retry mechanism
- **Error Handling**: Handles temporary failures with progressive delays (2s to 4min)
- **404 Handling**: Stops retrying on customer not found errors
- **Maximum Attempts**: Up to 8 retry attempts for transient failures

## Business Logic

1. **Input Processing**: Receives and sanitizes customer phone number
2. **API Request**: Calls customer metrics endpoint with cache bypass
3. **Retry Management**: Handles failures with exponential backoff
4. **Response Validation**: Ensures successful data retrieval
5. **Cache Population**: Endpoint automatically updates cache during processing

## Key Benefits

- **Simple Architecture**: Delegates complex logic to specialized endpoint
- **Reliable Execution**: Robust retry mechanism for transient failures
- **Cache Optimization**: Triggers cache preloading without direct cache management
- **Separation of Concerns**: Lambda handles triggering, endpoint handles caching
- **Scalable Design**: Can be easily invoked from multiple sources

## Technical Implementation

The Lambda follows standard architecture with:
- **Event Processing**: Extracts phone number from input event
- **HTTP Client**: Uses shared B2B request service for API calls
- **Retry Logic**: Implements progressive delay retry pattern
- **Error Handling**: Proper error propagation and logging

## Input Parameters

- **phone**: Customer phone number to preload statistics for
- **environment**: Target environment for API endpoint

## Monitoring

The function tracks:
- API call success/failure rates
- Retry attempt patterns
- Response times and performance
- Error types and frequencies

This ensures reliable triggering of cache preloading operations.