package com.financialadviser.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.financialadviser.model.Investment;
import com.financialadviser.model.Investment.InvestmentType;
import com.financialadviser.model.User;

public interface InvestmentService {
    List<Investment> getAllInvestments(User user);
    Investment getInvestmentById(Long id);
    Investment createInvestment(Investment investment);
    void updateInvestment(Investment investment);
    void deleteInvestment(Long id);
    BigDecimal getTotalInvestmentValue(User user);
    Map<String, Double> getAssetAllocation(User user);
    Map<String, Double> getMonthlyTrend(User user);
    BigDecimal getTotalInvested(User user);
    BigDecimal getTotalReturns(User user);
    BigDecimal getCurrentValue(User user);
    double getRiskScore(User user);
    double getDiversificationLevel(User user);
    double getVolatility(User user);
    List<Investment> findByUser(User user);
    Investment save(Investment investment);
    void delete(Investment investment);
    List<Investment> findAll();
    
    Investment createInvestment(String symbol, String name, BigDecimal shares, BigDecimal purchasePrice, LocalDate purchaseDate, InvestmentType type);
    void addInvestment(Investment investment);
    
    BigDecimal getTotalReturn(User user);
    double getReturnOnInvestment(User user);
    Map<String, BigDecimal> getInvestmentDistribution(User user);
    Map<LocalDate, BigDecimal> getInvestmentPerformance(User user);
    Map<String, Double> getPortfolioAllocation(User user);
    
    List<Investment> getTopPerformingInvestments(User user, int limit);
    List<Investment> getUnderperformingInvestments(User user, int limit);
    Map<String, Object> getInvestmentSummary(User user);
    Map<String, BigDecimal> getHistoricalReturns(User user);
    
    void validateInvestment(Investment investment);
    boolean isValidSymbol(String symbol);
    BigDecimal getCurrentPrice(String symbol);
    
    // Portfolio management methods
    List<Investment> rebalancePortfolio(User user);
    int calculatePortfolioRiskScore(User user);
    BigDecimal calculateShares(Investment investment);
    
    // Investment returns calculation
    BigDecimal calculateInvestmentReturns(Investment investment);
} 