# Financial Adviser Application

A comprehensive, locally-run web application that provides detailed financial health analysis and personalized recommendations. Built with Spring Boot backend and modern web frontend, featuring advanced financial planning tools with an intuitive user experience.

## ✨ Enhanced Features

- **🎯 Comprehensive Input Collection**: Detailed financial snapshot with helpful tooltips
- **💡 Smart Tooltips**: Contextual help for every input field explaining what information is needed
- **📊 Investment Allocation Tracking**: Break down your savings across 8+ investment categories
- **🏠 Large Purchase Planning**: Plan for major expenses like homes, cars, weddings, and more
- **🛡️ Emergency Fund Analysis**: Optimize where you store your emergency funds
- **📈 Advanced Projections**: Detailed retirement income breakdown and wealth growth charts
- **🎨 Modern UI/UX**: Responsive design with interactive charts and visual feedback
- **🔒 Complete Privacy**: All data stays local - no external services or data transmission

### Core Analysis Features
- **Financial Health Scoring**: 0-100 score with detailed breakdown and color-coded ratings
- **Real-time Calculations**: Debt-to-income ratio, savings rate, emergency fund analysis
- **Future Projections**: 10-year wealth growth charts and retirement planning
- **Personalized Recommendations**: Priority-based actionable advice with color coding
- **Investment Allocation Visualization**: Interactive pie charts showing your investment mix

## Technical Stack

- **Backend**: Java 21 + Spring Boot 3.2.3
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Database**: H2 (in-memory, no setup required)
- **Charts**: Chart.js for data visualization and allocation tracking
- **Build Tool**: Maven 3.9.5+

## Prerequisites

- **JDK 21** or later
- **Maven 3.9.5** or later
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

## Quick Start

> 📋 **New User?** See [STARTUP_GUIDE.md](STARTUP_GUIDE.md) for a simplified quick start guide.

### 🚀 Option 1: 1-Click Startup (Recommended)

**Windows Users:**
1. Double-click `start.bat` in the project root directory
2. The script will automatically:
   - Check if Java and Maven are installed
   - Build the application if needed (first run only)
   - Start the web server
   - Open your browser to the application
3. Start analyzing your finances immediately!

**PowerShell Users:**
1. Right-click `start.ps1` and select "Run with PowerShell"
2. Or run from command line: `powershell -ExecutionPolicy Bypass -File start.ps1`

**Linux/Mac Users:**
1. Run `./start.sh` in the terminal
2. Make sure the script is executable: `chmod +x start.sh`

**✨ Features of the 1-Click Solution:**
- ✅ **Automatic dependency checking** (Java & Maven)
- ✅ **Auto-build on first run** (no manual compilation needed)
- ✅ **Browser auto-launch** for immediate access
- ✅ **Clear status messages** with colored output
- ✅ **Helpful error messages** with download links
- ✅ **Cross-platform support** (Windows, Linux, Mac)

### Option 2: Manual Startup

1. **Build and run:**
   ```bash
   mvn clean package
   java -jar target/financial-adviser-app-1.0-SNAPSHOT.jar
   ```

2. **Open your browser:**
   - Navigate to `http://localhost:8080`
   - Start using the financial planner immediately

## How to Use

### Step 1: Enter Your Comprehensive Financial Information
Fill out the detailed financial snapshot form with helpful tooltips:
- **💰 Income & Expenses**: Monthly after-tax income and all expenses
- **💼 Investment Allocation**: Break down your savings across 8+ categories (401k, IRA, stocks, etc.)
- **🛡️ Emergency Fund**: Amount and storage location (high-yield savings, money market, etc.)
- **🏠 Large Purchases**: Plan for major expenses like homes, cars, weddings with timeframes
- **👤 Personal Details**: Age, retirement goals, and risk tolerance
- **📊 Assets**: Other investments and valuable possessions

