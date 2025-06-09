# AWS Lambda Deployment Guide

## 🚀 Two Deployment Options

### Option A: Function URLs (Recommended - Simpler & Cheaper)
- Direct Lambda endpoint
- No API Gateway required
- Lower latency and cost
- Built-in CORS support

### Option B: API Gateway + Lambda (Advanced)
- More features (rate limiting, API keys, etc.)
- Custom domain support
- More complex setup

## Prerequisites

1. **AWS CLI**: Install and configure AWS CLI
   ```bash
   aws configure
   ```

2. **Python Dependencies**: Install mangum for Lambda compatibility
   ```bash
   pip install mangum
   ```

## Deployment Steps

### Option A: Function URLs (Recommended)

#### Automated Deployment:
```bash
cd backend

# Build the deployment package
.\deploy\build.ps1

# Deploy with Function URL
bash deploy/deploy-function-url.sh
```

#### Manual Deployment:
See `CONSOLE_SETUP_FUNCTION_URL.md` for step-by-step console instructions.

### Option B: API Gateway + Lambda

#### Automated Deployment:
```bash
cd backend

# Build the deployment package
.\deploy\build.ps1

# Deploy with API Gateway
bash deploy/deploy.sh
```

### Option 2: Manual Deployment

1. **Build Package**:
   ```bash
   cd backend
   mkdir build
   cp -r app/ build/
   cp lambda_function.py build/
   cp lambda_requirements.txt build/requirements.txt
   cd build
   pip install -r requirements.txt -t .
   zip -r ../lambda-deployment.zip .
   ```

2. **Create Lambda Function**:
   - Go to AWS Lambda Console
   - Create new function
   - Upload `lambda-deployment.zip`
   - Set handler to `lambda_function.lambda_handler`
   - Set timeout to 30 seconds
   - Set memory to 512 MB

3. **Create API Gateway**:
   - Create new REST API
   - Create proxy resource `{proxy+}`
   - Set up ANY method with Lambda proxy integration
   - Deploy to stage

## Configuration

### Environment Variables
- `STAGE`: Deployment stage (default: prod)
- `CORS_ORIGINS`: Additional CORS origins (comma-separated)

### Lambda Settings
- **Runtime**: Python 3.9
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Handler**: `lambda_function.lambda_handler`

## Testing

After deployment, test your API:

```bash
# Health check
curl https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/health

# Stock data
curl https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/stocks/AAPL/data
```

## Troubleshooting

### Common Issues

1. **Package too large**: Remove unnecessary dependencies or use Lambda Layers
2. **Cold start timeout**: Increase memory allocation
3. **CORS errors**: Check API Gateway CORS configuration
4. **Import errors**: Ensure all dependencies are included in package

### Logs
Check CloudWatch Logs for detailed error information:
```bash
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/stock-analysis-api
```

## Cost Optimization

- Use provisioned concurrency for consistent performance
- Optimize package size to reduce cold start time
- Monitor usage with CloudWatch metrics
- Consider Lambda Layers for large dependencies 