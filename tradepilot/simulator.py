# tradepilot/simulator.py
import numpy as np
import pandas as pd
from tqdm import tqdm
from .optimization import msr, gmv, eq_weighted
from .metrics import get_returns, annualize_returns
from .portfolios import eval_portfolio

# class TPS:
#     """
#     Trade Pilot Simulator for backtesting.

#     Parameters:
#         universe (pd.DataFrame): Historical price data with a datetime index and Stock / Cryptos / Tokens.
#         strategy (function): A strategy function that receives a DataFrame of prices
#                              and returns an ordered list/index of asset symbols.
#         initial_capital (float): Starting capital for the simulation.
#         risk_free (float): Risk-free rate (e.g., 0.02 for 2% annual).
#         rebalance_freq (str): Rebalancing frequency (default is weekly, e.g. "W-MON").

#         - to be implemented in the next steps
#         transaction_cost (float): Cost of buying or selling an asset (default 0.1%).
#         slippage (float): Price slippage for buying or selling an asset (default 0.1%).
#         strategy_params (dict): Additional parameters for the strategy function.
#     """
#     def __init__(self, universe, strategy, initial_capital, risk_free, rebalance_freq="W-MON"
#                  #transaction_cost=0.001, slippage=0.001, strategy_params=None 
#                  ):
#         self.universe = universe
#         print(f"Universe of size {universe.shape} loaded.")
#         self.strategy = strategy
#         self.capital = initial_capital
#         self.risk_free = risk_free
#         self.rebalance_freq = rebalance_freq
#         # This series will store portfolio values on each rebalancing date
#         self.portfolio = pd.Series(dtype="float64")
#         self.portfolio_weights = pd.DataFrame()
#         self.portfolio_values = pd.DataFrame()

#     def buy_stocks_teorical(self, date, top_stocks, prices):
#         """
#         Simulates buying the top stocks at the current date prices for the theoretical portfolio.
        
#         Parameters:
#             date (str): Current date in YYYY-MM-DD format.
#             top_stocks (list): List of top stock symbols.
#             prices (pd.DataFrame): Historical prices for the top stocks.
#         """
#         # Get the current portfolio value
#         self.valuations = self.universe.loc[date, top_stocks]
#         # get allocated capital with current valuations and stocks we 
#         # Get the number of stocks for that capital
#         self.number_of_stocks_owned = self.allocated_capital / prices.loc[date]
        

#     # def buy_stocks(self, weights, stocks):

#     #     # Allocate capital
#     #     self.allocated_capital = self.valuations[self.day] * weights
#     #     # Get the number of stocks for that capital
#     #     price = self.universe.loc[self.day, stocks]
#     #     self.number_of_stocks_owned = self.allocated_capital /  price
#     #     if self.track_allocations: # track allocations
#     #         self.stocks_values.append(self.allocated_capital)
#     #         self.stocks_symbols.append(self.number_of_stocks_owned.keys())
            
#     def run(self, start, end):
#         """
#         Executes the simulation between the start and end dates.
        
#         Parameters:
#             start (str): Start date in YYYY-MM-DD format.
#             end (str): End date in YYYY-MM-DD format.
        
#         Returns:
#             pd.Series: Portfolio values at each rebalancing date.
#         """
#         dates = pd.date_range(start, end, freq=self.rebalance_freq)

#         # remove non trading days
#         dates = dates[dates.isin(self.universe.index)]
#         print(f"Running simulation from {start} to {end} with {len(dates)} objective rebalancing dates.")
        
#         for date in dates:
#             # Check if data exists for the current date
#             if date in self.universe.index:
#                 # The strategy function receives data up to the current date and returns
#                 # an ordered list of symbols (e.g., sorted by momentum)
#                 know_universe_at_date = self.universe[self.universe.index <= date]
#                 top_stocks = self.strategy(know_universe_at_date)
#                 print(f"Top stocks for {date}:\n{top_stocks}")
#                 # Get price data for the selected assets
#                 prices = know_universe_at_date[top_stocks]
#                 print(f"Prices for {date}:\n{prices}")
#                 # Calculate returns and covariance from available historical data
#                 returns = get_returns(prices)
#                 print(f"Returns for {date}:\n{returns}")
#                 cov = returns.cov()
#                 # Calculate optimal weights using the MSR (Maximum Sharpe Ratio) method
#                 weights = msr(self.risk_free, returns.apply(lambda r: r.mean()), cov)

#                 # Save the portfolio weights and values for later analysis
#                 self.portfolio_weights[date] = weights

#                 # Save the portfolio values for later analysis
#                 self.portfolio_values[date] = prices.iloc[-1] * weights
#                 # For simulation purposes, we assume the portfolio is revalued by
#                 # multiplying the capital by the sum of the weights (a simplification)
#                 portfolio_value = (prices.iloc[-1] * weights).sum()
#                 print(f"Portfolio value for {date}: {portfolio_value}")
#                 self.portfolio[date] = portfolio_value
#         return self.portfolio


