package com.financialadviser.repository;

import com.financialadviser.model.Budget;
import com.financialadviser.model.User;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BudgetRepository extends CrudRepository<Budget, Long> {
    List<Budget> findByUser(User user);
    List<Budget> findByUserAndStartDateGreaterThanEqualAndEndDateLessThanEqual(
        User user, LocalDate startDate, LocalDate endDate);
} 