# Mastershop Customer Deduplication Job

## Overview

This Lambda function performs batch deduplication of customers for Mastershop by implementing fuzzy matching algorithms to identify and merge duplicate customer records across all active customers in the system.

## Functionality

The function processes all active customers and:
- Retrieves all customers with isActive = true from the database
- Groups customers by business (idBusiness)
- Uses fuzzy matching algorithms to detect duplicates within each business
- Selects winners based on data completeness and creation date
- Merges duplicate customer data into the winner record
- Reassigns all references from duplicates to winners
- Marks duplicate customers as inactive for audit purposes

## Input Parameters

The function only requires:
- `environment`: Environment configuration (dev/qa/prod) from the event

No customer data input is required as it processes all active customers from the database.

## Matching Criteria

The function uses weighted scoring for customer matching:

- **Phone**: 35 points
- **Email**: 35 points  
- **Document**: 40 points
- **External ID**: 35 points
- **Full Name**: 20 points
- **First Name**: 8 points
- **Last Name**: 8 points
- **Address State**: 5 points
- **Address City**: 10 points

## Matching Configuration

- **Minimum Matches Required**: 3
- **Minimum Score Required**: 55

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
3. **Duplicate Detection**: Compares customers within each business using fuzzy matching
4. **Winner Selection**: Chooses winner based on data completeness and creation date
5. **Data Merging**: Combines data from duplicates into winner record
6. **Reference Reassignment**: Updates all foreign key references
7. **Audit Trail**: Creates deduplication audit records
8. **Cleanup**: Marks duplicate customers as inactive

## Dependencies

- Fuse.js for fuzzy string matching
- Sequelize for database operations
- Joi for input validation

## Environment Variables

- Database connection settings
- Environment configuration (dev/staging/prod)