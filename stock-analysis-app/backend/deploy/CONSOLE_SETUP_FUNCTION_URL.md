# AWS Console Setup - Lambda Function URLs

## 🚀 Simplified Lambda Setup (No API Gateway Required!)

Lambda Function URLs provide a direct HTTPS endpoint for your Lambda function, eliminating the need for API Gateway. This is simpler, cheaper, and faster to set up.

### Step 1: Create the Lambda Function

1. **Go to AWS Lambda Console**
   - Navigate to https://console.aws.amazon.com/lambda/
   - Make sure you're in the correct region (e.g., us-east-1)

2. **Create Function**
   - Click "Create function"
   - Select "Author from scratch"
   - Function name: `stock-analysis-api`
   - Runtime: `Python 3.9` (or 3.10/3.11)
   - Architecture: `x86_64`
   - Click "Create function"

### Step 2: Upload Your Code

1. **Prepare the Deployment Package**
   ```bash
   cd backend
   .\deploy\build.ps1
   ```
   This creates `lambda-deployment.zip` (~37MB)

2. **Upload to Lambda**
   - In the Lambda function page, scroll to "Code source"
   - Click "Upload from" → ".zip file"
   - Select your `lambda-deployment.zip`
   - Click "Save"

### Step 3: Configure Lambda Settings

1. **Basic Settings**
   - Go to "Configuration" tab
   - Click "General configuration" → "Edit"
   - Memory: `512 MB`
   - Timeout: `30 seconds`
   - Handler: `lambda_function.lambda_handler`
   - Click "Save"

2. **Environment Variables**
   - Go to "Configuration" → "Environment variables"
   - Click "Edit" → "Add environment variable"
   - Key: `STAGE`, Value: `prod`
   - Click "Save"

### Step 4: Create Function URL (The Magic!)

1. **Enable Function URL**
   - Go to "Configuration" tab
   - Click "Function URL" in the left sidebar
   - Click "Create function URL"

2. **Configure Function URL**
   - Auth type: `NONE` (public access)
   - Check "Configure cross-origin resource sharing (CORS)"
   
3. **CORS Configuration**
   ```json
   {
     "AllowCredentials": false,
     "AllowHeaders": [
       "content-type",
       "x-amz-date", 
       "authorization",
       "x-api-key",
       "x-amz-security-token",
       "x-amz-user-agent"
     ],
     "AllowMethods": ["*"],
     "AllowOrigins": ["*"],
     "ExposeHeaders": [
       "date",
       "keep-alive"
     ],
     "MaxAge": 86400
   }
   ```

4. **Create Function URL**
   - Click "Save"
   - **Copy the Function URL** (looks like: `https://abc123def456.lambda-url.us-east-1.on.aws/`)
   - **🔒 IMPORTANT: DO NOT commit this URL to your repository!**

### Step 5: Test Your Function

1. **Test Health Endpoint**
   ```bash
   curl https://YOUR_FUNCTION_URL.lambda-url.us-east-1.on.aws/health
   ```

2. **Test Stock Endpoints**
   ```bash
   curl https://YOUR_FUNCTION_URL.lambda-url.us-east-1.on.aws/stocks/AAPL
   curl https://YOUR_FUNCTION_URL.lambda-url.us-east-1.on.aws/stocks/AAPL/recommendation
   ```

### Step 6: Configure Frontend (Security!)

1. **Add to GitHub Secrets**
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `VITE_API_URL`
   - Value: `https://YOUR_FUNCTION_URL.lambda-url.us-east-1.on.aws` (no trailing slash)
   - Click "Add secret"

2. **For Local Development**
   ```bash
   cd frontend
   echo "VITE_API_URL=https://YOUR_FUNCTION_URL.lambda-url.us-east-1.on.aws" > .env.local
   ```

## ✅ Benefits of Function URLs vs API Gateway

| Feature | Function URLs | API Gateway |
|---------|---------------|-------------|
| **Setup Complexity** | ✅ Simple | ❌ Complex |
| **Cost** | ✅ Cheaper | ❌ More expensive |
| **Latency** | ✅ Lower | ❌ Higher |
| **CORS** | ✅ Built-in | ❌ Manual setup |
| **Custom Domains** | ❌ Limited | ✅ Full support |
| **Rate Limiting** | ❌ Basic | ✅ Advanced |
| **API Keys** | ❌ No | ✅ Yes |

## 🔧 Troubleshooting

### Common Issues
- **CORS errors**: Check Function URL CORS configuration
- **404 errors**: Verify Function URL is created and active
- **500 errors**: Check Lambda logs in CloudWatch
- **Timeout**: Increase Lambda timeout to 30 seconds

### Useful Commands
```bash
# Test with verbose output
curl -v https://YOUR_FUNCTION_URL.lambda-url.us-east-1.on.aws/health

# Check response headers
curl -I https://YOUR_FUNCTION_URL.lambda-url.us-east-1.on.aws/health
```

### Monitoring
- Go to Lambda → Functions → stock-analysis-api
- Click "Monitor" → "View logs in CloudWatch"
- Check "Metrics" for performance data

## 🔒 Security Notes

- Function URLs are public by default (Auth type: NONE)
- Use CORS to restrict origins in production
- Monitor usage in CloudWatch
- Consider adding authentication for sensitive endpoints

## 💡 Pro Tips

1. **No API Gateway needed** - Direct Lambda invocation
2. **Automatic HTTPS** - SSL/TLS included
3. **Global edge locations** - Fast worldwide access
4. **Pay per request** - Very cost effective
5. **Easy updates** - Just upload new ZIP file

Your Lambda function is now accessible directly via Function URL! This is the simplest and most cost-effective way to deploy your FastAPI application. 