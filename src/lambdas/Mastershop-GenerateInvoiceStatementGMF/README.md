# Mastershop Generate Invoice Statement GMF Lambda

## Overview

This Lambda function generates and manages GMF (Gravamen al Movimiento Financiero) certification PDFs for invoices. It creates official tax documents that serve as proof of financial transaction tax payments, required for Colombian tax compliance.

## Purpose

The function provides GMF certification documents that:
- Comply with Colombian tax regulations (Estatuto Tributario Article 771-2)
- Serve as valid support for tax deductions and costs
- Meet DIAN (Colombian Tax Authority) requirements per Resolution 000165 of 2023
- Generate professional PDF certificates with company branding

## Functionality

### PDF Generation and Caching
- **Smart Caching**: Checks S3 for existing PDFs before generating new ones
- **On-Demand Creation**: Generates PDFs only when not found in cache
- **Automatic Storage**: Saves generated PDFs to S3 for future requests
- **Instant Retrieval**: Returns cached PDF URLs for subsequent requests

### Document Structure
- **Company Header**: PRIVILEGE TEAM S.A.S. branding and contact information
- **Certificate Title**: "CERTIFICACIÓN DE REEMBOLSO DE GRAVAMEN AL MOVIMIENTO FINANCIERO"
- **Invoice Details**: Document number, emission date, client information
- **Transaction Table**: Date, detail, and 4xMil tax amount for each transaction
- **Legal Compliance**: Required legal text per Colombian tax regulations

### Data Processing
- **Invoice Retrieval**: Fetches invoice and beneficiary information from database
- **Detail Aggregation**: Collects all GMF-category invoice details
- **Tax Calculation**: Processes 4xMil tax amounts and totals
- **Format Validation**: Ensures proper currency and date formatting

## Technical Implementation

### Input Parameters
- **idInvoice**: Numeric invoice identifier from URL path parameters
- **environment**: Deployment stage (prod, dev, qa) from request context

### Database Queries
- **Invoice Data**: Retrieves invoice totals, creation date, and client information
- **Beneficiary Info**: Gets fiscal beneficiary details (name, document type/number)
- **Invoice Details**: Fetches all GMF-category transaction details

### PDF Generation Features
- **Multi-page Support**: Handles large invoice detail lists across multiple pages
- **Professional Layout**: Letter-size format with proper margins and spacing
- **Table Structure**: Organized columns for date, detail, and tax amounts
- **Text Wrapping**: Automatic text truncation for long descriptions
- **Currency Formatting**: Colombian peso formatting with proper separators

### S3 Integration
- **File Storage**: Stores PDFs in `mastershop/users/gmf/{idInvoice}.pdf` path
- **Stream Handling**: Efficient file retrieval and upload operations
- **URL Generation**: Returns public S3 URLs for PDF access

## Business Logic

1. **Request Validation**: Validates invoice ID and environment parameters
2. **Cache Check**: Looks for existing PDF in S3 storage
3. **Data Retrieval**: Fetches invoice and detail information if PDF not cached
4. **PDF Generation**: Creates formatted certification document using pdf-lib
5. **Storage**: Saves generated PDF to S3 for future requests
6. **Response**: Returns PDF URL for client access

## Response Format

### Success Response (200)
```json
{
  "idInvoice": 12345,
  "urlFile": "https://s3-url/mastershop/users/gmf/12345.pdf"
}
```

### Error Responses
- **404**: Invoice not found or no GMF details available
- **400**: Invalid invoice ID format or missing environment
- **500**: Internal server error during processing

## Legal Compliance

The generated certificates include mandatory legal text referencing:
- **Estatuto Tributario Article 771-2**: Tax code compliance
- **Decreto 1625 de 2016 Article 1.6.1.4.6**: Regulatory framework
- **DIAN Resolution 000165 de 2023**: Current tax authority guidelines

## Performance Optimization

- **Caching Strategy**: Avoids regenerating existing PDFs
- **Efficient Queries**: Optimized database queries with proper joins
- **Memory Management**: Streams large files to prevent memory issues
- **Fast Response**: Returns cached URLs immediately when available

## Use Cases

- **Tax Compliance**: Provides required documentation for tax filings
- **Audit Support**: Generates official records for financial audits
- **Client Services**: Delivers professional tax certificates to clients
- **Regulatory Reporting**: Meets Colombian tax authority requirements