// Financial Planner Application
class FinancialPlannerApp {
    constructor() {
        this.apiBaseUrl = '/api';
        this.chart = null;
        this.allocationChart = null;
        this.initializeEventListeners();
        this.initializeTooltips();
        this.initializeAllocationTracking();
        this.initializeLargePurchaseHandling();
    }

    initializeEventListeners() {
        const form = document.getElementById('financial-form');
        const quickAnalysisBtn = document.getElementById('quick-analysis-btn');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.performFullAnalysis();
        });

        quickAnalysisBtn.addEventListener('click', () => {
            this.performQuickAnalysis();
        });

        // Add input validation and real-time feedback
        this.addInputValidation();
    }

    initializeTooltips() {
        const infoIcons = document.querySelectorAll('.info-icon');
        const tooltip = document.getElementById('tooltip');

        infoIcons.forEach(icon => {
            icon.addEventListener('mouseenter', (e) => {
                const tooltipText = e.target.getAttribute('data-tooltip');
                tooltip.textContent = tooltipText;
                tooltip.classList.add('show');
                
                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
            });

            icon.addEventListener('mouseleave', () => {
                tooltip.classList.remove('show');
            });
        });
    }

    initializeAllocationTracking() {
        const allocationInputs = document.querySelectorAll('.allocation-grid input[type="number"]');
        const totalElement = document.getElementById('totalAllocation');
        const totalContainer = document.querySelector('.allocation-total');

        const updateTotal = () => {
            let total = 0;
            allocationInputs.forEach(input => {
                total += parseFloat(input.value) || 0;
            });
            
            totalElement.textContent = total.toFixed(0);
            
            // Update styling based on total
            totalContainer.className = 'allocation-total';
            if (total > 100) {
                totalContainer.classList.add('error');
            } else if (total > 0 && total < 95) {
                totalContainer.classList.add('warning');
            }
        };

        allocationInputs.forEach(input => {
            input.addEventListener('input', updateTotal);
        });
    }

    initializeLargePurchaseHandling() {
        const purchaseTypeSelect = document.getElementById('largePurchaseType');
        const detailsGroup = document.getElementById('purchaseDetailsGroup');
        const timeframeGroup = document.getElementById('purchaseTimeframeGroup');

        purchaseTypeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'none') {
                detailsGroup.style.display = 'none';
                timeframeGroup.style.display = 'none';
            } else {
                detailsGroup.style.display = 'block';
                timeframeGroup.style.display = 'block';
            }
        });
    }

    addInputValidation() {
        const inputs = document.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.validateInput(input);
            });
        });
    }

    validateInput(input) {
        const value = parseFloat(input.value);
        if (value < 0) {
            input.style.borderColor = '#e53e3e';
            input.title = 'Value cannot be negative';
        } else {
            input.style.borderColor = '#e2e8f0';
            input.title = '';
        }
    }

    getFormData() {
        const formData = new FormData(document.getElementById('financial-form'));
        const data = {};

        for (let [key, value] of formData.entries()) {
            if (key === 'birthDate') {
                data[key] = value || null;
            } else if (['targetRetirementAge', 'riskTolerance', 'purchaseTimeframe'].includes(key)) {
                data[key] = value ? parseInt(value) : null;
            } else if (key.includes('Allocation') || key.includes('IRA') || key.includes('401k') || 
                      key.includes('Investments') || key.includes('Estate') || key.includes('cryptocurrency')) {
                data[key] = value ? parseFloat(value) : 0;
            } else {
                data[key] = value ? parseFloat(value) : 0;
            }
        }

        // Add allocation breakdown
        data.allocationBreakdown = {
            savingsAllocation: data.savingsAllocation || 0,
            retirement401k: data.retirement401k || 0,
            traditionalIRA: data.traditionalIRA || 0,
            rothIRA: data.rothIRA || 0,
            taxableInvestments: data.taxableInvestments || 0,
            realEstate: data.realEstate || 0,
            cryptocurrency: data.cryptocurrency || 0,
            otherInvestments: data.otherInvestments || 0
        };

        // Add large purchase info
        if (data.largePurchaseType && data.largePurchaseType !== 'none') {
            data.largePurchase = {
                type: data.largePurchaseType,
                amount: data.purchaseAmount || 0,
                timeframe: data.purchaseTimeframe || 1
            };
        }

        return data;
    }

    async performQuickAnalysis() {
        try {
            this.showLoading();
            const data = this.getFormData();
            
            const response = await fetch(`${this.apiBaseUrl}/quick-score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Failed to get quick analysis');
            }

            const result = await response.json();
            this.displayQuickResults(result);
            this.hideLoading();
        } catch (error) {
            this.showError(error.message);
            this.hideLoading();
        }
    }

    async performFullAnalysis() {
        try {
            this.showLoading();
            const data = this.getFormData();
            
            const response = await fetch(`${this.apiBaseUrl}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Failed to get full analysis');
            }

            const result = await response.json();
            this.displayFullResults(result);
            this.hideLoading();
        } catch (error) {
            this.showError(error.message);
            this.hideLoading();
        }
    }

    displayQuickResults(data) {
        this.updateHealthScore(data.healthScore, data.rating);
        this.updateMetrics({
            debtToIncomeRatio: data.debtToIncomeRatio,
            savingsRate: data.savingsRate,
            emergencyFundMonths: data.emergencyFundMonths,
            netWorth: 0 // Not available in quick analysis
        });
        
        this.showResults();
    }

    displayFullResults(data) {
        this.updateHealthScore(data.healthScore, this.getHealthRating(data.healthScore));
        this.updateMetrics({
            debtToIncomeRatio: data.debtToIncomeRatio,
            savingsRate: data.savingsRate,
            emergencyFundMonths: data.emergencyFundMonths,
            netWorth: data.netWorth
        });

        this.updateRecommendations(data.recommendations);
        this.updateRetirementAnalysis(data.retirementProjection);
        this.createProjectionChart(data.tenYearProjection);
        
        // New features
        if (data.allocationAnalysis) {
            this.createAllocationChart(data.allocationAnalysis);
        }
        
        if (data.largePurchaseAnalysis) {
            this.updateLargePurchaseAnalysis(data.largePurchaseAnalysis);
        }
        
        this.showResults();
    }

    updateHealthScore(score, rating) {
        const scoreElement = document.getElementById('health-score');
        const ratingElement = document.getElementById('health-rating');
        const circleElement = document.querySelector('.score-circle');

        scoreElement.textContent = score;
        ratingElement.textContent = rating;

        // Update circle color based on score
        circleElement.className = 'score-circle';
        if (score >= 80) circleElement.classList.add('score-excellent');
        else if (score >= 60) circleElement.classList.add('score-good');
        else if (score >= 40) circleElement.classList.add('score-fair');
        else if (score >= 20) circleElement.classList.add('score-poor');
        else circleElement.classList.add('score-critical');
    }

    updateMetrics(metrics) {
        document.getElementById('debt-ratio').textContent = 
            `${(metrics.debtToIncomeRatio * 100).toFixed(1)}%`;
        document.getElementById('savings-rate').textContent = 
            `${(metrics.savingsRate * 100).toFixed(1)}%`;
        document.getElementById('emergency-months').textContent = 
            `${metrics.emergencyFundMonths.toFixed(1)}`;
        document.getElementById('net-worth').textContent = 
            `$${this.formatCurrency(metrics.netWorth)}`;
    }

    updateRecommendations(recommendations) {
        const container = document.getElementById('recommendations-list');
        container.innerHTML = '';

        for (const [category, recommendation] of Object.entries(recommendations)) {
            const item = document.createElement('div');
            item.className = 'recommendation-item';
            
            // Add priority styling based on category
            if (category.toLowerCase().includes('emergency') || category.toLowerCase().includes('debt')) {
                item.classList.add('priority-high');
            } else if (category.toLowerCase().includes('savings') || category.toLowerCase().includes('retirement')) {
                item.classList.add('priority-medium');
            } else {
                item.classList.add('priority-low');
            }
            
            item.innerHTML = `
                <h4>${category}</h4>
                <p>${recommendation}</p>
            `;
            container.appendChild(item);
        }
    }

    updateRetirementAnalysis(retirement) {
        const container = document.getElementById('retirement-analysis');
        const incomeContainer = document.getElementById('retirement-income-details');
        
        if (retirement.error) {
            container.innerHTML = `<p style="color: #e53e3e;">${retirement.error}</p>`;
            return;
        }

        const onTrackStatus = retirement.onTrack ? 
            '<span style="color: #48bb78;">✓ On Track</span>' : 
            '<span style="color: #e53e3e;">⚠ Behind Target</span>';

        container.innerHTML = `
            <div class="retirement-metric">
                <span>Current Age:</span>
                <span>${retirement.currentAge} years</span>
            </div>
            <div class="retirement-metric">
                <span>Years to Retirement:</span>
                <span>${retirement.yearsToRetirement} years</span>
            </div>
            <div class="retirement-metric">
                <span>Projected Savings:</span>
                <span>$${this.formatCurrency(retirement.projectedSavings)}</span>
            </div>
            <div class="retirement-metric">
                <span>Required Savings:</span>
                <span>$${this.formatCurrency(retirement.requiredSavings)}</span>
            </div>
            <div class="retirement-metric">
                <span>Status:</span>
                ${onTrackStatus}
            </div>
        `;

        // Update retirement income details
        if (retirement.annualRetirementIncome) {
            const income = retirement.annualRetirementIncome;
            incomeContainer.innerHTML = `
                <div class="income-breakdown">
                    <div class="income-source">
                        <h5>Investment Withdrawals</h5>
                        <div class="amount">$${this.formatCurrency(income.investmentIncome)}</div>
                    </div>
                    <div class="income-source">
                        <h5>Social Security (Est.)</h5>
                        <div class="amount">$${this.formatCurrency(income.socialSecurity)}</div>
                    </div>
                    <div class="income-source">
                        <h5>Other Income</h5>
                        <div class="amount">$${this.formatCurrency(income.otherIncome)}</div>
                    </div>
                    <div class="income-source">
                        <h5>Total Annual Income</h5>
                        <div class="amount">$${this.formatCurrency(income.totalAnnual)}</div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 15px; padding: 15px; background: #f0fff4; border-radius: 8px;">
                    <strong>Monthly Retirement Income: $${this.formatCurrency(income.totalAnnual / 12)}</strong>
                </div>
            `;
        }
    }

    updateLargePurchaseAnalysis(purchaseAnalysis) {
        const container = document.getElementById('purchase-analysis');
        const detailsContainer = document.getElementById('purchase-details');
        
        if (!purchaseAnalysis || !purchaseAnalysis.type) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        
        detailsContainer.innerHTML = `
            <div class="purchase-details">
                <div class="purchase-metric">
                    <h4>Purchase Type</h4>
                    <div class="value">${purchaseAnalysis.type}</div>
                </div>
                <div class="purchase-metric">
                    <h4>Target Amount</h4>
                    <div class="value">$${this.formatCurrency(purchaseAnalysis.amount)}</div>
                </div>
                <div class="purchase-metric">
                    <h4>Timeframe</h4>
                    <div class="value">${purchaseAnalysis.timeframe} years</div>
                </div>
                <div class="purchase-metric">
                    <h4>Monthly Savings Needed</h4>
                    <div class="value">$${this.formatCurrency(purchaseAnalysis.monthlySavingsNeeded)}</div>
                </div>
                <div class="purchase-metric">
                    <h4>Feasibility</h4>
                    <div class="value" style="color: ${purchaseAnalysis.feasible ? '#38a169' : '#e53e3e'}">
                        ${purchaseAnalysis.feasible ? 'Achievable' : 'Challenging'}
                    </div>
                </div>
                <div class="purchase-metric">
                    <h4>Impact on Emergency Fund</h4>
                    <div class="value">${purchaseAnalysis.emergencyFundImpact}</div>
                </div>
            </div>
            <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 8px;">
                <p><strong>Recommendation:</strong> ${purchaseAnalysis.recommendation}</p>
            </div>
        `;
    }

    createAllocationChart(allocationData) {
        const ctx = document.getElementById('allocationChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.allocationChart) {
            this.allocationChart.destroy();
        }

        const labels = Object.keys(allocationData).filter(key => allocationData[key] > 0);
        const data = labels.map(label => allocationData[label]);
        const colors = [
            '#667eea', '#48bb78', '#ed8936', '#4299e1', 
            '#9f7aea', '#38b2ac', '#f56565', '#d69e2e'
        ];

        this.allocationChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.map(label => this.formatAllocationLabel(label)),
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        text: 'Current Investment Allocation'
                    }
                }
            }
        });
    }

    formatAllocationLabel(key) {
        const labelMap = {
            'savingsAllocation': 'High Yield Savings',
            'retirement401k': '401(k)/403(b)',
            'traditionalIRA': 'Traditional IRA',
            'rothIRA': 'Roth IRA',
            'taxableInvestments': 'Taxable Investments',
            'realEstate': 'Real Estate',
            'cryptocurrency': 'Cryptocurrency',
            'otherInvestments': 'Other'
        };
        return labelMap[key] || key;
    }

    createProjectionChart(projectionData) {
        const ctx = document.getElementById('projectionChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        const years = projectionData.map(item => `Year ${item.year}`);
        const savings = projectionData.map(item => item.projectedSavings);
        const netWorth = projectionData.map(item => item.projectedNetWorth);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Projected Savings',
                        data: savings,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Projected Net Worth',
                        data: netWorth,
                        borderColor: '#48bb78',
                        backgroundColor: 'rgba(72, 187, 120, 0.1)',
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Financial Growth Projection'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    getHealthRating(score) {
        if (score >= 80) return "Excellent";
        if (score >= 60) return "Good";
        if (score >= 40) return "Fair";
        if (score >= 20) return "Poor";
        return "Critical";
    }

    formatCurrency(amount) {
        if (amount >= 1000000) {
            return (amount / 1000000).toFixed(1) + 'M';
        } else if (amount >= 1000) {
            return (amount / 1000).toFixed(1) + 'K';
        } else {
            return amount.toFixed(0);
        }
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('error-message').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    showResults() {
        document.getElementById('results-section').style.display = 'block';
        document.getElementById('error-message').style.display = 'none';
        
        // Smooth scroll to results
        document.getElementById('results-section').scrollIntoView({
            behavior: 'smooth'
        });
    }

    showError(message) {
        document.getElementById('error-text').textContent = message;
        document.getElementById('error-message').style.display = 'block';
        document.getElementById('results-section').style.display = 'none';
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FinancialPlannerApp();
    
    // Add some sample data for demo purposes
    if (window.location.search.includes('demo=true')) {
        document.getElementById('monthlyIncome').value = '5000';
        document.getElementById('monthlyExpenses').value = '3500';
        document.getElementById('monthlySavings').value = '1000';
        document.getElementById('emergencyFund').value = '15000';
        document.getElementById('otherAssets').value = '25000';
        document.getElementById('birthDate').value = '1985-06-15';
        document.getElementById('targetRetirementAge').value = '65';
        document.getElementById('riskTolerance').value = '3';
        
        // Sample allocation
        document.getElementById('retirement401k').value = '60';
        document.getElementById('rothIRA').value = '20';
        document.getElementById('taxableInvestments').value = '15';
        document.getElementById('savingsAllocation').value = '5';
    }
});