### Step 2: Get Comprehensive Analysis
Receive detailed insights including:
- **Financial Health Score** (0-100) with color-coded rating and breakdown
- **Key Metrics**: Debt-to-income ratio, savings rate, emergency fund adequacy
- **Investment Allocation Chart**: Visual breakdown of your investment mix
- **Large Purchase Analysis**: Feasibility assessment for planned major expenses

### Step 3: View Advanced Projections
Explore interactive visualizations showing:
- **10-Year Wealth Growth** projections with compound interest
- **Retirement Income Breakdown**: Annual projections including Social Security estimates
- **Investment Performance** tracking across different risk scenarios
- **Goal Achievement** timelines and milestones

### Step 4: Follow Priority-Based Recommendations
Get personalized, color-coded advice on:
- **🔴 High Priority**: Critical financial health improvements
- **🟡 Medium Priority**: Important optimizations for better outcomes
- **🟢 Low Priority**: Fine-tuning and advanced strategies
- **Investment rebalancing** suggestions based on your allocation
- **Emergency fund optimization** for better returns while maintaining liquidity

## Project Structure

```
financial-adviser-app/
├── src/
│   ├── main/
│   │   ├── java/com/financialadviser/
│   │   │   ├── FinancialAdviserApplication.java    # Main Spring Boot app
│   │   │   ├── controller/
│   │   │   │   └── FinancialPlannerController.java # REST API
│   │   │   ├── service/
│   │   │   │   ├── FinancialAnalysisService.java   # Core calculations
│   │   │   │   ├── PredictionService.java          # Future projections
│   │   │   │   ├── UserServiceImpl.java            # User management
│   │   │   │   └── FinancialHealthServiceImpl.java # Health metrics
│   │   │   ├── model/                              # Data models
│   │   │   └── repository/                         # Data access
│   │   └── resources/
│   │       ├── static/
│   │       │   ├── index.html                      # Main web interface
│   │       │   ├── styles.css                      # Modern styling
│   │       │   └── app.js                          # Frontend logic
│   │       └── application.properties              # Configuration
│   └── test/                                       # Tests
├── start.bat/.ps1/.sh                             # 1-click startup scripts
└── README.md                                       # This file
```

## API Endpoints

The application provides a comprehensive REST API with enhanced financial analysis:

### Core Endpoints
- **GET** `/` - Main web application with enhanced UI, tooltips, and interactive features with enhanced UI, tooltips, and interactive features
- **GET** `/api/health` - Application health check
- **POST** `/api/quick-score` - Quick financial health score
- **POST** `/api/analyze` - Comprehensive financial analysis with investment allocation, large purchase planning, and enhanced retirement projections

### Request Format
```json
{
  "monthlyIncome": 5000,
  "monthlyExpenses": 3500,
  "monthlySavings": 1000,
  "emergencyFund": 15000,
  "otherAssets": 50000,
  "birthDate": "1990-01-01",
  "targetRetirementAge": 65,
  "riskTolerance": 3,
  "emergencyFundType": "high-yield-savings",
  "allocationBreakdown": {
    "savingsAllocation": 20,
    "retirement401k": 40,
    "traditionalIRA": 15,
    "rothIRA": 10,
    "taxableInvestments": 10,
    "realEstate": 5,
    "cryptocurrency": 0,
    "otherInvestments": 0
  },
  "largePurchase": {
    "type": "house",
    "amount": 300000,
    "timeframe": 5
  }
}
```

