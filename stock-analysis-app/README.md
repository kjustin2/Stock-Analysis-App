# Stock Analysis & Recommendation System

A modern web application that provides AI-powered stock analysis and investment recommendations with real-time data, technical indicators, and market news.

## 🌐 Live Demo
- **Frontend**: https://kjustin2.github.io/Code-Side-Projects/
- **Backend API**: AWS Lambda Function URL (serverless)

## ✨ Features

- **Real-time Stock Analysis**: Current prices, technical indicators, and market data
- **AI Recommendations**: BUY/SELL signals with confidence levels and price targets
- **Interactive Charts**: Multiple timeframes with technical analysis
- **Latest News**: Curated financial news for each stock
- **Risk Assessment**: Comprehensive risk analysis and explanations
- **Mobile Responsive**: Works on all devices

## 🛠️ Tech Stack

**Frontend**: React + TypeScript + Vite  
**Backend**: FastAPI + Python (AWS Lambda)  
**Deployment**: GitHub Pages + AWS Lambda Function URLs  

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- AWS CLI (for deployment)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/kjustin2/Code-Side-Projects.git
cd Code-Side-Projects/stock-analysis-app
```

2. **Setup Backend**
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
cd backend
pip install -r requirements.txt
```

3. **Setup Frontend**
```bash
cd frontend
npm install
cd ..
```

4. **Start Development Servers**

**Backend (Terminal 1):**
```bash
.\venv\Scripts\activate  # Windows
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8004
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

5. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8004
- API Docs: http://localhost:8004/docs

## 📊 API Endpoints

- `GET /` - API status
- `GET /health` - Health check
- `GET /stocks/{symbol}` - Stock information
- `GET /stocks/{symbol}/recommendation` - BUY/SELL recommendation
- `GET /stocks/{symbol}/chart-data?period=1m` - Chart data
- `GET /stocks/{symbol}/news` - Latest news

## 🏗️ Building for Production

### Local Testing Build

To test the Lambda package locally before deployment:

```bash
cd backend\deploy
.\build.ps1
```

This creates `lambda-deployment.zip` with all dependencies packaged for AWS Lambda.

### Frontend Build

```bash
cd frontend
npm run build
```

## 🚀 AWS Lambda Deployment

### Prerequisites
- AWS CLI installed and configured: `aws configure`
- AWS account with Lambda permissions

### Step 1: Build the Package

```bash
cd backend\deploy
.\build.ps1
```

This script:
- Creates a clean build directory
- Installs Lambda-specific dependencies
- Packages everything into `lambda-deployment.zip`

### Step 2: Deploy to AWS

#### Option A: AWS Console (Recommended for first-time)

1. **Create Lambda Function**:
   - Go to AWS Lambda Console
   - Click "Create function"
   - Choose "Author from scratch"
   - Function name: `stock-analysis-api`
   - Runtime: `Python 3.9`
   - Click "Create function"

2. **Upload Code**:
   - In the function page, click "Upload from" → ".zip file"
   - Upload `backend\deploy\lambda-deployment.zip`
   - Click "Save"

3. **Create Function URL**:
   - Go to "Configuration" → "Function URL"
   - Click "Create function URL"
   - Auth type: `NONE` (public access)
   - CORS settings:
     - Allow origin: `*` (or your specific domain)
     - Allow headers: `*`
     - Allow methods: `*`
   - Click "Save"

4. **Copy Function URL**: Save the generated URL for frontend configuration

#### Option B: AWS CLI (Advanced)

```bash
# Create function (first time only)
aws lambda create-function \
  --function-name stock-analysis-api \
  --runtime python3.9 \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://lambda-deployment.zip

# Update function code (subsequent deployments)
aws lambda update-function-code \
  --function-name stock-analysis-api \
  --zip-file fileb://lambda-deployment.zip
```

### Step 3: Configure CORS (if needed)

If you encounter CORS issues, run the security script:

```bash
cd backend\deploy
.\secure-cors.ps1
```

This restricts access to your GitHub Pages domain only.

## 🔧 Project Structure

```
stock-analysis-app/
├── backend/
│   ├── app/                    # FastAPI application
│   │   ├── main.py            # Main FastAPI app
│   │   └── ...                # Other modules
│   ├── deploy/
│   │   ├── build.ps1          # Build script for Lambda
│   │   ├── secure-cors.ps1    # CORS security script
│   │   └── fix-function-url-auth.ps1  # Auth fix script
│   ├── lambda_function.py     # Lambda entry point
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/                   # React source code
│   ├── package.json          # Node dependencies
│   └── vite.config.ts        # Vite configuration
└── .github/workflows/        # GitHub Actions CI/CD
```

## 🔍 Troubleshooting

### Local Development Issues

**Backend won't start:**
```bash
# Check if virtual environment is activated
.\venv\Scripts\activate

# Verify dependencies
pip install -r backend/requirements.txt

# Check port availability
netstat -an | findstr :8004
```

**Frontend build fails:**
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### AWS Lambda Issues

**Function URL returns 403:**
- Check Function URL auth type is set to `NONE`
- Verify CORS configuration
- Run `.\deploy\fix-function-url-auth.ps1`

**Import errors in Lambda:**
- Rebuild package: `.\deploy\build.ps1`
- Check Python version compatibility (use 3.9)
- Verify all dependencies are in `requirements.txt`

**CORS errors from frontend:**
- Update Function URL CORS settings
- Run `.\deploy\secure-cors.ps1` for domain-specific access
- Check browser developer tools for exact error

### Debug Commands

```bash
# Test Lambda package locally
cd backend
python lambda_function.py

# Check API health
curl https://your-function-url.lambda-url.region.on.aws/health

# Verify frontend build
cd frontend && npm run build && npm run preview
```

## 🔐 Security Notes

- **Never commit API URLs** to your repository
- Use GitHub Secrets for environment variables
- Consider restricting Function URL access to your domain
- Monitor AWS CloudWatch logs for security events

## 📈 Sample Usage

```bash
# Get stock info
curl "https://your-function-url/stocks/AAPL"

# Get recommendation
curl "https://your-function-url/stocks/AAPL/recommendation"

# Get chart data
curl "https://your-function-url/stocks/AAPL/chart-data?period=1mo"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test locally with both frontend and backend
4. Build and test Lambda package
5. Submit a pull request

## 📄 License

This project is for educational and demonstration purposes.

---

**Ready to analyze stocks?** 
1. Start local development servers
2. Visit http://localhost:5173
3. Deploy to AWS when ready! 📈 