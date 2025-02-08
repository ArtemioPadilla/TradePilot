# pytest for data apis

import pytest
# add par to sys path
import sys
file_abs_path = __file__
import os
test_dir = os.path.abspath(os.path.join(file_abs_path, os.pardir))
par_dir = os.path.abspath(os.path.join(test_dir, os.pardir))
sys.path.append(par_dir)
print("filepath:",par_dir)
from tradepilot.data import MarketData

@pytest.fixture
def market_data():
    return MarketData()

def test_get_historical_data(market_data):
    data = market_data.get_historical_data("AAPL", "2021-01-01", "2021-01-31")
    assert len(data) == 19
    
def test_get_live_price(market_data):
    price = market_data.get_live_price("AAPL")
    assert price["AAPL"]["price"] > 0