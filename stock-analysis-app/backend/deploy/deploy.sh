#!/bin/bash

# AWS Lambda Deployment Script for Stock Analysis API

set -e

# Configuration
FUNCTION_NAME="stock-analysis-api"
REGION="us-east-1"
RUNTIME="python3.9"
HANDLER="lambda_function.lambda_handler"
ROLE_NAME="lambda-execution-role"
API_NAME="stock-analysis-api"

echo "Deploying Stock Analysis API to AWS Lambda..."

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
fi

# Create or update API Gateway
echo "Setting up API Gateway..."

# Check if API exists
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='$API_NAME'].id" --output text)

if [ -z "$API_ID" ] || [ "$API_ID" == "None" ]; then
    echo "Creating API Gateway..."
    API_ID=$(aws apigateway create-rest-api --name $API_NAME --query 'id' --output text)
    
    # Get root resource ID
    ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --query 'items[0].id' --output text)
    
    # Create proxy resource
    RESOURCE_ID=$(aws apigateway create-resource --rest-api-id $API_ID --parent-id $ROOT_ID --path-part '{proxy+}' --query 'id' --output text)
    
    # Create ANY method
    aws apigateway put-method --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method ANY --authorization-type NONE
    
    # Set up integration
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method ANY \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$(aws sts get-caller-identity --query Account --output text):function:$FUNCTION_NAME/invocations
    
    # Add permission for API Gateway to invoke Lambda
    aws lambda add-permission \
        --function-name $FUNCTION_NAME \
        --statement-id apigateway-invoke \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_ID/*/*"
    
    # Deploy API
    aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod
fi

# Get API Gateway URL
API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

echo "Deployment completed successfully!"
echo "API Gateway URL: $API_URL"
echo "Lambda Function: $FUNCTION_NAME"
echo ""
echo "IMPORTANT SECURITY STEPS:"
echo "1. Copy the API Gateway URL above"
echo "2. Add it to your GitHub repository secrets:"
echo "   - Go to Settings → Secrets and variables → Actions"
echo "   - Create new secret: VITE_API_URL"
echo "   - Value: $API_URL"
echo "3. Never commit this URL to your repository!"
echo ""
echo "Test your API:"
echo "curl $API_URL/health" 