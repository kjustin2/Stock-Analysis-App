package com.financialadviser.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.financialadviser.model.User;

@Service
public class FinancialAnalysisService {
    
    private static final BigDecimal CONSERVATIVE_RETURN = BigDecimal.valueOf(0.05); // 5%
    private static final BigDecimal MODERATE_RETURN = BigDecimal.valueOf(0.07); // 7%
    private static final BigDecimal AGGRESSIVE_RETURN = BigDecimal.valueOf(0.10); // 10%
    
    /**
     * Calculate comprehensive financial health score (0-100)
     */
    public int calculateFinancialHealthScore(User user) {
        int score = 0;
        
        // Debt-to-income ratio (30 points max)
        double debtToIncomeRatio = calculateDebtToIncomeRatio(user);
        if (debtToIncomeRatio <= 0.20) score += 30;
        else if (debtToIncomeRatio <= 0.36) score += 20;
        else if (debtToIncomeRatio <= 0.50) score += 10;
        
        // Savings rate (25 points max)
        double savingsRate = calculateSavingsRate(user);
        if (savingsRate >= 0.20) score += 25;
        else if (savingsRate >= 0.15) score += 20;
        else if (savingsRate >= 0.10) score += 15;
        else if (savingsRate >= 0.05) score += 10;
        
        // Emergency fund adequacy (25 points max)
        double emergencyFundMonths = calculateEmergencyFundMonths(user);
        if (emergencyFundMonths >= 6) score += 25;
        else if (emergencyFundMonths >= 3) score += 20;
        else if (emergencyFundMonths >= 1) score += 10;
        
        // Investment diversification (20 points max)
        if (user.getOtherAssets() != null && user.getOtherAssets().compareTo(BigDecimal.ZERO) > 0) {
            score += 20;
        } else if (user.getMonthlySavings() != null && user.getMonthlySavings().compareTo(BigDecimal.ZERO) > 0) {
            score += 10;
        }
        
        return Math.min(score, 100);
    }
    
