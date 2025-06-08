import pandas as pd
import numpy as np
from typing import Union

def calculate_returns(prices: Union[pd.Series, np.ndarray]) -> pd.Series:
    """Calculate simple returns from price series."""
    if isinstance(prices, np.ndarray):
        prices = pd.Series(prices)
    return (prices / prices.shift(1) - 1).fillna(0)

def calculate_volatility(returns: Union[pd.Series, np.ndarray], annualize: bool = True) -> float:
    """Calculate volatility (standard deviation) of returns."""
    if isinstance(returns, np.ndarray):
        returns = pd.Series(returns)
    vol = returns.std()
    if annualize:
        vol *= np.sqrt(252)  # Annualize using trading days
    return float(vol)

def calculate_beta(stock_returns: Union[pd.Series, np.ndarray], 
                  market_returns: Union[pd.Series, np.ndarray]) -> float:
    """Calculate beta (systematic risk) relative to market."""
    if isinstance(stock_returns, np.ndarray):
        stock_returns = pd.Series(stock_returns)
    if isinstance(market_returns, np.ndarray):
        market_returns = pd.Series(market_returns)
        
    # Ensure series are aligned
    df = pd.DataFrame({'stock': stock_returns, 'market': market_returns})
    df = df.dropna()
    
    # Calculate beta using covariance and market variance
    covariance = df['stock'].cov(df['market'])
    market_variance = df['market'].var()
    
    return float(covariance / market_variance if market_variance != 0 else 1.0)

def calculate_sharpe_ratio(returns: Union[pd.Series, np.ndarray], 
                         risk_free_rate: float = 0.02,
                         annualize: bool = True) -> float:
    """Calculate Sharpe ratio (risk-adjusted return)."""
    if isinstance(returns, np.ndarray):
        returns = pd.Series(returns)
        
    # Calculate excess returns
    excess_returns = returns - (risk_free_rate / 252)  # Daily risk-free rate
    
    # Calculate annualized Sharpe ratio
    sharpe = np.sqrt(252) * excess_returns.mean() / returns.std() if annualize else excess_returns.mean() / returns.std()
    
    return float(sharpe) 