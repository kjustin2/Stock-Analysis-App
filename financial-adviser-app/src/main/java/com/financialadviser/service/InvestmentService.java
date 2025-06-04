package com.financialadviser.service;

import java.math.BigDecimal;
import java.util.List;

import com.financialadviser.model.Investment;
import com.financialadviser.model.User;

import javafx.collections.ObservableList;
import javafx.scene.chart.PieChart;
import javafx.scene.chart.XYChart;

public interface InvestmentService {
    Investment save(Investment investment);
    void delete(Investment investment);
    List<Investment> findByUser(User user);
    List<Investment> findAll();
    
    BigDecimal getTotalInvestmentValue();
    BigDecimal getTotalReturns();
    BigDecimal getCurrentValue();
    double getReturnRate();
    
    ObservableList<PieChart.Data> getInvestmentDistribution();
    ObservableList<PieChart.Data> getAssetAllocation();
    XYChart.Series<String, Number> getValueTrend();
    XYChart.Series<String, Number> getMonthlyTrend();
    
    String getPortfolioAllocationSummary();
    List<Investment> getInvestmentsOrderedByReturn();
    List<Investment> getInvestmentsOrderedByValue();
    
    // Additional methods required by InvestmentController
    Investment addInvestment(Investment investment);
    ObservableList<Investment> getAllInvestments();
    BigDecimal getTotalInvested();
    double getRiskScore();
    double getDiversificationLevel();
    double getVolatility();
} 