class TPS:
    """Trade Pilot Simulator.

    Attributes:
    -----------
    dates : pd.DatetimeIndex
        Candidate trade days.
    universe : pd.DataFrame
        DataFrame of all possible actions and historic prices.
    valuations : pd.Series
        Series to track portfolio valuations.
    allocated_capital : float
        Capital allocated to stocks.
    risk_free : pd.Series
        Series of risk-free rates.
    opt_tech : str
        Optimization technique to use.
    t : int
        Timeframe for ranking function.
    window : int
        Window size for ranking function.
    freq : str
        Frequency of trading days.
    N : int
        Number of top stocks to select.
    criteria : function
        Function to rank stocks.
    highest_better : bool
        Whether higher ranking is better.
    track_allocations : bool
        Whether to track stock allocations.
    expected_returns_func : function
        Function to calculate expected returns.
    show_closed_dates : bool
        Whether to show dates when markets are closed.
    max_weight : float
        Maximum weight for a single stock in the portfolio.
    min_weight : float
        Minimum weight for a single stock in the portfolio.
    day : pd.Timestamp
        Current trading day.
    stocks_values : list
        List to track stock values if track_allocations is True.
    stocks_symbols : list
        List to track stock symbols if track_allocations is True.
    start_study_day : pd.Timestamp
        Start day for ranking function.
    t_cur : pd.Timestamp
        Current timeframe for ranking function.
    number_of_stocks_owned : pd.Series
        Series to track number of stocks owned.
    Methods:
    --------
    get_top_N_stocks():
        Get the top N stocks and their prices in the defined timeframe based on the criteria.
    get_expected_returns(returns):
        Get the expected returns using the specified function.
    get_period_risk_free_rate():
        Get the mean annualized risk-free rate for the analysis period.
    optimize(prices):
        Implement different optimization techniques to get portfolio weights.
    is_trading_day(d):
        Check if the given day is a trading day and track portfolio performance.
    get_allocations():
        Get the allocations of stocks over the trading period.
    buy_stocks(weights, stocks):
        Allocate capital to stocks based on the given weights.
    track_portfolio():
        Track the portfolio performance.
    run():
        Main Portfolio Strategy Simulator Algorithm.
    """
    def __init__(self, universe, initial_capital, risk_free, criteria, start, end, 
                 t, window, opt_tech="MSR", freq = "W-MON", N = 10, 
                 highest_better = True, track_allocations=False, expected_returns_fuct = annualize_returns,
                 show_closed_dates = False, max_weight = 0.95, min_weight = 0.01):
        self.dates =  pd.date_range(start = start, end=end, freq=freq) # Candidate trade days
        dates = self.dates
        for d in dates: # Start on trading day
            if d in universe.index:
                print(f"The first trading day is {d.date()}")
                break
            else:
                self.dates = self.dates[1:] # Eliminate previos dates until tradeable date starts

        self.universe = universe # DataFrame of all possible actions and historic prices
        self.valuations = pd.Series(index =pd.DatetimeIndex([], freq = freq,name="date"), name="valuation")
        self.allocated_capital = 0
        self.risk_free = risk_free
        self.opt_tech = opt_tech
        self.t = t
        self.window = window
        self.freq = freq
        self.N = N
        self.criteria = criteria
        self.highest_better = highest_better
        self.track_allocations = track_allocations
        self.expected_returns_func = expected_returns_fuct
        self.show_closed_dates = show_closed_dates
        self.max_weight = max_weight
        self.min_weight = min_weight
        assert min_weight < 1/N and max_weight < 1, "Non viable weights"
        self.day = None
        
        if track_allocations:
            self.stocks_values = []
            self.stocks_symbols = []
        # Initialize portfolio valuations with starting capital
        self.valuations[self.dates[0]] = initial_capital
        
    def get_top_N_stocks(self):
        """
        Function to get the top N stocks and their prices in the timeframe defined based on the criteria
        """
        stock_prices_window = self.universe.loc[self.start_study_day:self.day]
        stock_prices_window.dropna(inplace=True, axis=1)
        # Evaluate with ranking function
        stock_prices_to_rank = self.universe.loc[:self.day].iloc[-self.t-1:].dropna(axis=1)
        rankeable_and_studiable = set(stock_prices_window.columns).intersection(set(stock_prices_to_rank.columns))
        stock_prices_to_rank = stock_prices_to_rank.loc[:, list(rankeable_and_studiable)] # Only studiable stocks
        stock_metrics = self.criteria(stock_prices_to_rank, self.t)# stock_prices_to_rank.apply(lambda prices: , axis = 0)
        # Get top N stocks from computed metrics
        sorted_stocks = stock_metrics.sort_values(ascending = not self.highest_better)
        print(f"Top stocks for {self.day}:\n{sorted_stocks}")
        top_N_stocks = sorted_stocks[:self.N]
        return stock_prices_window.loc[:, top_N_stocks.index]
        
    def get_expected_returns(self, returns):
        return self.expected_returns_func(returns)
    
    def get_period_risk_free_rate(self):
        # Get the mean annualized risk free rate for the analysis period
        return self.risk_free[self.start_study_day:self.day].values.mean()
    
    def optimize(self, prices):
        """
        Function to implement different optimization techniques
        """
        returns = get_returns(prices)
        cov = returns.cov()
        exp_rets = annualize_returns(returns)
        rfr = self.get_period_risk_free_rate()
        
        if self.opt_tech == "MSR":
            port_weights = msr(rfr, exp_rets, cov, self.min_weight, self.max_weight)
        elif self.opt_tech == "GMV":
            port_weights = gmv(cov, self.min_weight, self.max_weight)
        elif self.opt_tech == "EW":
            port_weights = eq_weighted(exp_rets)
        else: raise NotImplementedError("Optimization technique not implemented. Try 'MSR', 'GMV' or 'EW'.")
        return port_weights
    
    def is_trading_day(self, d):
        """Is trading day routine. 
        This route checks if the d day is an avaliable training day 
        and tracks portfolio performance"""
        tradeable = d in self.universe.index # Is there records in the universe data of trades on that day?
        if tradeable:
            # Obtain the portfolio capital
            if self.day is not None:
                self.day = d
                self.track_portfolio()
            elif tradeable:
                self.day = d
            # Define start study day for ranking function
            self.start_study_day =  pd.to_datetime(np.datetime64(d) - np.timedelta64(self.window, self.freq[:-4]))
            self.t_cur  =  pd.to_datetime(np.datetime64(d) - np.timedelta64(self.t, self.freq[:-4]))
        return tradeable
    
    def get_allocations(self):
        res = {"stock":[], "value":[], "date":[]}
        res = pd.DataFrame(res)
        res.index = pd.to_datetime(res.index)
        trading_days = [d for d in self.dates if d in self.universe.index][:-1] # last day not tradable
        for i, d in enumerate(trading_days):
            for j, stock in enumerate(self.stocks_symbols[i]):
                tmp = pd.DataFrame([[stock, self.stocks_values[i][j]]], 
                                   columns=["stock","value"])
                tmp["date"] = [d]
                res = pd.concat([res, tmp], axis=0)
        res.set_index("date", inplace=True)
        res["date"]= res.index.map(lambda x: x.strftime("%Y/%m/%d"))
        return res
    
    def buy_stocks(self, weights, stocks):
        # Allocate capital
        self.allocated_capital = self.valuations[self.day] * weights
        # Get the number of stocks for that capital
        price = self.universe.loc[self.day, stocks]
        self.number_of_stocks_owned = self.allocated_capital /  price
        if self.track_allocations: # track allocations
            self.stocks_values.append(self.allocated_capital)
            self.stocks_symbols.append(list(self.number_of_stocks_owned.keys()))
            
    def track_portfolio(self):
        num_of_stocks = self.number_of_stocks_owned.values
        stocks = self.number_of_stocks_owned.keys()
        prices = self.universe.loc[self.day, stocks]
        capital_distribution = num_of_stocks*prices
        val = pd.Series(num_of_stocks @ prices, index = [self.day])
        self.valuations = pd.concat([self.valuations, val])
        self.valuation = val.values
            
        
    def run(self):
        """
        Main Portfolio Strategy Simulator Algorithm
        """
        # For every choosen weekday
        for day in tqdm(self.dates, total = len(self.dates), desc="Simulating timelapse"):
            if self.is_trading_day(day): # Also tracks the portfolio
                #  Get the top N stocks for the day according to criteria and timeframe
                top_N_stocks = self.get_top_N_stocks()
                # Optimize portfolio weights according to chosen technique
                prices_for_top_N_stocks = self.universe.loc[self.start_study_day:day, top_N_stocks.columns]
                weights = self.optimize(prices_for_top_N_stocks)
                # Allocate all available capital (Buy stocks)
                self.buy_stocks(weights, top_N_stocks.columns)
            elif self.show_closed_dates: print(f"Markets were closed on {day}\n")
                
        p_eval = eval_portfolio(get_returns(self.valuations),  p_periods_per_year = 52, risk_free = self.risk_free, SP500_index = None)
        if self.track_allocations:
            allocations = self.get_allocations()
        else:
            allocations = None
        return self.valuations, p_eval, allocations
