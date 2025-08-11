# Requirements Document

## Introduction

This feature implements a Colombian DANE code lookup function that normalizes and searches for department and city data using fuzzy matching with Fuse.js. The function will receive potentially denormalized input (with accents, spaces, misspellings) and return the correct department name, city name, and corresponding DANE code with high accuracy matching.

## Requirements

### Requirement 1

**User Story:** As a developer, I want to search for Colombian departments and cities using fuzzy matching, so that I can handle denormalized input data and get accurate DANE codes.

#### Acceptance Criteria

1. WHEN the function receives a department and city string THEN the system SHALL normalize both inputs by removing accents, converting to lowercase, and removing special characters
2. WHEN searching for departments THEN the system SHALL search against name, alias array, and code fields with at least 95% similarity threshold
3. WHEN a department is found THEN the system SHALL store the original (non-sanitized) department name for response
4. WHEN searching for cities THEN the system SHALL only search within the previously found department's cities array
5. WHEN searching cities THEN the system SHALL search against name and alias fields with at least 90% similarity threshold
6. WHEN a city is found THEN the system SHALL use the default DANE code from the dane property

### Requirement 2

**User Story:** As a developer, I want to handle optional carrier ID parameter, so that I can get alternative DANE codes when specific carrier requirements exist.

#### Acceptance Criteria

1. WHEN the function receives an optional idCarrier parameter THEN the system SHALL search for that ID in the city's extraDanes array
2. IF the idCarrier is found in extraDanes THEN the system SHALL use that DANE code instead of the default
3. IF the idCarrier is not found in extraDanes THEN the system SHALL fallback to the default DANE code
4. WHEN no idCarrier is provided THEN the system SHALL use the default DANE code

### Requirement 3

**User Story:** As a developer, I want comprehensive error handling and fallback strategies, so that the system provides meaningful feedback when data is not found.

#### Acceptance Criteria

1. WHEN the department is not found THEN the system SHALL return message "department is missing" and data as null
2. WHEN the department is found but city is not found THEN the system SHALL return message "city is missing" and data as null
3. WHEN both department and city are found THEN the system SHALL return the normalized data object with message indicating success
4. WHEN input contains comma-separated values like "medellin, antioquia" THEN the system SHALL only use the first part for city search
5. WHEN similarity threshold is not met THEN the system SHALL treat as not found

### Requirement 4

**User Story:** As a Lambda function consumer, I want to invoke the function via HTTP POST, so that I can integrate it into my applications.

#### Acceptance Criteria

1. WHEN the Lambda receives an HTTP POST request THEN the system SHALL parse the event.body JSON
2. WHEN parsing the body THEN the system SHALL extract department, city, and optional idCarrier properties
3. WHEN the function completes successfully THEN the system SHALL return HTTP 200 with the result
4. WHEN an error occurs THEN the system SHALL return appropriate HTTP error status with error message
5. WHEN required parameters are missing THEN the system SHALL return HTTP 400 with validation error message

### Requirement 5

**User Story:** As a developer, I want consistent response format, so that I can reliably process the function results.

#### Acceptance Criteria

1. WHEN the function returns a result THEN the system SHALL always include message and data properties
2. WHEN data is found THEN the data object SHALL contain department, city, and daneCode properties
3. WHEN data is not found THEN the data property SHALL be null
4. WHEN successful THEN the department SHALL be the original name from the data file
5. WHEN successful THEN the city SHALL be the original name from the data file
6. WHEN successful THEN the daneCode SHALL be either the default or the carrier-specific code