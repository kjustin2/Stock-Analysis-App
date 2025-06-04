package com.financialadviser.service;

import java.util.List;

import com.financialadviser.model.Goal;
import com.financialadviser.model.User;

import javafx.collections.ObservableList;
import javafx.scene.chart.PieChart;
import javafx.scene.chart.XYChart;

public interface GoalService {
    Goal save(Goal goal);
    void delete(Goal goal);
    List<Goal> findByUser(User user);
    List<Goal> findAll();
    
    double getTotalTargetAmount();
    double getTotalCurrentAmount();
    double getAverageProgress();
    
    ObservableList<Goal> getAllGoals();
    ObservableList<PieChart.Data> getGoalDistribution();
    XYChart.Series<String, Number> getProgressTrend();
} 