from tradepilot.metrics import get_returns, annualize_returns, annualize_vol, annualize_semideviation
import numpy as np
import pandas as pd

def eval_portfolio(p_returns,  p_periods_per_year = 52, risk_free = None, SP500_index = None):
    # Dates to compare
    start, end = p_returns.index[0], p_returns.index[-1]
    # Get annualized mean returns and volatilities for portfolio
    p_r = annualize_returns(p_returns, p_periods_per_year)
    p_vol = annualize_vol(p_returns, p_periods_per_year)
    p_sdev = annualize_semideviation(p_returns, p_periods_per_year)
    bm_rfr_r= np.mean(risk_free["Risk Free Rate"][start:end])
    bm_rfr_sdev = bm_rfr_vol = 0 # No risk
    bm_rfr = "RFR Benchmark"
    b_returns = get_returns(SP500_index)["S&P 500"][start:end]
    b_r = annualize_returns(b_returns, 252) # We have Daily data
    b_vol  = annualize_vol(b_returns, 252) 
    b_sdev = annualize_semideviation(b_returns, 252) 
    bmark = "S&P500 Benchmark"
    comparation = pd.DataFrame(# Compare to benchmarks
        {"Return":[p_r, b_r, bm_rfr_r,
                   p_r - b_r, p_r - bm_rfr_r],
         "Volatility":[p_vol, b_vol, bm_rfr_vol,
                       p_vol - b_vol, p_vol - bm_rfr_vol],
         "Semideviation":[p_sdev, b_sdev, bm_rfr_sdev, 
                          p_sdev - b_sdev, p_sdev-bm_rfr_sdev]},
         index=["Portfolio", bmark,  bm_rfr, "Portfolio - S&P500", "Portfolio - RFR"])
    comparation.index.name = "Annual Avg"
    comparation.columns.name = f"Start date: {start.date()}.  End date: {end.date()}"
    return comparation.T