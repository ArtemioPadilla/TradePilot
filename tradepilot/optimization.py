# tradepilot/optimization.py
import numpy as np
from scipy.optimize import minimize as scipy_minimize
from .metrics import portfolio_return, portfolio_vol


def msr(riskfree_rate, er, cov, min_w=0.01, max_w=0.95):
    """
    Computes the optimal asset weights that maximize the Sharpe ratio.

    Parameters:
        riskfree_rate (float): The risk-free rate.
        er (pd.Series or np.array): Expected returns.
        cov (pd.DataFrame or np.array): Covariance matrix.
        min_w (float): Minimum weight for any single asset.
        max_w (float): Maximum weight for any single asset.

    Returns:
        np.array: Optimal weights vector (normalized to sum to 1).
    """
    n = len(er)
    init_guess = np.repeat(1/n, n)
    bounds = ((min_w, max_w),) * n
    weights_sum_to_1 = {'type': 'eq', 'fun': lambda weights: np.sum(weights) - 1}

    def neg_sharpe(weights, riskfree_rate, er, cov):
        r = portfolio_return(weights, er)
        vol = portfolio_vol(weights, cov)
        return -(r - riskfree_rate) / vol

    result = scipy_minimize(neg_sharpe, init_guess,
                            args=(riskfree_rate, er, cov), method='SLSQP',
                            options={'disp': False},
                            constraints=(weights_sum_to_1,),
                            bounds=bounds)
    return result.x / result.x.sum()


def gmv(cov, min_w=0.01, max_w=0.95):
    """
    Computes the weights for the Global Minimum Variance portfolio.
    Uses the MSR trick: when all expected returns are equal,
    maximizing Sharpe reduces to minimizing volatility.

    Parameters:
        cov (pd.DataFrame or np.array): Covariance matrix.
        min_w (float): Minimum weight for any single asset.
        max_w (float): Maximum weight for any single asset.

    Returns:
        np.array: Weights vector for the minimum variance portfolio.
    """
    n = cov.shape[0]
    return msr(0, np.repeat(1, n), cov, min_w=min_w, max_w=max_w)


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


def minimize_vol(target_return, er, cov):
    """
    Returns the optimal weights that achieve the target return
    with minimum volatility, given expected returns and a covariance matrix.

    Parameters:
        target_return (float): The target portfolio return.
        er (pd.Series or np.array): Expected returns.
        cov (pd.DataFrame or np.array): Covariance matrix.

    Returns:
        np.array: Optimal weights that minimize volatility for the target return.
    """
    n = er.shape[0]
    init_guess = np.repeat(1/n, n)
    bounds = ((0.00, 1),) * n
    weights_sum_to_1 = {
        'type': 'eq',
        'fun': lambda weights: np.sum(weights) - 1
    }
    return_is_target = {
        'type': 'eq',
        'args': (er,),
        'fun': lambda weights, er: target_return - portfolio_return(weights, er)
    }
    result = scipy_minimize(portfolio_vol, init_guess,
                            args=(cov,), method='SLSQP',
                            options={'disp': False},
                            constraints=(weights_sum_to_1, return_is_target),
                            bounds=bounds)
    return result.x


def optimal_weights(n_points, er, cov):
    """
    Returns a list of weights that represent a grid of n_points
    on the efficient frontier.

    Parameters:
        n_points (int): Number of points on the efficient frontier.
        er (pd.Series or np.array): Expected returns.
        cov (pd.DataFrame or np.array): Covariance matrix.

    Returns:
        list[np.array]: List of weight arrays along the efficient frontier.
    """
    target_rs = np.linspace(er.min(), er.max(), n_points)
    weights = [minimize_vol(target_return, er, cov) for target_return in target_rs]
    return weights
