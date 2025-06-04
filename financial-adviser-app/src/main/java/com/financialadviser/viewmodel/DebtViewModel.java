package com.financialadviser.viewmodel;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.financialadviser.model.Debt;

import javafx.beans.property.DoubleProperty;
import javafx.beans.property.IntegerProperty;
import javafx.beans.property.ObjectProperty;
import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class DebtViewModel {
    private final Debt debt;
    private final StringProperty description = new SimpleStringProperty();
    private final ObjectProperty<BigDecimal> totalAmount = new SimpleObjectProperty<>(BigDecimal.ZERO);
    private final ObjectProperty<BigDecimal> interestRate = new SimpleObjectProperty<>(BigDecimal.ZERO);
    private final ObjectProperty<BigDecimal> minimumPayment = new SimpleObjectProperty<>(BigDecimal.ZERO);
    private final StringProperty debtType = new SimpleStringProperty();
    private final ObjectProperty<BigDecimal> remainingAmount = new SimpleObjectProperty<>(BigDecimal.ZERO);
    private final ObjectProperty<LocalDate> startDate = new SimpleObjectProperty<>();
    private final DoubleProperty payoffProgress = new SimpleDoubleProperty();
    private final ObjectProperty<BigDecimal> monthlyInterest = new SimpleObjectProperty<>(BigDecimal.ZERO);
    private final IntegerProperty monthsToPayoff = new SimpleIntegerProperty();

    public DebtViewModel(Debt debt) {
        this.debt = debt;
        updateFromModel();
    }

    public void updateFromModel() {
        description.set(debt.getDescription());
        totalAmount.set(debt.getTotalAmount());
        interestRate.set(debt.getInterestRate());
        minimumPayment.set(debt.getMinimumPayment());
        debtType.set(debt.getDebtType());
        remainingAmount.set(debt.getRemainingAmount());
        startDate.set(debt.getStartDate());
        payoffProgress.set(debt.getPayoffProgress());
        monthlyInterest.set(debt.getMonthlyInterest());
        monthsToPayoff.set(debt.getMonthsToPayoff());
    }

    public void updateModel() {
        debt.setDescription(description.get());
        debt.setTotalAmount(totalAmount.get());
        debt.setInterestRate(interestRate.get());
        debt.setMinimumPayment(minimumPayment.get());
        debt.setDebtType(debtType.get());
        debt.setRemainingAmount(remainingAmount.get());
        debt.setStartDate(startDate.get());
    }

    public Debt getModel() {
        return debt;
    }

    // Property getters
    public StringProperty descriptionProperty() {
        return description;
    }

    public ObjectProperty<BigDecimal> totalAmountProperty() {
        return totalAmount;
    }

    public ObjectProperty<BigDecimal> interestRateProperty() {
        return interestRate;
    }

    public ObjectProperty<BigDecimal> minimumPaymentProperty() {
        return minimumPayment;
    }

    public StringProperty debtTypeProperty() {
        return debtType;
    }

    public ObjectProperty<BigDecimal> remainingAmountProperty() {
        return remainingAmount;
    }

    public ObjectProperty<LocalDate> startDateProperty() {
        return startDate;
    }

    public DoubleProperty payoffProgressProperty() {
        return payoffProgress;
    }

    public ObjectProperty<BigDecimal> monthlyInterestProperty() {
        return monthlyInterest;
    }

    public IntegerProperty monthsToPayoffProperty() {
        return monthsToPayoff;
    }

    // Value getters and setters
    public String getDescription() {
        return description.get();
    }

    public void setDescription(String value) {
        description.set(value);
    }

    public BigDecimal getTotalAmount() {
        return totalAmount.get();
    }

    public void setTotalAmount(BigDecimal value) {
        totalAmount.set(value);
    }

    public BigDecimal getInterestRate() {
        return interestRate.get();
    }

    public void setInterestRate(BigDecimal value) {
        interestRate.set(value);
    }

    public BigDecimal getMinimumPayment() {
        return minimumPayment.get();
    }

    public void setMinimumPayment(BigDecimal value) {
        minimumPayment.set(value);
    }

    public String getDebtType() {
        return debtType.get();
    }

    public void setDebtType(String value) {
        debtType.set(value);
    }

    public BigDecimal getRemainingAmount() {
        return remainingAmount.get();
    }

    public void setRemainingAmount(BigDecimal value) {
        remainingAmount.set(value);
    }

    public LocalDate getStartDate() {
        return startDate.get();
    }

    public void setStartDate(LocalDate value) {
        startDate.set(value);
    }

    public double getPayoffProgress() {
        return payoffProgress.get();
    }

    public BigDecimal getMonthlyInterest() {
        return monthlyInterest.get();
    }

    public int getMonthsToPayoff() {
        return monthsToPayoff.get();
    }
} 