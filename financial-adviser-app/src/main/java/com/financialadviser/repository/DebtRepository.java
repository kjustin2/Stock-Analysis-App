package com.financialadviser.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.financialadviser.model.Debt;
import com.financialadviser.model.User;

@Repository
public interface DebtRepository extends JpaRepository<Debt, Long> {
    List<Debt> findByUser(User user);
} 