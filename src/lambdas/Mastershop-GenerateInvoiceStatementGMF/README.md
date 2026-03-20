# Mastershop-GenerateInvoiceStatementGMF

## Purpose

This lambda generates GMF (Gravamen al Movimiento Financiero) tax certification documents for invoices. Its sole responsibility is to produce official PDF certificates that serve as proof of financial movement tax payments for Colombian tax compliance. It contains no business logic beyond document generation and caching.

## What it does

It receives a request containing an invoice identifier. It checks whether a certification document already exists in object storage and returns the existing URL if found. If not, it retrieves the invoice data and GMF-related line items from the database, generates a formatted PDF certificate containing the beneficiary information and tax amounts, stores the generated document in object storage for future requests, and returns the accessible URL. The generated document includes all required legal text for Colombian tax authority compliance.

## Generation flow

1. Validates the invoice identifier and environment context from the incoming request.
2. Checks object storage for an existing certification document for this invoice.
3. If a cached document exists, returns its URL immediately.
4. Retrieves the invoice header and beneficiary details from the database.
5. Retrieves all GMF-category line items associated with the invoice.
6. Generates a formatted PDF certificate containing the document metadata, beneficiary information, transaction details, and total tax amount.
7. Stores the generated PDF in object storage with a permanent key.
8. Returns the URL to access the generated certification document.

## Context produced on success

When a GMF certification is generated or retrieved, the system produces:

- A professionally formatted PDF certificate suitable for tax documentation.
- A permanent URL to access the certification document.
- A cached copy in object storage to avoid regeneration for future requests.

## Internal layers

- **index**: entry point. Validates request parameters, orchestrates the retrieval or generation flow, and builds the HTTP response.
- **model**: holds all generation logic — data fetching, PDF composition, and storage orchestration.
- **dao**: data access layer. Queries the database for invoice and beneficiary records, retrieves documents from object storage, and stores generated files.
- **dto**: handles data transformation. Extracts and validates request parameters and structures the output for PDF generation.
- **pdfGenerator**: internal utility that composes the certification document from the retrieved data.
