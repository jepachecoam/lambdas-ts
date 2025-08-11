# Implementation Plan

- [x] 1. Create text normalization utility functions


  - Implement function to remove accents, convert to lowercase, and remove special characters
  - Implement function to extract first part from comma-separated strings (e.g., "medellin, antioquia" → "medellin")
  - Create sanitization function that applies all normalization steps
  - _Requirements: 1.1, 3.4_

- [x] 2. Implement department fuzzy search functionality


  - Create Fuse.js configuration for department search with 95% similarity threshold (0.05)
  - Implement function to search departments by name, alias array, and code fields
  - Add logic to return original (non-sanitized) department name when match is found
  - Handle case when no department matches the threshold
  - _Requirements: 1.2, 1.3_

- [x] 3. Implement city fuzzy search functionality


  - Create Fuse.js configuration for city search with 90% similarity threshold (0.10)
  - Implement function to search cities within a specific department's cities array
  - Add logic to search against city name and alias fields
  - Handle case when no city matches the threshold
  - _Requirements: 1.4, 1.5_

- [x] 4. Implement DANE code resolution with carrier support


  - Create function to extract default DANE code from city data
  - Implement logic to search extraDanes array by idCarrier when provided
  - Add fallback mechanism to use default DANE code when carrier ID not found
  - Handle cases where extraDanes array doesn't exist or is empty
  - _Requirements: 1.6, 2.1, 2.2, 2.3_

- [x] 5. Create core DANE lookup service


  - Implement main lookup function that orchestrates department and city search
  - Add logic to normalize input parameters before searching
  - Implement proper error handling for department not found scenarios
  - Implement proper error handling for city not found scenarios
  - Create response formatting with consistent message and data structure
  - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 6. Implement Lambda handler with HTTP request processing


  - Create AWS Lambda handler function that processes HTTP POST requests
  - Add JSON parsing for event.body to extract department, city, and idCarrier
  - Implement input validation for required parameters (department and city)
  - Add proper HTTP response formatting with appropriate status codes
  - Implement error handling for malformed requests and system errors
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. Integrate all components in index.ts file



  - Import Colombian DANE codes data from colombiaDaneCodes.ts
  - Wire together text normalization, fuzzy search, and DANE resolution components
  - Ensure proper error propagation from service layer to HTTP response
  - Add appropriate logging for debugging and monitoring
  - Verify response format consistency across all code paths
  - _Requirements: All requirements integration_