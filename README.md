# Lambda Functions Repository

This repository contains a collection of AWS Lambda functions designed for various business operations including authentication, shipment tracking, reconciliation processes, and monitoring systems. The project serves as a development and testing environment for Lambda functions before deployment to AWS.

## Overview

This repository provides a centralized development environment for multiple Lambda functions, enabling local testing, compilation with NCC (Node.js Compile Cache), and deployment of minified versions to AWS Lambda.

## Project Structure

```
src/lambdas/
├── b2b-auth/                    # B2B API authentication and authorization
├── b2c-auth/                    # B2C user authentication with Cognito
├── blacklist-monitor-wallet/    # Wallet and entity blacklist management
├── inteleflete-statistics/      # Statistics processing and updates
├── MasterShop-handleShipmentStatusUpdatesCoordinadora/  # Shipment status updates
├── MasterShop-handleShipmentUpdatesCoordinadora/        # Shipment tracking updates
├── processAdditionalStepsInOrdersUpdate/                # Order processing with multiple carriers
├── reconciliation-checkReconciliationDocumentAndLoadItemsToDb/  # Document processing for reconciliation
├── reconciliation-mastershop-loadItemsToQueueReconciliationProcess/  # Queue loading for reconciliation
└── reconciliation-mastershop-orderReconciliationAnomalyChecker/      # Anomaly detection in reconciliation
```

## Features

- **Local Development**: Test Lambda functions locally using Express server
- **TypeScript Support**: Full TypeScript implementation with type safety
- **NCC Compilation**: Bundle and minify functions for deployment
- **Environment Management**: Support for multiple environments (dev, staging, prod)
- **Database Integration**: MySQL and DynamoDB support
- **AWS Services**: Integration with S3, SQS, Secrets Manager, and more

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- AWS CLI configured (for deployment)
- Git

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd lambdas-ts
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Development

### Local Testing

Start the development server to test Lambda functions locally:

```bash
npm run dev
```

This will start an Express server that allows you to test your Lambda functions locally before deployment.

### Building Lambda Functions

To build a specific Lambda function:

```bash
npm run build
```

When prompted, enter the name of the Lambda function folder you want to build. The script will:

1. Compile TypeScript to JavaScript
2. Bundle dependencies using NCC
3. Create a minified version in `./dist/index.js`

### Available Scripts

- `npm run dev`: Start local development server
- `npm run build`: Build Lambda function with NCC
- `npm run test`: Run tests (if configured)
- `npm run lint`: Run ESLint for code quality

## Deployment

After building a Lambda function, the minified version will be available in `./dist/index.js`. You can deploy this file to AWS Lambda using:

- AWS CLI
- AWS Console
- CI/CD pipelines
- Serverless Framework

## Environment Configuration

The project supports multiple environments through environment variables:

- `NODE_ENV`: Environment (development, staging, production)
- Database configurations
- AWS service configurations
- API keys and secrets

## Project Architecture

### Shared Components

- **Database**: MySQL and DynamoDB connections
- **Services**: S3, SQS, Secrets Manager integrations
- **Responses**: Standardized HTTP and XLSX response formats
- **Validation**: Environment and input validation utilities
- **Types**: Common TypeScript type definitions

### Lambda Function Structure

Each Lambda function follows a consistent structure:

```
lambda-name/
├── index.ts          # Main handler function
├── model.ts          # Business logic
├── dao.ts            # Data access layer
├── dto.ts            # Data transfer objects
├── types.ts          # Type definitions
└── README.md         # Function documentation
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally using `npm run dev`
4. Build and test the specific function
5. Submit a pull request

## Documentation

Each Lambda function has its own README.md file with detailed documentation about:

- Purpose and functionality
- Input/output specifications
- Business logic overview
- Dependencies and requirements

## Support

For questions or issues:

1. Check the individual Lambda function documentation
2. Review the shared components documentation
3. Contact the development team

## License

[Add your license information here]
