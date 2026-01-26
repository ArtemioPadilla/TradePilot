"""
Tests for TradePilot Broker API

Tests the broker API integration with mocked HTTP responses.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add parent directory to path
test_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(test_dir)
sys.path.insert(0, parent_dir)

from tradepilot.broker import (
    BrokerAPI,
    BrokerError,
    BrokerAuthenticationError,
    BrokerRateLimitError,
    BrokerServerError,
    BrokerValidationError,
)


class TestBrokerAPIInitialization:
    """Test BrokerAPI initialization."""

    def test_init_with_valid_credentials(self, mock_env_credentials):
        """Test initialization with valid environment credentials."""
        # Reload config module to pick up mocked env vars
        import importlib
        from tradepilot import config
        importlib.reload(config)

        broker = BrokerAPI('alpaca')

        assert broker.broker == 'alpaca'
        assert broker.timeout == 30
        assert broker.use_paper is True

    def test_init_with_unknown_broker(self):
        """Test initialization with unknown broker raises error."""
        with pytest.raises(ValueError, match="No configuration found"):
            BrokerAPI('unknown_broker')

    def test_init_with_custom_timeout(self, mock_env_credentials):
        """Test initialization with custom timeout."""
        import importlib
        from tradepilot import config
        importlib.reload(config)

        broker = BrokerAPI('alpaca', timeout=60)

        assert broker.timeout == 60

    def test_init_with_live_environment(self, mock_env_credentials):
        """Test initialization for live trading."""
        import importlib
        from tradepilot import config
        importlib.reload(config)

        broker = BrokerAPI('alpaca', use_paper=False)

        assert broker.use_paper is False


class TestBrokerAPIExecuteTrade:
    """Test BrokerAPI execute_trade method."""

    @pytest.fixture
    def broker(self, mock_env_credentials):
        """Create a broker instance for testing."""
        import importlib
        from tradepilot import config
        importlib.reload(config)
        return BrokerAPI('alpaca')

    def test_execute_trade_success(self, broker, mock_requests):
        """Test successful order execution."""
        result = broker.execute_trade('AAPL', 10)

        assert 'id' in result
        assert result['symbol'] == 'AAPL'
        mock_requests['post'].assert_called_once()

    def test_execute_trade_with_sell(self, broker, mock_requests):
        """Test sell order execution."""
        result = broker.execute_trade('AAPL', 10, side='sell')

        call_args = mock_requests['post'].call_args
        body = call_args.kwargs['json']
        assert body['side'] == 'sell'

    def test_execute_trade_with_limit_order(self, broker, mock_requests):
        """Test limit order execution."""
        result = broker.execute_trade('AAPL', 10, order_type='limit')

        call_args = mock_requests['post'].call_args
        body = call_args.kwargs['json']
        assert body['type'] == 'limit'

    def test_execute_trade_invalid_symbol(self, broker):
        """Test trade with invalid symbol raises error."""
        with pytest.raises(ValueError, match="Symbol must be a non-empty string"):
            broker.execute_trade('', 10)

        with pytest.raises(ValueError, match="Symbol must be a non-empty string"):
            broker.execute_trade(None, 10)

    def test_execute_trade_invalid_amount(self, broker):
        """Test trade with invalid amount raises error."""
        with pytest.raises(ValueError, match="Amount must be positive"):
            broker.execute_trade('AAPL', 0)

        with pytest.raises(ValueError, match="Amount must be positive"):
            broker.execute_trade('AAPL', -10)

    def test_execute_trade_invalid_side(self, broker):
        """Test trade with invalid side raises error."""
        with pytest.raises(ValueError, match="Side must be"):
            broker.execute_trade('AAPL', 10, side='hold')


class TestBrokerAPIErrorHandling:
    """Test BrokerAPI error handling."""

    @pytest.fixture
    def broker(self, mock_env_credentials):
        """Create a broker instance for testing."""
        import importlib
        from tradepilot import config
        importlib.reload(config)
        return BrokerAPI('alpaca')

    def test_authentication_error(self, broker):
        """Test 401 authentication error."""
        with patch('requests.post') as mock_post:
            mock_response = Mock()
            mock_response.status_code = 401
            mock_response.json.return_value = {'message': 'Invalid credentials'}
            mock_post.return_value = mock_response

            with pytest.raises(BrokerAuthenticationError):
                broker.execute_trade('AAPL', 10)

    def test_forbidden_error(self, broker):
        """Test 403 forbidden error."""
        with patch('requests.post') as mock_post:
            mock_response = Mock()
            mock_response.status_code = 403
            mock_response.json.return_value = {'message': 'Access forbidden'}
            mock_post.return_value = mock_response

            with pytest.raises(BrokerAuthenticationError):
                broker.execute_trade('AAPL', 10)

    def test_rate_limit_error(self, broker):
        """Test 429 rate limit error."""
        with patch('requests.post') as mock_post:
            mock_response = Mock()
            mock_response.status_code = 429
            mock_response.json.return_value = {'message': 'Rate limit exceeded'}
            mock_post.return_value = mock_response

            with pytest.raises(BrokerRateLimitError):
                broker.execute_trade('AAPL', 10)

    def test_validation_error_400(self, broker):
        """Test 400 validation error."""
        with patch('requests.post') as mock_post:
            mock_response = Mock()
            mock_response.status_code = 400
            mock_response.json.return_value = {'message': 'Invalid request'}
            mock_post.return_value = mock_response

            with pytest.raises(BrokerValidationError):
                broker.execute_trade('AAPL', 10)

    def test_validation_error_422(self, broker):
        """Test 422 validation error."""
        with patch('requests.post') as mock_post:
            mock_response = Mock()
            mock_response.status_code = 422
            mock_response.json.return_value = {'message': 'Unprocessable entity'}
            mock_post.return_value = mock_response

            with pytest.raises(BrokerValidationError):
                broker.execute_trade('AAPL', 10)

    def test_server_error_500(self, broker):
        """Test 500 server error."""
        with patch('requests.post') as mock_post:
            mock_response = Mock()
            mock_response.status_code = 500
            mock_response.json.return_value = {'message': 'Internal server error'}
            mock_post.return_value = mock_response

            with pytest.raises(BrokerServerError):
                broker.execute_trade('AAPL', 10)

    def test_server_error_503(self, broker):
        """Test 503 service unavailable error."""
        with patch('requests.post') as mock_post:
            mock_response = Mock()
            mock_response.status_code = 503
            mock_response.json.return_value = {'message': 'Service unavailable'}
            mock_post.return_value = mock_response

            with pytest.raises(BrokerServerError):
                broker.execute_trade('AAPL', 10)

    def test_timeout_error(self, broker):
        """Test request timeout."""
        from requests.exceptions import Timeout

        with patch('requests.post') as mock_post:
            mock_post.side_effect = Timeout("Connection timed out")

            with pytest.raises(BrokerError, match="timed out"):
                broker.execute_trade('AAPL', 10)

    def test_connection_error(self, broker):
        """Test connection error."""
        from requests.exceptions import ConnectionError

        with patch('requests.post') as mock_post:
            mock_post.side_effect = ConnectionError("Connection failed")

            with pytest.raises(BrokerError, match="Connection error"):
                broker.execute_trade('AAPL', 10)


class TestBrokerAPIGetAccount:
    """Test BrokerAPI get_account method."""

    @pytest.fixture
    def broker(self, mock_env_credentials):
        """Create a broker instance for testing."""
        import importlib
        from tradepilot import config
        importlib.reload(config)
        return BrokerAPI('alpaca')

    def test_get_account_success(self, broker, mock_requests):
        """Test successful account retrieval."""
        result = broker.get_account()

        assert 'id' in result
        assert 'account_number' in result
        mock_requests['get'].assert_called_once()

    def test_get_account_auth_error(self, broker):
        """Test account retrieval with authentication error."""
        with patch('requests.get') as mock_get:
            mock_response = Mock()
            mock_response.status_code = 401
            mock_response.json.return_value = {'message': 'Invalid credentials'}
            mock_get.return_value = mock_response

            with pytest.raises(BrokerAuthenticationError):
                broker.get_account()


class TestBrokerAPIGetPositions:
    """Test BrokerAPI get_positions method."""

    @pytest.fixture
    def broker(self, mock_env_credentials):
        """Create a broker instance for testing."""
        import importlib
        from tradepilot import config
        importlib.reload(config)
        return BrokerAPI('alpaca')

    def test_get_positions_success(self, broker):
        """Test successful positions retrieval."""
        with patch('requests.get') as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.ok = True
            mock_response.json.return_value = [
                {
                    'symbol': 'AAPL',
                    'qty': '10',
                    'avg_entry_price': '150.00',
                    'market_value': '1550.00',
                    'unrealized_pl': '50.00',
                },
                {
                    'symbol': 'GOOGL',
                    'qty': '5',
                    'avg_entry_price': '100.00',
                    'market_value': '525.00',
                    'unrealized_pl': '25.00',
                },
            ]
            mock_get.return_value = mock_response

            result = broker.get_positions()

            assert len(result) == 2
            assert result[0]['symbol'] == 'AAPL'

    def test_get_positions_empty(self, broker):
        """Test positions retrieval with no positions."""
        with patch('requests.get') as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.ok = True
            mock_response.json.return_value = []
            mock_get.return_value = mock_response

            result = broker.get_positions()

            assert result == []


class TestBrokerAPIUrls:
    """Test BrokerAPI URL generation."""

    def test_paper_trading_url(self, mock_env_credentials):
        """Test paper trading URL."""
        import importlib
        from tradepilot import config
        importlib.reload(config)

        broker = BrokerAPI('alpaca', use_paper=True)

        assert 'paper-api' in broker._get_base_url()

    def test_live_trading_url(self, mock_env_credentials):
        """Test live trading URL."""
        import importlib
        from tradepilot import config
        importlib.reload(config)

        broker = BrokerAPI('alpaca', use_paper=False)

        assert 'paper-api' not in broker._get_base_url()
        assert 'api.alpaca.markets' in broker._get_base_url()
