# Lambda Architecture Rule

## Overview
This repository contains AWS Lambda functions following a strict layered architecture pattern. Each Lambda function folder represents an individual Lambda deployment unit and must adhere to the following structure and conventions.

## Required File Structure
Every Lambda function MUST contain these core files:

### Core Files (Required)
- **`index.ts`** - Entry point and handler function
- **`model.ts`** - Business logic orchestration layer  
- **`dao.ts`** - Data access layer for databases and external services
- **`dto.ts`** - Data transformation and validation layer
- **`types.ts`** - Type definitions and interfaces

### Optional Files
- **`README.md`** - Function documentation
- **`utils.ts`** - Utility functions specific to the Lambda
- Additional specialized files (e.g., `schema.ts`, `validators.ts`, `prompts.ts`)

## Layer Responsibilities

### `index.ts` - Handler Layer
- **Purpose**: Entry point for Lambda execution
- **Responsibilities**:
  - Receive and log the event
  - Validate environment variables using `checkEnv()`
  - Extract and validate parameters using DTO functions
  - Instantiate Model class with environment
  - Call appropriate Model methods
  - Handle top-level error catching
  - Return response (if applicable)
- **Rules**:
  - MUST NOT contain business logic
  - MUST NOT access databases directly
  - MUST NOT perform data transformations
  - Should be minimal and focused on orchestration

### `model.ts` - Business Logic Layer
- **Purpose**: Orchestrate business operations and workflows
- **Responsibilities**:
  - Implement business logic and rules
  - Coordinate between DAO operations
  - Process and validate business workflows
  - Handle complex operations requiring multiple data sources
- **Rules**:
  - MUST use DAO for all data access
  - MUST NOT contain database connection logic
  - MUST NOT contain data transformation logic (use DTO)
  - Should be exported as class with constructor accepting environment

### `dao.ts` - Data Access Layer
- **Purpose**: Handle all external data operations
- **Responsibilities**:
  - Database queries and operations (MySQL, DynamoDB)
  - External API calls and HTTP requests
  - File operations (S3, local filesystem)
  - Cache operations (Redis)
  - Queue operations (SQS)
  - Secret management operations
- **Rules**:
  - MUST handle all database connections
  - MUST NOT contain business logic
  - MUST NOT perform data transformations
  - Should be exported as class with constructor accepting environment
  - MUST use shared database/service classes from `../../shared/`

### `dto.ts` - Data Transformation Layer
- **Purpose**: Transform and validate data structures
- **Responsibilities**:
  - Parse and validate input events
  - Transform data between different formats
  - Generate response structures
  - Validate request parameters
  - Sanitize and normalize data
- **Rules**:
  - MUST NOT contain business logic
  - MUST NOT access databases or external services
  - Should export functions as default object
  - Focus on pure data transformation functions

### `types.ts` - Type Definitions
- **Purpose**: Define TypeScript interfaces and types
- **Responsibilities**:
  - Interface definitions for data structures
  - Enum definitions for constants
  - Type unions and custom types
  - Configuration objects and constants
- **Rules**:
  - MUST contain only type definitions, interfaces, enums, and constants
  - MUST NOT contain executable code or functions
  - Should export types/interfaces individually or as default object

## Implementation Guidelines

### Environment Handling
- Always validate environment variables using `checkEnv()` in `index.ts`
- Pass environment to Model and DAO constructors
- Use environment-specific configurations in DAO layer

### Error Handling
- Implement try-catch in `index.ts` for top-level error handling
- Log errors appropriately at each layer
- Throw meaningful error messages from Model layer
- Handle database/external service errors in DAO layer

### Imports and Dependencies
- Use shared components from `../../shared/` directory
- Import DTO as default: `import dto from "./dto"`
- Import Model as class: `import Model from "./model"`
- Import types appropriately based on export structure

### Class vs Function Exports
- **Model and DAO**: Export as classes with environment constructor
- **DTO**: Export functions as default object
- **Types**: Export as individual exports or default object

## Code Examples

### `index.ts` Pattern
```typescript
import { checkEnv } from "../../shared/validation/envChecker";
import dto from "./dto";
import Model from "./model";
import { Envs } from "./types";

export const handler = async (event: any) => {
  try {
    checkEnv(Envs);
    const { param1, param2 } = dto.parseEvent(event);
    const model = new Model(environment);
    await model.processOperation(param1, param2);
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
```

### `model.ts` Pattern
```typescript
import { EnvironmentTypes } from "../../shared/types/database";
import Dao from "./dao";

class Model {
  private dao: Dao;

  constructor(environment: EnvironmentTypes) {
    this.dao = new Dao(environment);
  }

  async processOperation(param1: string, param2: string) {
    // Business logic here
    const data = await this.dao.getData(param1);
    // Process data according to business rules
    return await this.dao.saveResult(data);
  }
}

export default Model;
```

## Enforcement Rules

### When Creating New Lambda Functions
1. MUST create all required files (`index.ts`, `model.ts`, `dao.ts`, `dto.ts`, `types.ts`)
2. MUST follow the layer responsibility patterns
3. MUST use shared components for database connections
4. MUST implement proper error handling at each layer

### When Modifying Existing Lambda Functions
1. MUST maintain the existing architecture pattern
2. MUST NOT move responsibilities between layers inappropriately
3. MUST add new functionality in the appropriate layer
4. MUST update types when adding new data structures

### Code Review Requirements
- Verify each layer contains only appropriate responsibilities
- Ensure proper separation of concerns
- Check that shared components are used correctly
- Validate error handling implementation
- Confirm type safety and proper imports

This architecture ensures maintainability, testability, and consistency across all Lambda functions in the repository.