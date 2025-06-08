package com.financialadviser.service;

import java.math.BigDecimal;
import java.util.List;

import com.financialadviser.model.Debt;
import com.financialadviser.model.User;

public interface DebtService {
    List<Debt> findByUser(User user);
    Debt save(Debt debt);
    void delete(Debt debt);
    BigDecimal getTotalDebtAmount(User user);
    BigDecimal getTotalMonthlyPayments(User user);
    double calculateDebtToIncomeRatio(User user, BigDecimal monthlyIncome);
} 