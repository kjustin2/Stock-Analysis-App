package com.financialadviser.controller;

import java.math.BigDecimal;
import java.net.URL;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ResourceBundle;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;

import com.financialadviser.model.User;
import com.financialadviser.service.BudgetService;
import com.financialadviser.service.DebtService;
import com.financialadviser.service.GoalService;
import com.financialadviser.service.InvestmentService;

import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.chart.LineChart;
import javafx.scene.chart.PieChart;
import javafx.scene.control.Label;
import javafx.scene.control.ProgressBar;

@Controller
public class DashboardController implements Initializable {
    private static final Logger logger = LogManager.getLogger(DashboardController.class);

    @FXML private Label totalBudgetLabel;
    @FXML private Label totalSpentLabel;
    @FXML private Label remainingBudgetLabel;
    @FXML private ProgressBar budgetProgressBar;

    @FXML private Label totalInvestedLabel;
    @FXML private Label investmentReturnsLabel;
    @FXML private Label currentValueLabel;
    @FXML private Label returnRateLabel;

    @FXML private Label totalDebtLabel;
    @FXML private Label monthlyPaymentLabel;
    @FXML private Label debtFreeLabel;
    @FXML private ProgressBar debtProgressBar;

    @FXML private Label totalGoalsLabel;
    @FXML private Label goalsProgressLabel;
    @FXML private Label nextGoalLabel;
    @FXML private ProgressBar goalsProgressBar;

    @FXML private PieChart expenseDistributionChart;
    @FXML private PieChart assetAllocationChart;
    @FXML private LineChart<String, Number> netWorthChart;

    @FXML private Label monthlyDebtPaymentLabel;
    @FXML private Label debtFreeDateLabel;
    @FXML private Label debtPayoffProgressLabel;
    @FXML private Label totalInvestmentsLabel;
    @FXML private Label portfolioAllocationLabel;
    @FXML private Label monthlyBudgetLabel;
    @FXML private Label budgetProgressLabel;
    @FXML private PieChart debtDistributionChart;
    @FXML private PieChart investmentDistributionChart;
    @FXML private PieChart goalDistributionChart;
    @FXML private PieChart budgetDistributionChart;

    @Autowired
    private BudgetService budgetService;
    
    @Autowired
    private InvestmentService investmentService;
    
    @Autowired
    private DebtService debtService;
    
    @Autowired
    private GoalService goalService;
    
