package com.financialadviser.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.financialadviser.model.User;
import com.financialadviser.service.FinancialAnalysisService;
import com.financialadviser.service.PredictionService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class FinancialPlannerController {
    
    @Autowired
    private FinancialAnalysisService financialAnalysisService;
    
    @Autowired
    private PredictionService predictionService;
    
    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "Financial Planner API",
            "timestamp", LocalDate.now().toString()
        ));
    }
    
    /**
     * Analyze financial health based on user input
     */
    @PostMapping("/analyze")
    public ResponseEntity<Map<String, Object>> analyzeFinancialHealth(@RequestBody FinancialInputRequest request) {
        try {
            // Create user object from request
            User user = createUserFromRequest(request);
            
            // Get financial analysis
            Map<String, Object> analysis = financialAnalysisService.getFinancialHealthBreakdown(user);
            
            // Add enhanced analysis features
            if (request.getAllocationBreakdown() != null) {
                analysis.put("allocationAnalysis", financialAnalysisService.analyzeInvestmentAllocation(request.getAllocationBreakdown(), user));
            }
            
            if (request.getLargePurchase() != null) {
                analysis.put("largePurchaseAnalysis", financialAnalysisService.analyzeLargePurchase(request.getLargePurchase(), user));
            }
            
            // Add predictions with enhanced retirement income calculation
            Map<String, Object> retirementProjection = predictionService.projectRetirementSavings(user);
            retirementProjection.put("annualRetirementIncome", predictionService.calculateRetirementIncome(user, request.getAllocationBreakdown()));
            analysis.put("retirementProjection", retirementProjection);
            
            analysis.put("debtProjection", predictionService.projectDebtPayoff(user));
            analysis.put("tenYearProjection", predictionService.generate10YearProjection(user));
            
            return ResponseEntity.ok(analysis);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get quick financial health score
     */
    @PostMapping("/quick-score")
    public ResponseEntity<Map<String, Object>> getQuickScore(@RequestBody FinancialInputRequest request) {
        try {
            User user = createUserFromRequest(request);
            int healthScore = financialAnalysisService.calculateFinancialHealthScore(user);
            
            return ResponseEntity.ok(Map.of(
                "healthScore", healthScore,
                "rating", getHealthRating(healthScore),
                "debtToIncomeRatio", financialAnalysisService.calculateDebtToIncomeRatio(user),
                "savingsRate", financialAnalysisService.calculateSavingsRate(user),
                "emergencyFundMonths", financialAnalysisService.calculateEmergencyFundMonths(user)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    private User createUserFromRequest(FinancialInputRequest request) {
        User user = new User();
        user.setMonthlyIncome(request.getMonthlyIncome());
        user.setMonthlyExpenses(request.getMonthlyExpenses());
        user.setMonthlySavings(request.getMonthlySavings());
        user.setEmergencyFund(request.getEmergencyFund());
        user.setOtherAssets(request.getOtherAssets());
        user.setBirthDate(request.getBirthDate());
        user.setTargetRetirementAge(request.getTargetRetirementAge());
        user.setRiskTolerance(request.getRiskTolerance());
        
        return user;
    }
    
    private String getHealthRating(int score) {
        if (score >= 80) return "Excellent";
        if (score >= 60) return "Good";
        if (score >= 40) return "Fair";
        if (score >= 20) return "Poor";
        return "Critical";
    }
    
    /**
     * Request DTO for financial input
     */
    public static class FinancialInputRequest {
        private BigDecimal monthlyIncome;
        private BigDecimal monthlyExpenses;
        private BigDecimal monthlySavings;
        private BigDecimal emergencyFund;
        private BigDecimal otherAssets;
        private LocalDate birthDate;
        private Integer targetRetirementAge;
        private Integer riskTolerance;
        
        // New fields for enhanced features
        private AllocationBreakdown allocationBreakdown;
        private String emergencyFundType;
        private LargePurchase largePurchase;
        
        // Getters and setters
        public BigDecimal getMonthlyIncome() { return monthlyIncome; }
        public void setMonthlyIncome(BigDecimal monthlyIncome) { this.monthlyIncome = monthlyIncome; }
        
        public BigDecimal getMonthlyExpenses() { return monthlyExpenses; }
        public void setMonthlyExpenses(BigDecimal monthlyExpenses) { this.monthlyExpenses = monthlyExpenses; }
        
        public BigDecimal getMonthlySavings() { return monthlySavings; }
        public void setMonthlySavings(BigDecimal monthlySavings) { this.monthlySavings = monthlySavings; }
        
        public BigDecimal getEmergencyFund() { return emergencyFund; }
        public void setEmergencyFund(BigDecimal emergencyFund) { this.emergencyFund = emergencyFund; }
        
        public BigDecimal getOtherAssets() { return otherAssets; }
        public void setOtherAssets(BigDecimal otherAssets) { this.otherAssets = otherAssets; }
        
        public LocalDate getBirthDate() { return birthDate; }
        public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }
        
        public Integer getTargetRetirementAge() { return targetRetirementAge; }
        public void setTargetRetirementAge(Integer targetRetirementAge) { this.targetRetirementAge = targetRetirementAge; }
        
        public Integer getRiskTolerance() { return riskTolerance; }
        public void setRiskTolerance(Integer riskTolerance) { this.riskTolerance = riskTolerance; }
        
        public AllocationBreakdown getAllocationBreakdown() { return allocationBreakdown; }
        public void setAllocationBreakdown(AllocationBreakdown allocationBreakdown) { this.allocationBreakdown = allocationBreakdown; }
        
        public String getEmergencyFundType() { return emergencyFundType; }
        public void setEmergencyFundType(String emergencyFundType) { this.emergencyFundType = emergencyFundType; }
        
        public LargePurchase getLargePurchase() { return largePurchase; }
        public void setLargePurchase(LargePurchase largePurchase) { this.largePurchase = largePurchase; }
    }
    
    /**
     * DTO for investment allocation breakdown
     */
    public static class AllocationBreakdown {
        private BigDecimal savingsAllocation;
        private BigDecimal retirement401k;
        private BigDecimal traditionalIRA;
        private BigDecimal rothIRA;
        private BigDecimal taxableInvestments;
        private BigDecimal realEstate;
        private BigDecimal cryptocurrency;
        private BigDecimal otherInvestments;
        
        // Getters and setters
        public BigDecimal getSavingsAllocation() { return savingsAllocation; }
        public void setSavingsAllocation(BigDecimal savingsAllocation) { this.savingsAllocation = savingsAllocation; }
        
        public BigDecimal getRetirement401k() { return retirement401k; }
        public void setRetirement401k(BigDecimal retirement401k) { this.retirement401k = retirement401k; }
        
        public BigDecimal getTraditionalIRA() { return traditionalIRA; }
        public void setTraditionalIRA(BigDecimal traditionalIRA) { this.traditionalIRA = traditionalIRA; }
        
        public BigDecimal getRothIRA() { return rothIRA; }
        public void setRothIRA(BigDecimal rothIRA) { this.rothIRA = rothIRA; }
        
        public BigDecimal getTaxableInvestments() { return taxableInvestments; }
        public void setTaxableInvestments(BigDecimal taxableInvestments) { this.taxableInvestments = taxableInvestments; }
        
        public BigDecimal getRealEstate() { return realEstate; }
        public void setRealEstate(BigDecimal realEstate) { this.realEstate = realEstate; }
        
        public BigDecimal getCryptocurrency() { return cryptocurrency; }
        public void setCryptocurrency(BigDecimal cryptocurrency) { this.cryptocurrency = cryptocurrency; }
        
        public BigDecimal getOtherInvestments() { return otherInvestments; }
        public void setOtherInvestments(BigDecimal otherInvestments) { this.otherInvestments = otherInvestments; }
    }
    
    /**
     * DTO for large purchase planning
     */
    public static class LargePurchase {
        private String type;
        private BigDecimal amount;
        private Integer timeframe;
        
        // Getters and setters
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        
        public Integer getTimeframe() { return timeframe; }
        public void setTimeframe(Integer timeframe) { this.timeframe = timeframe; }
    }
}
