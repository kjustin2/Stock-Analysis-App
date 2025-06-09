# Test API Fixes Script
Write-Host "Testing API fixes..." -ForegroundColor Green

$API_URL = "https://qjziberdp3cojzrebxnvzmxmne0xytky.lambda-url.us-east-1.on.aws"

# Test 1: Check different stock prices
Write-Host "`n1. Testing different stock prices:" -ForegroundColor Blue
$stocks = @("AAPL", "GOOGL", "MSFT", "TSLA")

foreach ($stock in $stocks) {
    try {
        $response = Invoke-WebRequest -Uri "$API_URL/stocks/$stock" -Method GET
        $data = $response.Content | ConvertFrom-Json
        Write-Host "  $stock : $($data.current_price)" -ForegroundColor White
    } catch {
        Write-Host "  $stock : ERROR - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 2: Check technical-chart endpoint
Write-Host "`n2. Testing technical-chart endpoint:" -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "$API_URL/stocks/AAPL/technical-chart?period=1m" -Method GET
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "  Has dates field: $($data.dates -ne $null)" -ForegroundColor White
    Write-Host "  Has price field: $($data.price -ne $null)" -ForegroundColor White
    Write-Host "  Has indicators: $($data.indicators -ne $null)" -ForegroundColor White
    Write-Host "  Dates count: $($data.dates.Count)" -ForegroundColor White
    Write-Host "  Price count: $($data.price.Count)" -ForegroundColor White
    
    if ($data.indicators) {
        Write-Host "  Available indicators:" -ForegroundColor Cyan
        $data.indicators.PSObject.Properties | ForEach-Object {
            Write-Host "    - $($_.Name)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Check chart-data endpoint (original)
Write-Host "`n3. Testing chart-data endpoint:" -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "$API_URL/stocks/AAPL/chart-data?period=1m" -Method GET
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "  Has data field: $($data.data -ne $null)" -ForegroundColor White
    Write-Host "  Data points: $($data.data_points)" -ForegroundColor White
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTest completed!" -ForegroundColor Green
Write-Host "If all tests pass, the frontend errors should be resolved." -ForegroundColor Yellow 