package com.financialadviser.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.financialadviser.model.Goal;
import com.financialadviser.model.User;
import com.financialadviser.repository.GoalRepository;
import com.financialadviser.service.GoalService;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.chart.PieChart;
import javafx.scene.chart.XYChart;

@Service
public class GoalServiceImpl implements GoalService {
    
    @Autowired
    private GoalRepository goalRepository;
    
    private ObservableList<Goal> observableGoals = FXCollections.observableArrayList();
    
    @Override
    public Goal save(Goal goal) {
        Goal savedGoal = goalRepository.save(goal);
        updateObservableList();
        return savedGoal;
    }
    
    @Override
    public void delete(Goal goal) {
        goalRepository.delete(goal);
        updateObservableList();
    }
    
    @Override
    public List<Goal> findByUser(User user) {
        return goalRepository.findByUser(user);
    }
    
    @Override
    public List<Goal> findAll() {
        return goalRepository.findAll();
    }
    
    @Override
    public double getTotalTargetAmount() {
        return goalRepository.findAll().stream()
                .map(Goal::getTargetAmount)
                .mapToDouble(bd -> bd.doubleValue())
                .sum();
    }
    
    @Override
    public double getTotalCurrentAmount() {
        return goalRepository.findAll().stream()
                .map(Goal::getCurrentAmount)
                .mapToDouble(bd -> bd.doubleValue())
                .sum();
    }
    
    @Override
    public double getAverageProgress() {
        List<Goal> goals = goalRepository.findAll();
        if (goals.isEmpty()) {
            return 0.0;
        }
        return goals.stream()
                .mapToDouble(Goal::getProgress)
                .average()
                .orElse(0.0);
    }
    
    @Override
    public ObservableList<Goal> getAllGoals() {
        if (observableGoals.isEmpty()) {
            updateObservableList();
        }
        return observableGoals;
    }
    
    @Override
    public ObservableList<PieChart.Data> getGoalDistribution() {
        List<Goal> goals = goalRepository.findAll();
        return FXCollections.observableArrayList(
            goals.stream()
                .map(goal -> new PieChart.Data(goal.getName(), goal.getTargetAmount().doubleValue()))
                .collect(Collectors.toList())
        );
    }
    
    @Override
    public XYChart.Series<String, Number> getProgressTrend() {
        XYChart.Series<String, Number> series = new XYChart.Series<>();
        series.setName("Goal Progress");
        
        goalRepository.findAll().forEach(goal -> {
            series.getData().add(new XYChart.Data<>(goal.getName(), goal.getProgress() * 100));
        });
        
        return series;
    }
    
    private void updateObservableList() {
        observableGoals.setAll(goalRepository.findAll());
    }
} 