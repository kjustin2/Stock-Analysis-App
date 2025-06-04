package com.financialadviser.viewmodel;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.financialadviser.model.Goal;

import javafx.beans.property.DoubleProperty;
import javafx.beans.property.LongProperty;
import javafx.beans.property.ObjectProperty;
import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleLongProperty;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class GoalViewModel {
    private final Goal goal;
    private final StringProperty name = new SimpleStringProperty();
    private final DoubleProperty targetAmount = new SimpleDoubleProperty();
    private final DoubleProperty currentAmount = new SimpleDoubleProperty();
    private final ObjectProperty<LocalDate> deadline = new SimpleObjectProperty<>();
    private final StringProperty priority = new SimpleStringProperty();
    private final DoubleProperty progress = new SimpleDoubleProperty();
    private final DoubleProperty monthlyContribution = new SimpleDoubleProperty();
    private final LongProperty daysRemaining = new SimpleLongProperty();

    public GoalViewModel(Goal goal) {
        this.goal = goal;
        updateFromModel();
    }

    public void updateFromModel() {
        name.set(goal.getName());
        targetAmount.set(goal.getTargetAmount().doubleValue());
        currentAmount.set(goal.getCurrentAmount().doubleValue());
        deadline.set(goal.getDeadline());
        priority.set(goal.getPriority());
        progress.set(goal.getProgress());
        monthlyContribution.set(goal.getMonthlyContributionNeeded());
        daysRemaining.set(goal.getDaysRemaining());
    }

    public void updateModel() {
        goal.setName(name.get());
        goal.setTargetAmount(BigDecimal.valueOf(targetAmount.get()));
        goal.setCurrentAmount(BigDecimal.valueOf(currentAmount.get()));
        goal.setDeadline(deadline.get());
        goal.setPriority(priority.get());
    }

    public Goal getModel() {
        return goal;
    }

    // Property getters
    public StringProperty nameProperty() {
        return name;
    }

    public DoubleProperty targetAmountProperty() {
        return targetAmount;
    }

    public DoubleProperty currentAmountProperty() {
        return currentAmount;
    }

    public ObjectProperty<LocalDate> deadlineProperty() {
        return deadline;
    }

    public StringProperty priorityProperty() {
        return priority;
    }

    public DoubleProperty progressProperty() {
        return progress;
    }

    public DoubleProperty monthlyContributionProperty() {
        return monthlyContribution;
    }

    public LongProperty daysRemainingProperty() {
        return daysRemaining;
    }

    // Value getters and setters
    public String getName() {
        return name.get();
    }

    public void setName(String value) {
        name.set(value);
    }

    public double getTargetAmount() {
        return targetAmount.get();
    }

    public void setTargetAmount(double value) {
        targetAmount.set(value);
    }

    public double getCurrentAmount() {
        return currentAmount.get();
    }

    public void setCurrentAmount(double value) {
        currentAmount.set(value);
    }

    public LocalDate getDeadline() {
        return deadline.get();
    }

    public void setDeadline(LocalDate value) {
        deadline.set(value);
    }

    public String getPriority() {
        return priority.get();
    }

    public void setPriority(String value) {
        priority.set(value);
    }

    public double getProgress() {
        return progress.get();
    }

    public double getMonthlyContribution() {
        return monthlyContribution.get();
    }

    public long getDaysRemaining() {
        return daysRemaining.get();
    }
} 