# Lambda Repository - Development Environment

This repository serves as a comprehensive development environment for AWS Lambda functions, providing local development capabilities, testing infrastructure, compilation with ncc, and deployment preparation. It contains multiple Lambda functions for various business operations including authentication, order processing, reconciliation, and carrier integrations.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Lambda Functions](#lambda-functions)
4. [Getting Started](#getting-started)
5. [Development Workflow](#development-workflow)
6. [Building Lambda Functions](#building-lambda-functions)
7. [Setting Up Visual Studio Code (VSCode)](#setting-up-visual-studio-code-vscode)
8. [Additional Notes](#additional-notes)

---

## Project Overview

This repository is designed as a centralized development environment for AWS Lambda functions, enabling:

- **Local Development**: Test and debug Lambda functions locally before deployment
- **Compilation**: Use ncc to compile TypeScript Lambda functions into optimized bundles
- **Testing**: Comprehensive testing infrastructure for Lambda function validation
- **Deployment Preparation**: Automated build processes for production-ready deployments
- **Shared Utilities**: Common utilities and services shared across Lambda functions
- **Multi-Environment Support**: Support for development, staging, and production environments

## Repository Structure

```
├── README.md                    # This documentation
├── package.json                 # Project dependencies and scripts
├── build-lambda.sh             # Interactive build script for Lambda functions
├── src/
│   ├── lambdas/                # Individual Lambda function implementations
│   │   ├── example/            # Example/template Lambda function
│   │   ├── b2b-auth/           # B2B authentication and authorization
│   │   ├── b2c-auth/           # B2C authentication and authorization
│   │   ├── blacklist-monitor-wallet/  # Wallet blacklist monitoring
│   │   ├── inteliflete-statistics/    # Carrier statistics processing
│   │   ├── MasterShop-handleShipmentStatusUpdatesCoordinadora/  # Coordinadora status updates
│   │   ├── MasterShop-handleShipmentUpdatesCoordinadora/        # Coordinadora shipment updates
│   │   ├── Mastershop-shopifyDataNormalizer/                    # Shopify data normalization
│   │   ├── processAdditionalStepsInOrdersUpdate/               # Order processing workflows
│   │   ├── reconciliation-checkReconciliationDocumentAndLoadItemsToDb/  # Document reconciliation
│   │   ├── reconciliation-mastershop-loadItemsToQueueReconciliationProcess/  # Queue management
│   │   └── reconciliation-mastershop-orderReconciliationAnomalyChecker/     # Anomaly detection
│   └── shared/                 # Shared utilities and services
│       ├── databases/          # Database connection utilities
│       ├── responses/          # HTTP response formatting
│       ├── services/           # External service integrations
│       ├── types/              # TypeScript type definitions
│       └── validation/         # Input validation utilities
├── dist/                       # Compiled Lambda function output
└── .vsc/                       # VSCode configuration and profiles
```

## Lambda Functions

This repository contains 12 Lambda functions, each serving specific business purposes:

### Authentication Functions
- **[b2b-auth](src/lambdas/b2b-auth/README.md)**: API Gateway authorization for B2B clients using API keys and scope-based access control
- **[b2c-auth](src/lambdas/b2c-auth/README.md)**: API Gateway authorization for B2C clients using Cognito JWT tokens

### Monitoring and Statistics
- **[blacklist-monitor-wallet](src/lambdas/blacklist-monitor-wallet/README.md)**: Manages blacklist operations for user wallets and associated entities
- **[inteliflete-statistics](src/lambdas/inteliflete-statistics/README.md)**: Processes and updates carrier statistics for performance analysis

### E-commerce Integration
- **[MasterShop-handleShipmentStatusUpdatesCoordinadora](src/lambdas/MasterShop-handleShipmentStatusUpdatesCoordinadora/README.md)**: Processes shipment status updates from Coordinadora carrier
- **[MasterShop-handleShipmentUpdatesCoordinadora](src/lambdas/MasterShop-handleShipmentUpdatesCoordinadora/README.md)**: Handles general shipment updates and incidents from Coordinadora
- **[Mastershop-shopifyDataNormalizer](src/lambdas/Mastershop-shopifyDataNormalizer/README.md)**: Normalizes Shopify order data for Mastershop integration

### Order Processing
- **[processAdditionalStepsInOrdersUpdate](src/lambdas/processAdditionalStepsInOrdersUpdate/README.md)**: Processes carrier-specific additional steps during order updates

### Reconciliation System
- **[reconciliation-checkReconciliationDocumentAndLoadItemsToDb](src/lambdas/reconciliation-checkReconciliationDocumentAndLoadItemsToDb/README.md)**: Processes reconciliation documents and loads items to database
- **[reconciliation-mastershop-loadItemsToQueueReconciliationProcess](src/lambdas/reconciliation-mastershop-loadItemsToQueueReconciliationProcess/README.md)**: Loads reconciliation items into processing queues
- **[reconciliation-mastershop-orderReconciliationAnomalyChecker](src/lambdas/reconciliation-mastershop-orderReconciliationAnomalyChecker/README.md)**: Detects and handles anomalies in reconciliation data

### Development Template
- **[example](src/lambdas/example/README.md)**: Basic example Lambda function demonstrating structure and patterns

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn package manager
- AWS CLI configured with appropriate credentials
- TypeScript knowledge for Lambda function development

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd lambda-repository
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables as needed for specific Lambda functions

### Environment Setup

Each Lambda function may require specific environment variables. Refer to individual Lambda function documentation for detailed setup instructions.

## Development Workflow

### Local Development

1. **Choose a Lambda Function**: Navigate to the specific Lambda function directory in `src/lambdas/`
2. **Review Documentation**: Read the function's README.md for specific requirements and setup
3. **Configure Environment**: Set up required environment variables and dependencies
4. **Develop and Test**: Implement changes and test locally using the development setup
5. **Build and Deploy**: Use the build script to compile and prepare for deployment

### Testing Lambda Functions

Each Lambda function includes testing guidance in its individual documentation. General testing approach:

1. Set up test data and environment variables
2. Create test events matching the expected input format
3. Run the function locally or use AWS SAM for local testing
4. Validate outputs and error handling

## Building Lambda Functions

To build your Lambda function, follow these steps:

1. Open a terminal in the root directory of your project.
2. Run the following command:
   ```bash
   npm run build
   ```
3. When prompted, select the Lambda function you want to build from the interactive menu.

The script will compile and package your Lambda function for deployment in `./dist/index.js`

## Setting Up Visual Studio Code (VSCode)

To ensure a consistent and efficient development environment, you can import a predefined VSCode profile. This profile includes all the necessary extensions and settings for working with Lambda projects.

### Steps to Import the VSCode Profile

1. Open Visual Studio Code.
2. Navigate to the **Command Palette**:
   - Windows/Linux: Press `Ctrl+Shift+P`
   - Mac: Press `Cmd+Shift+P`
3. Search for and select **"Preferences: Import Profile"**.
4. Choose the file located at `.vsc/BeMaster.code-profile` in your project directory.
5. Follow the prompts to complete the import process.

Once imported, your VSCode environment will be configured with all the required extensions and settings for Lambda development.

---

## Additional Notes

- Ensure you have the necessary permissions to execute the `build-lambda.sh` script. If needed, run:
  ```bash
  chmod +x build-lambda.sh
  ```
