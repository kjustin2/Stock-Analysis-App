package com.financialadviser.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "goals")
public class Goal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(name = "target_amount", nullable = false)
    private BigDecimal targetAmount;

    @Column(name = "current_amount", nullable = false)
    private BigDecimal currentAmount;

    @Column(nullable = false)
    private LocalDate deadline;

    @Column(nullable = false)
    private String priority;

    @Column(nullable = false)
    private double progress;

    public Goal() {
        // Default constructor required by JPA
    }

    public Goal(String name, double targetAmount, double currentAmount, LocalDate deadline, String priority) {
        setName(name);
        setTargetAmount(BigDecimal.valueOf(targetAmount));
        setCurrentAmount(BigDecimal.valueOf(currentAmount));
        setDeadline(deadline);
        setPriority(priority);
        updateProgress();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getTargetAmount() {
        return targetAmount;
    }

    public void setTargetAmount(BigDecimal targetAmount) {
        this.targetAmount = targetAmount;
        updateProgress();
    }

    public BigDecimal getCurrentAmount() {
        return currentAmount;
    }

    public void setCurrentAmount(BigDecimal currentAmount) {
        this.currentAmount = currentAmount;
        updateProgress();
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDate deadline) {
        this.deadline = deadline;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public double getProgress() {
        return progress;
    }

    private void updateProgress() {
        if (targetAmount != null && currentAmount != null && targetAmount.compareTo(BigDecimal.ZERO) > 0) {
            this.progress = currentAmount.divide(targetAmount, 4, java.math.RoundingMode.HALF_UP).doubleValue();
        } else {
            this.progress = 0.0;
        }
    }

    @Transient
    public LocalDate getDeadlineDate() {
        return deadline;
    }

    @Transient
    public long getDaysRemaining() {
        return LocalDate.now().until(getDeadlineDate()).getDays();
    }

    @Transient
    public double getMonthlyContributionNeeded() {
        double remaining = getTargetAmount().doubleValue() - getCurrentAmount().doubleValue();
        long months = ChronoUnit.MONTHS.between(LocalDate.now(), getDeadlineDate());
        return months > 0 ? remaining / months : remaining;
    }
} 