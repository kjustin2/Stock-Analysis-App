# Manual Deployment Steps (Backup Option)

If the automated scripts continue to fail, follow these manual steps:

## Step 1: Create Clean Directory
```powershell
# From project root
mkdir deploy-manual
cd deploy-manual
```

## Step 2: Copy Lambda Function
```powershell
copy ..\backend\lambda_function.py .
```

## Step 3: Install Dependencies Manually
```powershell
# Install each dependency separately to avoid conflicts
pip install --target . fastapi==0.68.0 --no-deps
pip install --target . mangum==0.12.3 --no-deps  
pip install --target . pydantic==1.10.2 --no-deps
pip install --target . requests==2.31.0 --no-deps
pip install --target . starlette==0.14.2 --no-deps
pip install --target . typing-extensions==4.4.0 --no-deps
```

## Step 4: Create Zip Manually
```powershell
# Wait a moment for file handles to release
Start-Sleep -Seconds 5

# Create zip using 7-Zip (if available) or Windows built-in
Compress-Archive -Path * -DestinationPath ..\lambda-manual.zip -Force
```

## Step 5: Deploy to AWS
```powershell
cd ..
aws lambda update-function-code --function-name stock-analysis-api --zip-file fileb://lambda-manual.zip --region us-east-1
```

## Step 6: Test Deployment
```powershell
# Wait for deployment to complete
Start-Sleep -Seconds 10

# Test the API
Invoke-WebRequest -Uri "https://qjziberdp3cojzrebxnvzmxmne0xytky.lambda-url.us-east-1.on.aws/stocks/AAPL" -Method GET
```

## Step 7: Clean Up
```powershell
Remove-Item -Recurse -Force deploy-manual
Remove-Item lambda-manual.zip
```

## Alternative: Use AWS Console

If command line deployment continues to fail:

1. **Create the zip file manually**:
   - Copy `backend/lambda_function.py` to a new folder
   - Install dependencies in that folder
   - Zip the entire contents (not the folder itself)

2. **Upload via AWS Console**:
   - Go to AWS Lambda Console
   - Find your `stock-analysis-api` function
   - Click "Upload from" → ".zip file"
   - Select your zip file
   - Click "Save"

3. **Test the function**:
   - Use the Test tab in AWS Console
   - Or test via your website at https://kjustin2.github.io

## Troubleshooting

If you get permission errors:
- Close any file explorers or editors that might have files open
- Run PowerShell as Administrator
- Use `taskkill /f /im python.exe` to kill any hanging Python processes

If AWS CLI fails:
- Check credentials: `aws sts get-caller-identity`
- Verify function exists: `aws lambda get-function --function-name stock-analysis-api --region us-east-1`
- Try uploading via AWS Console instead 