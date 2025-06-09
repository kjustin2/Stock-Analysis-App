# AWS Lambda Deployment Checklist

## Pre-Deployment ✅

- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Python 3.9+ installed
- [ ] Mangum dependency installed (`pip install mangum`)
- [ ] All environment files added to `.gitignore`
- [ ] No hardcoded URLs in source code

## Choose Deployment Option ✅

### Option A: Function URLs (Recommended)
- [ ] Run build script: `.\deploy\build.ps1`
- [ ] Verify package size (should be < 50MB)
- [ ] Run deployment script: `bash deploy/deploy-function-url.sh`
- [ ] Note the Function URL from output (format: `https://abc123.lambda-url.region.on.aws/`)
- [ ] Test health endpoint: `curl https://YOUR_FUNCTION_URL.lambda-url.us-east-1.on.aws/health`

### Option B: API Gateway + Lambda
- [ ] Run build script: `.\deploy\build.ps1`
- [ ] Verify package size (should be < 50MB)
- [ ] Run deployment script: `bash deploy/deploy.sh`
- [ ] Note the API Gateway URL from output (format: `https://abc123.execute-api.region.amazonaws.com/prod`)
- [ ] Test health endpoint: `curl https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/health`

## Security Configuration ✅

- [ ] Copy API Gateway URL (DO NOT commit to repository)
- [ ] Go to GitHub repository Settings
- [ ] Navigate to Secrets and variables → Actions
- [ ] Create new secret: `VITE_API_URL`
- [ ] Paste API Gateway URL as value
- [ ] Verify GitHub Actions workflow uses the secret

## Testing ✅

- [ ] Test all API endpoints:
  - [ ] `GET /health`
  - [ ] `GET /stocks/AAPL`
  - [ ] `GET /stocks/AAPL/recommendation`
  - [ ] `GET /stocks/AAPL/chart-data`
  - [ ] `GET /stocks/AAPL/news`
- [ ] Check CORS headers in browser dev tools
- [ ] Verify frontend connects to Lambda API
- [ ] Test with different stock symbols

## Post-Deployment ✅

- [ ] Monitor CloudWatch logs for errors
- [ ] Check Lambda function metrics
- [ ] Verify API Gateway usage
- [ ] Update documentation if needed
- [ ] Clean up local build files

## Troubleshooting 🔧

**Common Issues:**
- Package too large → Remove unnecessary dependencies
- CORS errors → Check API Gateway CORS configuration
- Cold start timeouts → Increase memory allocation
- Import errors → Verify all dependencies in package

**Useful Commands:**
```bash
# Check Lambda logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/stock-analysis-api

# Update function code only
aws lambda update-function-code --function-name stock-analysis-api --zip-file fileb://lambda-deployment.zip

# Test API Gateway
curl -X GET https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/health
```

## Security Reminders 🔒

- ❌ Never commit API URLs to repository
- ❌ Never commit AWS credentials
- ❌ Never hardcode secrets in source code
- ✅ Use environment variables for all configuration
- ✅ Store sensitive values in GitHub Secrets
- ✅ Keep `.env` files in `.gitignore` 