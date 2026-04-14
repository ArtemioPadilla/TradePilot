from tradepilot.ranking import momentum, random_ranking
from tradepilot.data import MarketData
import pandas as pd
import pytest

@pytest.fixture
def market_data():
    return MarketData()
def test_momentum(market_data):
    data = market_data.get_historical_data("AAPL", "2025-01-01", "2025-01-10")
    m = momentum(data, t=3)["AAPL"]
    print(f"Momentum: {m}")
    assert abs(m - (-2.3)) < 0.05  # Allow small variation from live API data

def test_random_ranking(market_data):
    data = market_data.get_historical_data("AAPL", "2025-01-01", "2025-01-10")
    random_r = random_ranking(data, seed=42)["AAPL"]
    assert 0.37454 == round(random_r, 5)