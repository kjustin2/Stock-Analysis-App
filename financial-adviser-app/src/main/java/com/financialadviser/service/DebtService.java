package com.financialadviser.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.financialadviser.model.Debt;
import com.financialadviser.model.User;

import javafx.collections.ObservableList;
import javafx.scene.chart.PieChart;
import javafx.scene.chart.XYChart;

public interface DebtService {
    Debt save(Debt debt);
    void delete(Debt debt);
    List<Debt> findByUser(User user);
    List<Debt> findAll();
    
    BigDecimal getTotalDebtAmount();
    BigDecimal getTotalMonthlyPayment();
    BigDecimal getTotalInterestPaid();
    
    ObservableList<PieChart.Data> getDebtDistribution();
    XYChart.Series<String, Number> getPaymentTrend();
    XYChart.Series<String, Number> getDebtReductionTrend();
    
    List<Debt> getDebtsOrderedByInterestRate();
    List<Debt> getDebtsOrderedByBalance();
    
    int getEstimatedMonthsToDebtFree();
    LocalDate getProjectedDebtFreeDate();

    // Payoff strategy methods
    void calculatePayoffStrategy(String strategy, BigDecimal extraPayment);
    List<Debt> getPayoffPlan();
    BigDecimal getExtraPaymentAmount();
    String getCurrentStrategy();
} 