# tradepilot/optimization.py
import numpy as np
from scipy.optimize import minimize

def msr(riskfree_rate, er, cov):
    """
    Computes the optimal asset weights that maximize the Sharpe ratio.

    Parameters:
        riskfree_rate (float): The risk-free rate.
        er (pd.Series or np.array): Expected returns.
        cov (pd.DataFrame or np.array): Covariance matrix.

    Returns:
        np.array: Optimal weights vector.
    """
    def neg_sharpe(weights):
        port_return = np.dot(weights, er)
        port_vol = np.sqrt(np.dot(weights.T, np.dot(cov, weights)))
        return -(port_return - riskfree_rate) / port_vol

    n = len(er)
    init_guess = np.repeat(1/n, n)
    bounds = [(0.01, 0.95)] * n
    constraints = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1})
    result = minimize(neg_sharpe, init_guess, method='SLSQP', bounds=bounds, constraints=constraints)
    return result.x

def gmv(cov):
    """
    Computes the weights for the Global Minimum Variance portfolio.

    Parameters:
        cov (pd.DataFrame or np.array): Covariance matrix.

    Returns:
        np.array: Weights vector for the minimum variance portfolio.
    """
    n = cov.shape[0]
    return msr(0, np.ones(n), cov)

def eq_weighted(er):
    """
    Returns an equally weighted portfolio.

    Parameters:
        er (pd.Series or np.array): Expected returns (used only to determine length).

    Returns:
        np.array: Equal weights vector.
    """
    n = len(er)
    return np.repeat(1/n, n)
