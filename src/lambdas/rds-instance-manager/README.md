# RDS Instance Manager Lambda

## Overview

The RDS Instance Manager Lambda function manages the state of Amazon RDS database instances by starting or stopping them based on scheduled events from EventBridge. This function is designed to help reduce costs by automatically managing RDS instances during non-productive hours.

## Purpose

This lambda function serves as an automated RDS instance management system that can start or stop multiple RDS database instances based on scheduled events. It's primarily used for cost optimization by shutting down development or staging databases during off-hours and starting them when needed.

## Functionality

### Core Operations

1. **Start RDS Instances**: Starts specified RDS database instances
2. **Stop RDS Instances**: Stops specified RDS database instances
3. **Batch Processing**: Handles multiple instances in a single execution
4. **Error Handling**: Continues processing other instances even if one fails

### Supported Actions

- **start**: Starts the specified RDS instances
- **stop**: Stops the specified RDS instances

## Business Logic

### Processing Flow

1. **Event Validation**: Validates the incoming EventBridge event structure
2. **Parameter Extraction**: Extracts action and RDS ARNs from the event
3. **Instance Processing**: Processes each RDS instance sequentially
4. **ARN Parsing**: Extracts instance identifier from the RDS ARN
5. **AWS Operation**: Executes the start/stop command via AWS RDS API
6. **Result Logging**: Logs the result of each operation for monitoring

### Error Handling Strategy

- **Continue on Error**: If one instance fails, processing continues with remaining instances
- **Detailed Logging**: Each operation result is logged for debugging
- **Graceful Degradation**: Partial success is considered a successful execution

## Input/Output

### Input (EventBridge Event)

```json
{
  "action": "start",
  "rdsArns": [
    "arn:aws:rds:us-east-1:123456789012:db:my-database-1",
    "arn:aws:rds:us-east-1:123456789012:db:my-database-2"
  ]
}
```

```json
{
  "action": "stop",
  "rdsArns": [
    "arn:aws:rds:us-east-1:123456789012:db:my-database-1",
    "arn:aws:rds:us-east-1:123456789012:db:my-database-2"
  ]
}
```

### Output

- **Success Response**: HTTP 200 with success message
- **Error Response**: HTTP 500 with error details

```json
{
  "statusCode": 200,
  "body": "\"RDS instances processed successfully\""
}
```

## Dependencies

### AWS Services
- **Amazon RDS**: For database instance management
- **AWS Lambda**: Runtime environment
- **EventBridge**: For scheduled event triggers
- **CloudWatch**: For logging and monitoring

### NPM Packages
- **@aws-sdk/client-rds**: AWS SDK for RDS operations
- **typescript**: For type safety and development

### Internal Dependencies
- **httpResponse**: Shared response utility
- **DTO**: Parameter validation and extraction
- **DAO**: AWS RDS API interactions
- **Model**: Business logic coordination

## Error Handling

### Validation Errors
- **Missing Parameters**: Required fields (action, rdsArns) not provided
- **Invalid Action**: Action must be 'start' or 'stop'
- **Invalid ARNs**: Malformed RDS ARN format
- **Empty Array**: rdsArns cannot be empty

### AWS RDS Errors
- **Instance Not Found**: RDS instance doesn't exist
- **Invalid State**: Instance already in requested state
- **Permission Denied**: Insufficient IAM permissions
- **API Throttling**: AWS API rate limits exceeded

### Error Response Format
All errors return HTTP 500 with error details in the response body.

## Usage Examples

### EventBridge Rule Configuration

```json
{
  "Rules": [
    {
      "Name": "StopRDSInstancesEvening",
      "ScheduleExpression": "cron(0 18 * * MON-FRI *)",
      "State": "ENABLED",
      "Targets": [
        {
          "Id": "1",
          "Arn": "arn:aws:lambda:us-east-1:123456789012:function:rds-instance-manager",
          "Input": "{\"action\":\"stop\",\"rdsArns\":[\"arn:aws:rds:us-east-1:123456789012:db:dev-database\"]}"
        }
      ]
    },
    {
      "Name": "StartRDSInstancesMorning",
      "ScheduleExpression": "cron(0 8 * * MON-FRI *)",
      "State": "ENABLED",
      "Targets": [
        {
          "Id": "1",
          "Arn": "arn:aws:lambda:us-east-1:123456789012:function:rds-instance-manager",
          "Input": "{\"action\":\"start\",\"rdsArns\":[\"arn:aws:rds:us-east-1:123456789012:db:dev-database\"]}"
        }
      ]
    }
  ]
}
```

### Manual Invocation

```javascript
// Start multiple instances
const startEvent = {
  action: "start",
  rdsArns: [
    "arn:aws:rds:us-east-1:123456789012:db:dev-database",
    "arn:aws:rds:us-east-1:123456789012:db:staging-database"
  ]
};

// Stop multiple instances
const stopEvent = {
  action: "stop",
  rdsArns: [
    "arn:aws:rds:us-east-1:123456789012:db:dev-database",
    "arn:aws:rds:us-east-1:123456789012:db:staging-database"
  ]
};
```

## IAM Permissions Required

The Lambda execution role must have the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:StartDBInstance",
        "rds:StopDBInstance",
        "rds:DescribeDBInstances"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

## Environment Variables

- **AWS_REGION**: AWS region for RDS operations (defaults to us-east-1)

## Monitoring and Logging

### CloudWatch Logs
The function provides detailed logging including:
- Event parameters received
- Each instance processing attempt
- Success/failure status for each instance
- Error details for failed operations
- Processing summary

### Log Examples

```
Event =>>> {"action":"start","rdsArns":["arn:aws:rds:us-east-1:123456789012:db:my-database"]}
params =>>> {"action":"start","rdsArns":["arn:aws:rds:us-east-1:123456789012:db:my-database"]}
Processing start for instance: my-database (ARN: arn:aws:rds:us-east-1:123456789012:db:my-database)
Starting RDS instance: my-database
Successfully started RDS instance: my-database
Processing results =>>> [{"instanceId":"my-database","status":"started","success":true}]
```

## Deployment

### Lambda Configuration
- **Runtime**: Node.js 18.x or later
- **Memory**: 256 MB (recommended)
- **Timeout**: 5 minutes (to handle multiple instances)
- **Environment Variables**: AWS_REGION (optional)

### EventBridge Integration
- Configure EventBridge rules with cron expressions
- Set Lambda function as target
- Provide event payload with action and rdsArns

## Best Practices

### Cost Optimization
- Schedule stop operations for non-productive hours
- Schedule start operations before business hours
- Group related instances in single events for efficiency

### Error Handling
- Monitor CloudWatch logs for failed operations
- Set up CloudWatch alarms for consecutive failures
- Implement retry logic in EventBridge if needed

### Security
- Use least privilege IAM permissions
- Restrict RDS operations to specific instances if possible
- Enable CloudTrail for audit logging

## Related Components

- **DTO (dto.ts)**: Handles event validation and parameter extraction
- **DAO (dao.ts)**: Manages direct AWS RDS API interactions
- **Model (model.ts)**: Contains business logic and orchestration
- **Handler (index.ts)**: Main entry point and error handling

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure Lambda execution role has required RDS permissions
2. **Instance Not Found**: Verify RDS ARNs are correct and instances exist
3. **Invalid State**: Check if instance is already in the requested state
4. **Timeout**: Increase Lambda timeout for processing many instances

### Debugging Steps

1. Check CloudWatch logs for detailed error messages
2. Verify EventBridge event format matches expected structure
3. Test with single instance before processing multiple instances
4. Ensure AWS region matches RDS instance region