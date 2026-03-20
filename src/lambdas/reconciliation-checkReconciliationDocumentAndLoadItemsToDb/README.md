# reconciliation-checkReconciliationDocumentAndLoadItemsToDb

## Purpose

This lambda processes reconciliation documents uploaded to cloud storage and loads their contents into the database. Its sole responsibility is to extract financial data from spreadsheet files and persist it for downstream reconciliation processing. It contains no business logic beyond file parsing, validation, and bulk storage.

## What it does

It receives a notification when a new spreadsheet file is uploaded to cloud storage. It streams the file from storage, reads the first worksheet, validates each row against the expected schema for the reconciliation type, transforms the row data into database records, and inserts the valid records in batches. Any rows that fail validation are reported to a monitoring channel. The lambda supports both payment and charge reconciliation document types, each with its own validation rules.

## Document processing flow

1. Extracts the file location and reconciliation type from the upload notification.
2. Opens a stream to the spreadsheet file in cloud storage.
3. Initializes a workbook reader to process the file efficiently without loading it entirely into memory.
4. Reads the first worksheet in the workbook.
5. Extracts column headers from the first row of data.
6. For each subsequent row, validates the data types and formats against the appropriate schema.
7. For valid rows, transforms the cell values into structured records and accumulates them in memory.
8. When the accumulated batch reaches the configured size, inserts the batch into the database.
9. After processing all rows, inserts any remaining records that didn't fill a complete batch.
10. Sends a summary notification indicating the total rows processed and any validation errors encountered.

## Context stored on success

When a document is processed, the system stores:

- A batch of validated payment or charge records in the reconciliation database.
- Each record contains the carrier identifier, transaction amounts, dates, and reference codes required for downstream anomaly checking.
- A summary of processing statistics including total rows, successful inserts, and validation failures.

## Internal layers

- **index**: entry point. Validates configuration, extracts file parameters from the event, and orchestrates the processing flow.
- **model**: holds all processing logic — worksheet iteration, row validation, batch accumulation, and database insertion.
- **dao**: data access layer. Streams files from cloud storage and performs bulk inserts of validated records.
- **dto**: handles data transformation. Extracts parameters from the event and converts spreadsheet rows to structured objects.
- **schemas**: validation rules defining expected data types and formats for each reconciliation type.
- **validators**: utilities for applying schema rules to individual rows and collecting validation errors.
- **types**: defines internal constants and reconciliation type identifiers.
