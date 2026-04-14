import pytest
import numpy as np
import sys
import os
file_abs_path = __file__
test_dir = os.path.abspath(os.path.join(file_abs_path, os.pardir))
par_dir = os.path.abspath(os.path.join(test_dir, os.pardir))
sys.path.append(par_dir)
from tradepilot.data import MarketData
from tradepilot.metrics import momentum
@pytest.fixture
def market_data():
    return MarketData()

def test_momentum(market_data):
    data = market_data.get_historical_data("AAPL", "2025-01-01", "2025-01-10")
    m = momentum(data, t=3)["AAPL"]
    assert isinstance(m, (float, np.floating)), "Momentum should be a numeric value"
    # Momentum is the price difference over t periods — verify it's in a reasonable range
    assert abs(m) < 100, "Momentum value should be reasonable for a stock price difference"