package com.financialadviser.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.financialadviser.model.Debt;
import com.financialadviser.model.User;
import com.financialadviser.repository.DebtRepository;
import com.financialadviser.service.DebtService;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.chart.PieChart;
import javafx.scene.chart.XYChart;

@Service
@Transactional
public class DebtServiceImpl implements DebtService {
    private static final Logger logger = LoggerFactory.getLogger(DebtServiceImpl.class);

    private final DebtRepository debtRepository;

    private BigDecimal extraPaymentAmount = BigDecimal.ZERO;
    private String currentStrategy = "avalanche";
    private List<Debt> payoffPlan = new ArrayList<>();

    @Autowired
    public DebtServiceImpl(DebtRepository debtRepository) {
        this.debtRepository = debtRepository;
    }

    @Override
    public Debt save(Debt debt) {
        return debtRepository.save(debt);
    }

    @Override
    public void delete(Debt debt) {
        debtRepository.delete(debt);
    }

    @Override
    public List<Debt> findByUser(User user) {
        return debtRepository.findByUser(user);
    }

    @Override
    public List<Debt> findAll() {
        List<Debt> debts = new ArrayList<>();
        debtRepository.findAll().forEach(debts::add);
        return debts;
    }

    @Override
    public BigDecimal getTotalDebtAmount() {
        return findAll().stream()
            .map(Debt::getRemainingAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public BigDecimal getTotalMonthlyPayment() {
        return findAll().stream()
            .map(Debt::getMinimumPayment)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public BigDecimal getTotalInterestPaid() {
        return findAll().stream()
            .map(debt -> {
                BigDecimal monthlyInterest = debt.getMonthlyInterest();
                int months = debt.getMonthsToPayoff();
                return monthlyInterest.multiply(BigDecimal.valueOf(months));
            })
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public ObservableList<PieChart.Data> getDebtDistribution() {
        List<PieChart.Data> data = findAll().stream()
            .map(debt -> new PieChart.Data(
                debt.getDescription(),
                debt.getRemainingAmount().doubleValue()
            ))
            .collect(Collectors.toList());
        return FXCollections.observableArrayList(data);
    }

    @Override
    public XYChart.Series<String, Number> getPaymentTrend() {
        XYChart.Series<String, Number> series = new XYChart.Series<>();
        series.setName("Monthly Payments");

        // Get the next 12 months of payments
        for (int i = 0; i < 12; i++) {
            LocalDate date = LocalDate.now().plusMonths(i);
            BigDecimal payment = getTotalMonthlyPayment();
            series.getData().add(new XYChart.Data<>(
                date.getMonth().toString(),
                payment.doubleValue()
            ));
        }

        return series;
    }

    @Override
    public XYChart.Series<String, Number> getDebtReductionTrend() {
        XYChart.Series<String, Number> series = new XYChart.Series<>();
        series.setName("Debt Reduction");

        BigDecimal currentDebt = getTotalDebtAmount();
        BigDecimal monthlyPayment = getTotalMonthlyPayment();
        BigDecimal monthlyInterest = findAll().stream()
            .map(Debt::getMonthlyInterest)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Project next 12 months
        for (int i = 0; i < 12; i++) {
            LocalDate date = LocalDate.now().plusMonths(i);
            series.getData().add(new XYChart.Data<>(
                date.getMonth().toString(),
                currentDebt.doubleValue()
            ));
            
            // Reduce debt by payment minus interest
            BigDecimal reduction = monthlyPayment.subtract(monthlyInterest);
            currentDebt = currentDebt.subtract(reduction);
            if (currentDebt.compareTo(BigDecimal.ZERO) < 0) {
                currentDebt = BigDecimal.ZERO;
            }
        }

        return series;
    }

    @Override
    public List<Debt> getDebtsOrderedByInterestRate() {
        return findAll().stream()
            .sorted(Comparator.comparing(Debt::getInterestRate).reversed())
            .collect(Collectors.toList());
    }

    @Override
    public List<Debt> getDebtsOrderedByBalance() {
        return findAll().stream()
            .sorted(Comparator.comparing(Debt::getRemainingAmount))
            .collect(Collectors.toList());
    }

    @Override
    public int getEstimatedMonthsToDebtFree() {
        if (getTotalDebtAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }

        BigDecimal totalDebt = getTotalDebtAmount();
        BigDecimal monthlyPayment = getTotalMonthlyPayment();
        BigDecimal monthlyInterest = findAll().stream()
            .map(Debt::getMonthlyInterest)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (monthlyPayment.compareTo(monthlyInterest) <= 0) {
            return Integer.MAX_VALUE; // Will never be paid off
        }

        BigDecimal netMonthlyPayment = monthlyPayment.subtract(monthlyInterest);
        return totalDebt.divide(netMonthlyPayment, 0, java.math.RoundingMode.CEILING).intValue();
    }

    @Override
    public LocalDate getProjectedDebtFreeDate() {
        int months = getEstimatedMonthsToDebtFree();
        if (months == Integer.MAX_VALUE) {
            return LocalDate.MAX;
        }
        return LocalDate.now().plusMonths(months);
    }

    @Override
    public void calculatePayoffStrategy(String strategy, BigDecimal extraPayment) {
        this.extraPaymentAmount = extraPayment;
        this.currentStrategy = strategy;
        
        List<Debt> orderedDebts = "avalanche".equals(strategy) 
            ? getDebtsOrderedByInterestRate() 
            : getDebtsOrderedByBalance();
        
        payoffPlan = new ArrayList<>(orderedDebts);
        logger.info("Calculated {} payoff strategy with extra payment: ${}", 
            strategy, extraPayment);
    }

    @Override
    public List<Debt> getPayoffPlan() {
        return new ArrayList<>(payoffPlan);
    }

    @Override
    public BigDecimal getExtraPaymentAmount() {
        return extraPaymentAmount;
    }

    @Override
    public String getCurrentStrategy() {
        return currentStrategy;
    }
} 