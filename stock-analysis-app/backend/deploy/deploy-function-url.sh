#!/bin/bash

# AWS Lambda Function URL Deployment Script for Stock Analysis API

set -e

# Configuration
FUNCTION_NAME="stock-analysis-api"
REGION="us-east-1"
RUNTIME="python3.9"
HANDLER="lambda_function.lambda_handler"
ROLE_NAME="lambda-execution-role"

echo "Deploying Stock Analysis API to AWS Lambda with Function URL..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "Error: AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Create IAM role if it doesn't exist
echo "Checking IAM role..."
if ! aws iam get-role --role-name $ROLE_NAME > /dev/null 2>&1; then
    echo "Creating IAM role..."
    aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }'
    
    # Attach basic execution policy
    aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    
    echo "Waiting for role to be available..."
    sleep 10
fi

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME > /dev/null 2>&1; then
    echo "Updating existing Lambda function..."
    aws lambda update-function-code --function-name $FUNCTION_NAME --zip-file fileb://lambda-deployment.zip
    
    # Update configuration
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout 30 \
        --memory-size 512 \
        --environment Variables='{STAGE=prod}'
else
    echo "Creating new Lambda function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://lambda-deployment.zip \
        --timeout 30 \
        --memory-size 512 \
        --environment Variables='{STAGE=prod}'
    
    echo "Waiting for function to be active..."
    aws lambda wait function-active --function-name $FUNCTION_NAME
fi

# Create or update Function URL
echo "Setting up Lambda Function URL..."

# Check if Function URL already exists
FUNCTION_URL=$(aws lambda get-function-url-config --function-name $FUNCTION_NAME --query 'FunctionUrl' --output text 2>/dev/null || echo "")

if [ -z "$FUNCTION_URL" ] || [ "$FUNCTION_URL" == "None" ]; then
    echo "Creating Function URL..."
    FUNCTION_URL=$(aws lambda create-function-url-config \
        --function-name $FUNCTION_NAME \
        --auth-type NONE \
        --cors '{
            "AllowCredentials": false,
            "AllowHeaders": ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token", "x-amz-user-agent"],
            "AllowMethods": ["*"],
            "AllowOrigins": ["*"],
            "ExposeHeaders": ["date", "keep-alive"],
            "MaxAge": 86400
        }' \
        --query 'FunctionUrl' --output text)
else
    echo "Function URL already exists, updating CORS..."
    aws lambda update-function-url-config \
        --function-name $FUNCTION_NAME \
        --cors '{
            "AllowCredentials": false,
            "AllowHeaders": ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token", "x-amz-user-agent"],
            "AllowMethods": ["*"],
            "AllowOrigins": ["*"],
            "ExposeHeaders": ["date", "keep-alive"],
            "MaxAge": 86400
        }' > /dev/null
    
    FUNCTION_URL=$(aws lambda get-function-url-config --function-name $FUNCTION_NAME --query 'FunctionUrl' --output text)
fi

echo "Deployment completed successfully!"
echo "Lambda Function URL: $FUNCTION_URL"
echo "Lambda Function: $FUNCTION_NAME"
echo ""
echo "IMPORTANT SECURITY STEPS:"
echo "1. Copy the Function URL above"
echo "2. Add it to your GitHub repository secrets:"
echo "   - Go to Settings → Secrets and variables → Actions"
echo "   - Create new secret: VITE_API_URL"
echo "   - Value: ${FUNCTION_URL%/}"  # Remove trailing slash
echo "3. Never commit this URL to your repository!"
echo ""
echo "Test your API:"
echo "curl ${FUNCTION_URL}health"
echo "curl ${FUNCTION_URL}stocks/AAPL" 