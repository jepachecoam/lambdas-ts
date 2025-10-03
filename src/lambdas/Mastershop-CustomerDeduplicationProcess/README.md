# Mastershop Customer Deduplication Job

## Overview

This Lambda function performs batch deduplication of customers for Mastershop by implementing advanced fuzzy matching algorithms to identify and merge duplicate customer records. It processes all active customers in the system using in-memory data normalization and comparison for maximum flexibility.

## Functionality

The function processes all active customers and:
- Retrieves all customers with isActive = true from the database
- Groups customers by business (idBusiness) 
- Uses weighted fuzzy matching algorithms to detect duplicates within each business
- Selects winners based on data completeness and creation date
- Validates and merges unique data from losers to winners using normalized comparison
- Reassigns all order references from duplicates to winners
- Marks duplicate customers as inactive for audit purposes

## Input Parameters

The function only requires:
- `environment`: Environment configuration (dev/qa/prod) from the event

No customer data input is required as it processes all active customers from the database.

## Matching Criteria

The function uses weighted scoring for customer matching:

- **Phone**: 35 points (normalized, country codes removed)
- **Email**: 35 points (normalized text)
- **Document**: 40 points (normalized text)
- **External ID**: 35 points (exact match)
- **Full Name**: 20 points (fuzzy match, initials removed)
- **First Name**: 8 points (fuzzy match, initials removed)
- **Last Name**: 8 points (fuzzy match, initials removed)
- **Address State**: 5 points (fuzzy match, threshold 0.3)
- **Address City**: 10 points (fuzzy match, threshold 0.15)

## Matching Configuration

- **Minimum Matches Required**: 3 fields
- **Minimum Score Required**: 55 points
- **Name Fuzzy Threshold**: 0.5
- **Address Fuzzy Threshold**: 0.3 (state), 0.15 (city)

## Data Validation Logic

When merging data from losers to winners, the system:
- **Phone**: Normalizes and removes country codes before comparison
- **Email**: Normalizes text (lowercase, accents removed) before comparison  
- **Address**: Uses fuzzy matching (0.3 threshold) on normalized state/city
- **External ID**: Uses exact string comparison

Only adds data that doesn't already exist in the winner record.

## Response

```typescript
{
  statusCode: number;
  message: string;
  data: {
    processedBusinesses: number;
    duplicateGroups: number;
    mergedCustomers: number;
  };
}
```

## Business Logic

1. **Data Retrieval**: Gets all active customers from database
2. **Business Grouping**: Groups customers by idBusiness
3. **Data Normalization**: Sanitizes and normalizes all customer data in memory
4. **Duplicate Detection**: Compares customers using weighted fuzzy matching
5. **Winner Selection**: Chooses winner based on field completeness and creation date
6. **Order Reassignment**: Updates all order references to point to winner
7. **Unique Data Merging**: Adds missing data from losers to winner (phones, emails, addresses, external IDs)
8. **Cleanup**: Marks duplicate customers as inactive

## File Structure

- **index.ts**: Lambda handler and error management
- **dto.ts**: Input validation and parameter extraction
- **model.ts**: Core business logic and fuzzy matching algorithms
- **dao.ts**: Database operations (CRUD for customers, phones, emails, addresses)
- **types.ts**: TypeScript interfaces and configuration constants

## Dependencies

- Fuse.js for fuzzy string matching
- Sequelize for database operations
- Custom normalization utilities for text and phone processing

## Environment Variables

- Database connection settings
- Environment configuration (dev/qa/prod)

## Supported Country Phone Codes

The system automatically removes these country codes during phone normalization:
- 1 (US/Canada), 52 (Mexico), 54 (Argentina), 55 (Brazil)
- 56 (Chile), 57 (Colombia), 58 (Venezuela), 51 (Peru)
- 593 (Ecuador), 591 (Bolivia), 595 (Paraguay), 598 (Uruguay)