### Enhanced Response Format
```json
{
  "healthScore": 85,
  "debtToIncomeRatio": 0.0,
  "savingsRate": 0.20,
  "emergencyFundMonths": 4.3,
  "monthlyCashFlow": 1500,
  "netWorth": 65000,
  "recommendations": [
    {
      "category": "Emergency Fund",
      "priority": "medium",
      "message": "Consider increasing to 6 months of expenses"
    },
    {
      "category": "Investment Allocation",
      "priority": "low",
      "message": "Your allocation looks well balanced for your risk tolerance"
    }
  ],
  "allocationAnalysis": {
    "savingsAllocation": 20.0,
    "retirement401k": 40.0,
    "rothIRA": 20.0,
    "taxableInvestments": 15.0,
    "realEstate": 5.0
  },
  "largePurchaseAnalysis": {
    "type": "house",
    "amount": 300000,
    "timeframe": 5,
    "monthlySavingsNeeded": 5000,
    "feasible": true,
    "recommendation": "Based on your current savings rate, this purchase is achievable within your timeframe."
  },
  "retirementProjection": {
    "projectedSavings": 850000,
    "yearsToRetirement": 35,
    "onTrack": true,
    "annualRetirementIncome": {
      "investmentWithdrawals": 34000,
      "socialSecurity": 24000,
      "otherIncome": 0,
      "totalAnnualIncome": 58000
    }
  },
  "tenYearProjection": {
    "year1": 75000,
    "year5": 125000,
    "year10": 200000
  }
}
```

## Financial Calculation Framework

### Core Metrics
- **Financial Health Score**: Weighted combination of debt ratio, savings rate, emergency fund
- **Debt-to-Income Ratio**: Monthly debt payments / monthly income
- **Savings Rate**: Monthly savings / monthly income
- **Emergency Fund Adequacy**: Current fund / monthly expenses (in months)
- **Net Worth**: Total assets - total liabilities
- **Investment Allocation Analysis**: Breakdown across 8+ investment categories
- **Large Purchase Feasibility**: Monthly savings requirements and timeline analysis

### Enhanced Features
- **Smart Tooltips**: Contextual help explaining each input field
- **Real-time Validation**: Allocation percentages must total 100%
- **Interactive Charts**: Visual representation of investment allocation
- **Priority-based Recommendations**: Color-coded advice (High/Medium/Low priority)
- **Retirement Income Projections**: Detailed breakdown including Social Security estimates
- **Emergency Fund Location Analysis**: Optimization suggestions for better returns

### Projection Models
- **Conservative Growth**: 5% annual returns
- **Moderate Growth**: 7% annual returns  
- **Aggressive Growth**: 10% annual returns
- **Compound Interest**: Monthly contributions with compound growth
- **Inflation Adjustment**: 2-3% annual inflation factor

### Enhanced Recommendations Engine
Priority-based personalized advice with color coding:
- **🔴 High Priority**: Emergency fund adequacy (3-6 months recommended)
- **🟡 Medium Priority**: Debt-to-income ratio optimization (20%, 36% thresholds)
- **🟢 Low Priority**: Savings rate targets (10%, 15%, 20%+)
- **Investment Allocation**: Rebalancing suggestions based on risk tolerance
- **Large Purchase Planning**: Feasibility analysis and savings strategies
- **Emergency Fund Optimization**: Location recommendations for better returns
- **Retirement Income Planning**: Social Security estimates and withdrawal strategies

## Development

### Running Tests
```bash
mvn test                    # Run all tests
mvn test -Dtest=*Service*   # Run service tests only
```

### Development Mode
```bash
mvn spring-boot:run         # Run with auto-reload
```

### Building for Production
```bash
mvn clean package          # Create JAR file
```

## Configuration

The application uses sensible defaults and requires no configuration for basic use. Optional settings in `application.properties`:

```properties
# Server configuration
server.port=8080

# Database (H2 in-memory)
spring.datasource.url=jdbc:h2:mem:financial_adviser
spring.h2.console.enabled=true

# Logging
logging.level.com.financialadviser=INFO
```

## Privacy & Security

- **Local-Only**: All data stays on your computer
- **No Registration**: No accounts or personal information required
- **In-Memory Database**: Data is cleared when application stops
- **No Network Calls**: No external APIs or data transmission
- **Open Source**: Full transparency of calculations and data handling

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Documentation**: Check the code comments for detailed implementation notes
- **Financial Calculations**: Based on standard financial planning principles

---

**Start planning your financial future today!** 🚀💰 