# BeMaster Lambda Functions Repository

This repository contains a collection of Lambda functions developed in TypeScript for the BeMaster ecosystem. It provides a unified environment for development, local testing, compilation, and deployment of serverless functions.

## Project Purpose

This repository serves as:
- **Development Center**: Unified environment for all BeMaster Lambda functions
- **Local Testing**: Capability to test functions locally before deployment
- **Optimized Compilation**: Uses NCC to minify and optimize code
- **Automated Deployment**: Scripts to facilitate the deployment process

## Project Architecture

The project is organized as follows:

```
src/
├── lambdas/           # Individual Lambda functions
├── shared/            # Shared code between lambdas
│   ├── databases/     # Database configurations
│   ├── responses/     # HTTP response utilities
│   ├── services/      # External services (S3, Secrets Manager)
│   └── validation/    # Common validators
└── conf/              # Global configurations
```

## Available Lambda Functions

### Authentication
- **b2b-auth**: Authorization for B2B clients
- **b2c-auth**: Authorization for B2C clients using Cognito

### Monitoring and Security
- **blacklist-monitor-wallet**: Wallet blacklist management

### Logistics and Shipping
- **MasterShop-handleShipmentStatusUpdatesCoordinadora**: Shipment status update handling
- **MasterShop-handleShipmentUpdatesCoordinadora**: Shipment update processing
- **processAdditionalStepsInOrdersUpdate**: Additional processing for order updates

### Statistics and Reports
- **inteliflete-statistics**: Inteliflete statistics generation

### Reconciliation
- **reconciliation-checkReconciliationDocumentAndLoadItemsToDb**: Reconciliation document verification and loading
- **reconciliation-mastershop-loadItemsToQueueReconciliationProcess**: Loading items to reconciliation queue
- **reconciliation-mastershop-orderReconciliationAnomalyChecker**: Reconciliation anomaly detector

## Development Environment Setup

### Prerequisites
- Node.js (recommended version in package.json)
- npm or yarn
- AWS CLI configured

### Installation
```bash
npm install
```

### Environment Variables
Copy `.example.env` to `.env` and configure the necessary variables:
```bash
cp .example.env .env
```

## Compilation and Deployment

### Compile a Lambda
```bash
npm run build
```
When prompted, enter the name of the folder containing the lambda source code.

### Compilation Result
The script will compile and package the Lambda function in `./dist/index.js` using NCC for optimization.

## Visual Studio Code Configuration

For a consistent development environment:

1. Open Visual Studio Code
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Search for "Preferences: Import Profile"
4. Select the `.vsc/BeMaster.code-profile` file
5. Follow the instructions to complete the import

## Lambda Structure

Each lambda follows a standard structure:
```
lambda-name/
├── index.ts          # Main entry point
├── model.ts          # Business logic
├── dto.ts            # Data transformation
├── dao.ts            # Data access (optional)
├── types.ts          # Type definitions
└── README.md         # Specific documentation
```

## Local Testing

Each lambda can be tested locally using the `index.ts` file in the project root.

## Additional Notes

- Make sure you have execution permissions for `build-lambda.sh`:
  ```bash
  chmod +x build-lambda.sh
  ```
- Lambdas share common code through the `shared/` directory
- Each lambda has its own detailed documentation in its respective README.md