    private User currentUser;
    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MMMM dd, yyyy");

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        logger.info("Initializing dashboard controller");
        // We'll update the dashboard once the user is set
    }

    public void setCurrentUser(User user) {
        this.currentUser = user;
        updateDashboard();
    }

    private void updateDashboard() {
        try {
            updateBudgetSummary();
            updateInvestmentSummary();
            updateDebtSummary();
            updateGoalsSummary();
            updateCharts();
            updateDebtSection();
            updateInvestmentSection();
            updateGoalSection();
            updateBudgetSection();
        } catch (Exception e) {
            logger.error("Error updating dashboard", e);
        }
    }

    private void updateBudgetSummary() {
        try {
            double totalBudget = budgetService.getTotalBudget();
            double totalSpent = budgetService.getTotalSpent();
            double remaining = totalBudget - totalSpent;
            double progress = totalBudget > 0 ? totalSpent / totalBudget : 0;

            totalBudgetLabel.setText(String.format("$%.2f", totalBudget));
            totalSpentLabel.setText(String.format("$%.2f", totalSpent));
            remainingBudgetLabel.setText(String.format("$%.2f", remaining));
            budgetProgressBar.setProgress(progress);
        } catch (Exception e) {
            logger.error("Error updating budget summary", e);
        }
    }

    private void updateInvestmentSummary() {
        try {
            BigDecimal totalInvested = investmentService.getTotalInvestmentValue();
            BigDecimal returns = investmentService.getTotalReturns();
            BigDecimal currentValue = investmentService.getCurrentValue();
            double returnRate = investmentService.getReturnRate();

            totalInvestedLabel.setText(String.format("$%.2f", totalInvested.doubleValue()));
            investmentReturnsLabel.setText(String.format("$%.2f", returns.doubleValue()));
            currentValueLabel.setText(String.format("$%.2f", currentValue.doubleValue()));
            returnRateLabel.setText(String.format("%.2f%%", returnRate));
        } catch (Exception e) {
            logger.error("Error updating investment summary", e);
        }
    }

    private void updateDebtSummary() {
        try {
            BigDecimal totalDebt = debtService.getTotalDebtAmount();
            BigDecimal monthlyPayment = debtService.getTotalMonthlyPayment();
            LocalDate debtFreeDate = debtService.getProjectedDebtFreeDate();
            double progress = 1.0 - (totalDebt.doubleValue() / debtService.getTotalDebtAmount().doubleValue());

            totalDebtLabel.setText(String.format("$%.2f", totalDebt.doubleValue()));
            monthlyPaymentLabel.setText(String.format("$%.2f", monthlyPayment.doubleValue()));
            debtFreeLabel.setText(debtFreeDate.format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")));
            debtProgressBar.setProgress(progress);
        } catch (Exception e) {
            logger.error("Error updating debt summary", e);
        }
    }

    private void updateGoalsSummary() {
        try {
            double totalTarget = goalService.getTotalTargetAmount();
            double totalCurrent = goalService.getTotalCurrentAmount();
            double progress = goalService.getAverageProgress();

            totalGoalsLabel.setText(String.format("$%.2f", totalTarget));
            goalsProgressLabel.setText(String.format("%.1f%%", progress * 100));
            goalsProgressBar.setProgress(progress);
        } catch (Exception e) {
            logger.error("Error updating goals summary", e);
        }
    }

    private void updateCharts() {
        try {
            expenseDistributionChart.setData(budgetService.getExpenseDistribution());
            assetAllocationChart.setData(investmentService.getAssetAllocation());
            netWorthChart.getData().setAll(calculateNetWorthTrend());
        } catch (Exception e) {
            logger.error("Error updating charts", e);
        }
    }

    private javafx.scene.chart.XYChart.Series<String, Number> calculateNetWorthTrend() {
        javafx.scene.chart.XYChart.Series<String, Number> series = new javafx.scene.chart.XYChart.Series<>();
        series.setName("Net Worth");

        try {
            BigDecimal assets = investmentService.getCurrentValue();
            BigDecimal liabilities = debtService.getTotalDebtAmount();
            BigDecimal netWorth = assets.subtract(liabilities);

            // For now, just show current net worth
            series.getData().add(new javafx.scene.chart.XYChart.Data<>("Current", netWorth.doubleValue()));
        } catch (Exception e) {
            logger.error("Error calculating net worth trend", e);
        }

        return series;
    }

    private void updateDebtSection() {
        try {
            // Update debt summary labels
            BigDecimal totalDebt = debtService.getTotalDebtAmount();
            totalDebtLabel.setText(String.format("Total Debt: $%.2f", totalDebt.doubleValue()));
            
            BigDecimal monthlyPayment = debtService.getTotalMonthlyPayment();
            monthlyDebtPaymentLabel.setText(String.format("Monthly Payment: $%.2f", monthlyPayment.doubleValue()));
            
            LocalDate debtFreeDate = debtService.getProjectedDebtFreeDate();
            debtFreeDateLabel.setText("Debt Free Date: " + debtFreeDate.format(dateFormatter));
            
            int monthsToDebtFree = debtService.getEstimatedMonthsToDebtFree();
            debtPayoffProgressLabel.setText(String.format("Months to Debt Free: %d", monthsToDebtFree));

            // Update debt distribution chart
            debtDistributionChart.setData(debtService.getDebtDistribution());
        } catch (Exception e) {
            logger.error("Error updating debt section", e);
        }
    }

    private void updateInvestmentSection() {
        try {
            // Update investment summary labels
            totalInvestmentsLabel.setText(String.format("Total Investments: $%.2f", 
                investmentService.getTotalInvestmentValue().doubleValue()));
            
            portfolioAllocationLabel.setText("Portfolio Allocation");
            
            // Update investment distribution chart
            investmentDistributionChart.setData(investmentService.getAssetAllocation());
        } catch (Exception e) {
            logger.error("Error updating investment section", e);
        }
    }

    private void updateGoalSection() {
        try {
            // Update goal distribution chart
            goalDistributionChart.setData(goalService.getGoalDistribution());
        } catch (Exception e) {
            logger.error("Error updating goal section", e);
        }
    }

    private void updateBudgetSection() {
        try {
            // Update budget summary labels
            monthlyBudgetLabel.setText(String.format("Monthly Budget: $%.2f", budgetService.getTotalBudget()));
            
            double progress = budgetService.getTotalSpent() / budgetService.getTotalBudget();
            budgetProgressLabel.setText(String.format("Budget Progress: %.1f%%", progress * 100));
            
            // Update budget distribution chart
            budgetDistributionChart.setData(budgetService.getExpenseDistribution());
        } catch (Exception e) {
            logger.error("Error updating budget section", e);
        }
    }
} 