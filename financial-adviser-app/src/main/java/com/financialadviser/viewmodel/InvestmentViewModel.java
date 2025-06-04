package com.financialadviser.viewmodel;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.financialadviser.model.Investment;

import javafx.beans.property.DoubleProperty;
import javafx.beans.property.ObjectProperty;
import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class InvestmentViewModel {
    private final Investment investment;
    private final StringProperty symbol = new SimpleStringProperty();
    private final DoubleProperty shares = new SimpleDoubleProperty();
    private final DoubleProperty purchasePrice = new SimpleDoubleProperty();
    private final ObjectProperty<LocalDate> purchaseDate = new SimpleObjectProperty<>();
    private final DoubleProperty currentPrice = new SimpleDoubleProperty();
    private final StringProperty assetType = new SimpleStringProperty();
    private final DoubleProperty gainLoss = new SimpleDoubleProperty();
    private final DoubleProperty currentValue = new SimpleDoubleProperty();
    private final DoubleProperty returnRate = new SimpleDoubleProperty();

    public InvestmentViewModel(Investment investment) {
        this.investment = investment;
        updateFromModel();
    }

    public void updateFromModel() {
        symbol.set(investment.getSymbol());
        shares.set(investment.getShares().doubleValue());
        purchasePrice.set(investment.getPurchasePrice().doubleValue());
        purchaseDate.set(investment.getPurchaseDate());
        currentPrice.set(investment.getCurrentPrice().doubleValue());
        assetType.set(investment.getAssetType());
        gainLoss.set(investment.getGainLoss().doubleValue());
        currentValue.set(investment.getValue().doubleValue());
        returnRate.set(investment.getReturnRate());
    }

    public void updateModel() {
        investment.setSymbol(symbol.get());
        investment.setShares(BigDecimal.valueOf(shares.get()));
        investment.setPurchasePrice(BigDecimal.valueOf(purchasePrice.get()));
        investment.setPurchaseDate(purchaseDate.get());
        investment.setCurrentPrice(BigDecimal.valueOf(currentPrice.get()));
        investment.setAssetType(assetType.get());
    }

    public Investment getModel() {
        return investment;
    }

    // Property getters
    public StringProperty symbolProperty() {
        return symbol;
    }

    public DoubleProperty sharesProperty() {
        return shares;
    }

    public DoubleProperty purchasePriceProperty() {
        return purchasePrice;
    }

    public ObjectProperty<LocalDate> purchaseDateProperty() {
        return purchaseDate;
    }

    public DoubleProperty currentPriceProperty() {
        return currentPrice;
    }

    public StringProperty assetTypeProperty() {
        return assetType;
    }

    public DoubleProperty gainLossProperty() {
        return gainLoss;
    }

    public DoubleProperty currentValueProperty() {
        return currentValue;
    }

    public DoubleProperty returnRateProperty() {
        return returnRate;
    }

    // Value getters and setters
    public String getSymbol() {
        return symbol.get();
    }

    public void setSymbol(String value) {
        symbol.set(value);
    }

    public double getShares() {
        return shares.get();
    }

    public void setShares(double value) {
        shares.set(value);
    }

    public double getPurchasePrice() {
        return purchasePrice.get();
    }

    public void setPurchasePrice(double value) {
        purchasePrice.set(value);
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate.get();
    }

    public void setPurchaseDate(LocalDate value) {
        purchaseDate.set(value);
    }

    public double getCurrentPrice() {
        return currentPrice.get();
    }

    public void setCurrentPrice(double value) {
        currentPrice.set(value);
    }

    public String getAssetType() {
        return assetType.get();
    }

    public void setAssetType(String value) {
        assetType.set(value);
    }

    public double getGainLoss() {
        return gainLoss.get();
    }

    public double getCurrentValue() {
        return currentValue.get();
    }

    public double getReturnRate() {
        return returnRate.get();
    }
} 