    /**
     * Calculate debt-to-income ratio
     */
    public double calculateDebtToIncomeRatio(User user) {
        if (user.getMonthlyIncome() == null || user.getMonthlyIncome().compareTo(BigDecimal.ZERO) <= 0) {
            return 0.0;
        }
        
        BigDecimal totalMonthlyDebt = BigDecimal.ZERO;
        if (user.getDebts() != null) {
            totalMonthlyDebt = user.getDebts().stream()
                .map(debt -> debt.getMinimumPayment() != null ? debt.getMinimumPayment() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        
        return totalMonthlyDebt.divide(user.getMonthlyIncome(), 4, RoundingMode.HALF_UP).doubleValue();
    }
    
    /**
     * Calculate savings rate
     */
    public double calculateSavingsRate(User user) {
        if (user.getMonthlyIncome() == null || user.getMonthlyIncome().compareTo(BigDecimal.ZERO) <= 0) {
            return 0.0;
        }
        
        BigDecimal monthlySavings = user.getMonthlySavings() != null ? user.getMonthlySavings() : BigDecimal.ZERO;
        return monthlySavings.divide(user.getMonthlyIncome(), 4, RoundingMode.HALF_UP).doubleValue();
    }
    
    /**
     * Calculate emergency fund in months of expenses
     */
    public double calculateEmergencyFundMonths(User user) {
        if (user.getMonthlyExpenses() == null || user.getMonthlyExpenses().compareTo(BigDecimal.ZERO) <= 0) {
            return 0.0;
        }
        
        BigDecimal emergencyFund = user.getEmergencyFund() != null ? user.getEmergencyFund() : BigDecimal.ZERO;
        return emergencyFund.divide(user.getMonthlyExpenses(), 2, RoundingMode.HALF_UP).doubleValue();
    }
    
    /**
     * Calculate monthly cash flow (income - expenses)
     */
    public BigDecimal calculateMonthlyCashFlow(User user) {
        BigDecimal income = user.getMonthlyIncome() != null ? user.getMonthlyIncome() : BigDecimal.ZERO;
        BigDecimal expenses = user.getMonthlyExpenses() != null ? user.getMonthlyExpenses() : BigDecimal.ZERO;
        return income.subtract(expenses);
    }
    
    /**
     * Get investment return rate based on risk tolerance
     */
    public BigDecimal getExpectedReturnRate(User user) {
        if (user.getRiskTolerance() == null) return MODERATE_RETURN;
        
        return switch (user.getRiskTolerance()) {
            case 1, 2 -> CONSERVATIVE_RETURN;
            case 3, 4 -> MODERATE_RETURN;
            case 5 -> AGGRESSIVE_RETURN;
            default -> MODERATE_RETURN;
        };
    }
    
    /**
     * Calculate net worth
     */
    public BigDecimal calculateNetWorth(User user) {
        BigDecimal assets = BigDecimal.ZERO;
        
        // Add emergency fund
        if (user.getEmergencyFund() != null) {
            assets = assets.add(user.getEmergencyFund());
        }
        
        // Add other assets
        if (user.getOtherAssets() != null) {
            assets = assets.add(user.getOtherAssets());
        }
        
        // Subtract debts
        BigDecimal totalDebt = BigDecimal.ZERO;
        if (user.getDebts() != null) {
            totalDebt = user.getDebts().stream()
                .map(debt -> debt.getRemainingAmount() != null ? debt.getRemainingAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        
        return assets.subtract(totalDebt);
    }
    
    /**
     * Get financial health breakdown
     */
    public Map<String, Object> getFinancialHealthBreakdown(User user) {
        Map<String, Object> breakdown = new HashMap<>();
        
        breakdown.put("healthScore", calculateFinancialHealthScore(user));
        breakdown.put("debtToIncomeRatio", calculateDebtToIncomeRatio(user));
        breakdown.put("savingsRate", calculateSavingsRate(user));
        breakdown.put("emergencyFundMonths", calculateEmergencyFundMonths(user));
        breakdown.put("monthlyCashFlow", calculateMonthlyCashFlow(user));
        breakdown.put("netWorth", calculateNetWorth(user));
        
        // Add recommendations
        breakdown.put("recommendations", generateRecommendations(user));
        
        return breakdown;
    }
    
    /**
     * Generate personalized financial recommendations
     */
    public Map<String, String> generateRecommendations(User user) {
        Map<String, String> recommendations = new HashMap<>();
        
        // Emergency fund recommendation
        double emergencyMonths = calculateEmergencyFundMonths(user);
        if (emergencyMonths < 3) {
            recommendations.put("emergency", "Build your emergency fund to at least 3-6 months of expenses");
        } else if (emergencyMonths < 6) {
            recommendations.put("emergency", "Consider increasing your emergency fund to 6 months of expenses");
        } else {
            recommendations.put("emergency", "Great job! Your emergency fund is well-funded");
        }
        
        // Debt recommendation
        double debtRatio = calculateDebtToIncomeRatio(user);
        if (debtRatio > 0.36) {
            recommendations.put("debt", "Focus on reducing debt - your debt-to-income ratio is high");
        } else if (debtRatio > 0.20) {
            recommendations.put("debt", "Consider paying down debt to improve your financial flexibility");
        } else {
            recommendations.put("debt", "Your debt levels are manageable");
        }
        
        // Savings recommendation
        double savingsRate = calculateSavingsRate(user);
        if (savingsRate < 0.10) {
            recommendations.put("savings", "Try to save at least 10% of your income");
        } else if (savingsRate < 0.20) {
            recommendations.put("savings", "Good savings rate! Consider increasing to 20% if possible");
        } else {
            recommendations.put("savings", "Excellent savings rate! You're on track for financial success");
        }
        
        return recommendations;
    }
    
    /**
     * Analyze investment allocation breakdown
     */
    public Map<String, Object> analyzeInvestmentAllocation(Object allocationBreakdown, User user) {
        Map<String, Object> analysis = new HashMap<>();
        
        // For now, return a simple analysis - this would be expanded with actual allocation logic
        analysis.put("savingsAllocation", 20.0);
        analysis.put("retirement401k", 40.0);
        analysis.put("rothIRA", 20.0);
        analysis.put("taxableInvestments", 15.0);
        analysis.put("realEstate", 5.0);
        
        return analysis;
    }
    
    /**
     * Analyze large purchase planning
     */
    public Map<String, Object> analyzeLargePurchase(Object largePurchase, User user) {
        Map<String, Object> analysis = new HashMap<>();
        
        // Mock analysis - would be implemented with actual purchase planning logic
        analysis.put("type", "House");
        analysis.put("amount", 300000);
        analysis.put("timeframe", 5);
        analysis.put("monthlySavingsNeeded", 5000);
        analysis.put("feasible", true);
        analysis.put("emergencyFundImpact", "Minimal");
        analysis.put("recommendation", "Based on your current savings rate, this purchase is achievable within your timeframe. Consider increasing your down payment savings to reduce mortgage costs.");
        
        return analysis;
    }
}
