#!/usr/bin/env python
# coding: utf-8

# In[1]:


# Necessary imports

#! pip install --upgrade pandas==1.3.5
#! pip install --upgrade -q xlrd

import pickle
import numpy as np
import scipy.stats
from scipy.stats import norm
from scipy.optimize import minimize
import pandas as pd
from datetime import date
import plotly.express as px
import plotly.graph_objects as go
from tqdm.notebook import tqdm

# # Portfolio Management Strategy Simulator
# ## Using ranking functions for asset selection
# 
# <br/><br/><br/>
# 
# <center> <b>Artemio Santiago Padilla Robles</b></center>
# <br/>
# <center> <i>Last update:</i> May 23th, 2022</center>
# 
# 
# <br/><br/>
# 
# <center><b>Push down ↓</b></center>

# Push the right or left arrows to progress from topic to topic.
# 
# Push the up or down arrows to navigate within a topic.
# 
# <br/><br/><br/><br/>
# 
# <center><b>Push down to see the HTML disclaimer ↓</b></center>
# 

# ## Disclaimer for HTML slides:
# 
# This presentation has many interactive figures, some browsers may have trouble displaying all of them. If you find an image that appears not to have loaded correctly press F5 on your keyboard or reload the page. This way the presentation will stay on the same slide and reload the figure. Some figures may display improperly on mobile devices.
# 
# <br/><br/>
# <br/><br/>
# 
# <center><b>Push down to see the Table of Contents ↓</b></center>
# 

# ## Table of Contents:
# * [Introduction](#/1)
# * [Theoric Framework](#/2)
# * [Portfolio Optimization](#/3)
# * [Portfolio Evaluation](#/4)
# * [Portfolio Management Strategy Simulator](#/5)
# * [Results](#/6)
# * [Conclusions](#/7)
# * [Future Work](#/8)
# * [References](#/9)
# 
# <br/>
# 
# <center><i>You will not see further messages at the bottom of the page telling you where to navigate.</i></center><br/>
# 
# 
# <div style="text-align: right"> <b>Push right to start presentation →</b> </div>

# # Introduction

# Portfolio management strategies can bring with them some heated discussions. Which metric is the most important? What is the best way to optimize a portfolio? How to choose our assets?
# 
# This project implements a Portfolio Management Strategy Simulator that tests a variety of different possible management strategies.
# 
# The asset selection is based on a ranking function which serves as a metric to evaluate the possible stocks candidates and selects only a subset of them to then optimize the portfolio with the selected stocks.

# Smart beta strategies are usually referred to as a mid-term strategy between active investing and passive investing. An active investing strategy requires from the investor an active role in picking the assets to invest, while a passive strategy requires almost no active roll [[1]](https://corporatefinanceinstitute.com/resources/knowledge/trading-investing/smart-beta/).
# 
# A smart beta strategy is therefore based on a set of fixed rules that are usually automatically applied to portfolio operations and ensure that the portfolio will follow a predefined behavior based on a range of factors. This is why a smart-beta strategy is also sometimes referred to as a [factor investing](https://www.blackrock.com/us/individual/investment-ideas/what-is-factor-investing).
# 
# The factors to be chosen for the rules of the portfolio operation are varied, some are based on technical analysis metrics, such as the [Nifty 200 Momentum 30](https://www.niftyindices.com/indices/equity/strategy-indices/nifty200-momentum-30) which selects a portfolio of assets based on momentum, others smart-beta strategies may take factors such as metrics from fundamental analysis, credit scores, volatility or even sustainability and moral factors into consideration for asset selection [[2]](https://www.blackrock.com/us/individual/investment-ideas/what-is-factor-investing)[[3]](https://www.blackrock.com/us/individual/investment-ideas/sustainable-investing).

# With this in mind, this project will implement a Portfolio Management Strategy Simulator that weekly selects and invest all avaliable capital in a subset of selected assets from an bigger universe of candidate assets by ranking the canditate assets with a generic ranking function $f$ defined in this project as:
# 
# $$f(\text{stock price history}, t)\rightarrow m$$
# 
# Where $t$ the number of trading calendar days into the past to take into account to get the score $m$ for the $\text{stock price history}$ up to the present moment in the simulation.
# 
# With this ranking function, one can propose a selection of the top N stocks to where to allocate funds. To know how much of the available capital to allocate to each selected asset one could use the ranking itself but there are already well know optimization techniques for portfolios. In the current implementation of the simulator, the available options are to optimize to get the Maximum Sortino Ratio (MSR) portfolio or the Global Minimum Volatility (GMV) portfolio.
# 
# Optimizing for the chosen subset of assets using the ranking function lets the simulator reduce the size of the state space for the possible portfolio capital allocations and therefore require less computational power and will be quicker to process.

# Rankings are thoroughly used in society and are a way to reduce the complexity of a system into a simpler metric that can be used to compare elements within the system [[4]](https://www.nature.com/articles/s41467-022-29256-x#:~:text=Rankings%20reduce%20complex%20systems%20to,temporal%20rank%20data%20is%20aggregated.).
# 
# 
# Rankings are used everywhere, from fields like sports [(e.g. the NFL's top 100 player rankings)](https://www.nfl.com/network/shows/nfl-top-100) to sociology, where one could measure the influence of people by [ranking them by the number of Instagram followers](https://en.wikipedia.org/wiki/List_of_most-followed_Instagram_accounts) going all the way to money and power, where one can get a list like the [Forbes annual richest list](https://www.forbes.com/billionaires/).
# 
# Since many ranks usually are really big or don't have clear bounds (for example the actual complete ranking for the richest persons) in practice many rankings are further simplified to a top-N ranking.

# So far the factors implemented to rank the assets are:
# 
# - Random Ranking
# - Momentum
# - Historic VaR 
# 
# None-the-less, the simulator is implemented in such a way where other functions can be easily applied in future work.

# ## Algorithm

# The algorithm of the Portfolio Management Strategy Simulator is the following:
#         
#     - Define algorithm hyperparameters
#         
#     - Every chosen weekday (if possible):
#         - Get the top N stocks for the day according to rank by criteria and t
#         - Optimize portfolio weights according to the chosen technique and window
#         - Allocate all available capital (Buy stocks)

# ## Suppositions
# 
# - The universe of possible stock candidates is the S&P500 
# 
# - All historic prices analyzed are closing prices of the day
# 
# - For simplicity, we will not consider transaction fees
# 
# - The expected return will be estimated as the annualized return in the window of analysis
# 
# - The expected return and variance-covariance matrix are calculated with data from the windows of analysis
# 
# - We will assume we can buy hole stocks and fractions of stocks
# 
# - We will allocate all available capital each week
# 
# - We can't take short positions
# 
# - We will trade weekly on the specified weekday by the user. If that day of the week the markets are close the portfolio will hold the previous week's assets until the next tradeable day and resume the algorithm

# ## Capabilities
# 
# The current version of this simulator lets the user specify the following hyperparameters:
# 
# - Ranking Function
# - $t$ the hyperparameter of the ranking function
# - $N$ (for top N selection)
# - The optimization technique (MSR, GMV or equally weighted)
# - The window of analysis of historic prices to use in the optimization
# - The initial capital
# - The start date of the simulation
# - The end date of the simulation
# - The historic risk-free rate
# - The weekday to trade
# - The minimum weight for allocation
# - The maximum weight for allocation
# 
# 
# The simulation also lets the user track the allocations and close market days to further study portfolio behavior and increase behavior traceability.

# The recorded portfolio behavior is compared to the S&P500 and the risk-free rate.

# The S&P500 is a major index that comprises the 500 most capitalized companies in the United States. 
# 
# This index is sometimes perceived by institutional investors as a more representative index of the whole US economy than other indexes as the S&P500 collects more stocks from many companies in all sectors [[5]](https://www.investopedia.com/terms/s/sp500.asp).

# ## Data Download

# ### S&P 500

# Lets download some data about the S&P500, starting with the index performance

# #### S&P 500 Index
# 
# [source](https://www.spglobal.com/spdji/es/indices/equity/sp-500/#overview)

# In[2]:


URL = "https://github.com/ArtemioPadilla/ML-Datasets/blob/main/Finances/Stocks/SP500/SP500Performance.xls?raw=true"

SP500_index = pd.read_excel(URL, header=6)
SP500_index = SP500_index[:-4]
SP500_index.index = pd.to_datetime(SP500_index["Fecha"])
SP500_index["S&P 500"] = pd.to_numeric(SP500_index["S&P 500"])
SP500_index.drop("Fecha", axis=1, inplace=True)
SP500_index.head()

# The overall S&P index looks like this [[6]](https://www.spglobal.com/spdji/es/indices/equity/sp-500/#overview): 

# In[3]:


SP500_index_plot = px.line(SP500_index, y="S&P 500", title="S&P500 index").update_yaxes(title="Valuation [USD]");

# In[4]:


SP500_index_plot

# #### Stock by stock

# Lets download the stock symbols, company names and sectors that conform the index
# 
# [[source]](https://datahub.io/core/s-and-p-500-companies)

# In[5]:


SP500_metadata = pd.read_csv("https://datahub.io/core/s-and-p-500-companies/r/constituents.csv")

# These are the S&P500 companies, their stock symbol and their economy sector [[7]](https://datahub.io/core/s-and-p-500-companies):

# In[6]:


SP500_metadata

# In[7]:


s_and_p_500_composition = px.treemap(SP500_metadata,
                 path = [px.Constant("S&P 500"), 'Sector', 'Symbol'],
                 hover_data=['Name'],
                 title="Companies and sectors that conform the S&P500"
)

# Here we have a tree map showing the composition of the S&P500 by sector and company:

# In[8]:


s_and_p_500_composition

# After using Alpha Vantage and discovering that their free data is not adjusted for splits, and also after discovering the existence of the Python package [yfinance](https://pypi.org/project/yfinance/) that provides access to adjusted [Yahoo! Finance](https://finance.yahoo.com/) data [I decided to switch to this data source and downloaded](https://colab.research.google.com/drive/1_1Yt_2byZ0kk_n6s9IBQU__cXVV_T8Wx?usp=sharing) the S&P500 historic closing prices.

# Lets download the previously collected company data:

# In[9]:


universe = pd.read_csv("https://media.githubusercontent.com/media/ArtemioPadilla/data/main/Finances/Stocks/SP500/SP500-20220523.csv",index_col=0)
universe.index  = pd.to_datetime(universe.index)
universe.index.name = "date"

# drop dates without data:

# In[10]:


universe = universe[universe.isna().sum(axis=1) != universe.shape[1]]

# In[11]:


universe["GOOGL"]

# # Theoric Framework

# ## Risk-Free Rate
# 
# The risk-free rate, most commonly defined as the return rate one would get from government bonds, is taken in practice as the return one would get with risk 0.
# 
# The risk 0 assumption could be debatable, yet most would agree that it is easier for any other entity to default than governments.

# We can easily obtain data for the [USA risk-free rate from the FED](https://www.federalreserve.gov/releases/H15/default.htm).

# In[12]:


url = "https://drive.google.com/file/d/1KsrSdmJcY5HpkGhjvD9kqXvq6fU0Z3Am/view?usp=sharing"
url ='https://drive.google.com/uc?id=' + url.split('/')[-2]
fed_df = pd.read_csv(url)
risk_free = fed_df.loc[5:,["Series Description", "Market yield on U.S. Treasury securities at 1-year   constant maturity, quoted on investment basis"]]
risk_free.columns = ["date", "Risk Free Rate"]
risk_free = risk_free[risk_free["Risk Free Rate"] != "ND"]
risk_free["date"] = pd.to_datetime(risk_free["date"])
risk_free.index = risk_free["date"] 
risk_free["Risk Free Rate"] = pd.to_numeric(risk_free["Risk Free Rate"]) / 100
risk_free_rate = risk_free.drop("date", axis=1)

# In[13]:


risk_free_rate.head()

# The USA risk-free rate from early 1962 to april 2022 looks like this:

# In[14]:


risk_free_rate_plot = px.line(risk_free_rate, y="Risk Free Rate",
                             title="Annualized USA Risk Rate over the time")

# In[15]:


risk_free_rate_plot

# ## Mini Universe of Stocks Example
# 
# Let's introduce our mini-universe ("miniverse") of stocks to illustrate some metrics and portfolio construction techniques in the following subsections. To illustrate the theoric framework we will only work with data from 2015 to May 2022.

# The selected stocks for this miniverse example is comprised of the [top 10 component companies of the S&P 500](https://www.investopedia.com/top-10-s-and-p-500-stocks-by-index-weight-4843111):
# 
# |Top Component #|Company|Description|
# |------|------|------|
# | 1  | AAPL | Apple |
# | 2  | MSFT | Microsoft |
# | 3  | AMZN | Amazon |
# | 4  | TSLA | Tesla |
# | 5  | GOOGL | Google Class A (with vote rights)|
# | 6  | GOOG | Google Class C (without vote rigths)|
# | 7  | NVDA | Nvidia Corp. |
# | 8  | BRK-B |  Berkshire Hathaway Inc. Class B  |
# | 9 | FB | Meta Platforms Inc. Class A |
# | 10  | UNH | UnitedHealth Group Incorporated |

# In[16]:


mini_universe_symbols = ["AAPL", "MSFT", "AMZN", "TSLA", "GOOGL", "GOOG", "NVDA", "BRK-B", "FB", "UNH"]

# In[17]:


example_prices = universe[mini_universe_symbols].loc["2015":"2022-05-31"]

# The last 5 trading days  on record were.

# In[18]:


example_prices.tail()

# The prices the miniverse looked like this:

# In[19]:


def get_stacked_data(prices, labels = ["date", "company", "price"] ):
    stacked = prices.stack()
    mapper = {k: v for k, v in zip(["level_0", "level_1", 0],labels)}
    stacked = stacked.reset_index().rename(mapper, axis=1)
    stacked = stacked.set_index("date")
    return stacked

miniverse_prices_plot = px.line(get_stacked_data(
                    example_prices), y="price", color="company", 
                    title="Price over time of companies in the example miniverse"
                                  )
miniverse_prices_plot.update_yaxes(title="Valuation [USD]");

# In[20]:


miniverse_prices_plot

# ## Metrics and Properties of Assets and Portfolios

# ### Normality

# #### **Skewness**
# 
# 
# Skewness provides a way to compare how skewed is a distribution compared to the normal distribution, the following image by [Robert Keim](https://www.allaboutcircuits.com/technical-articles/understanding-the-normal-distribution-parametric-tests-skewness-and-kurtosis/) explains this concept:
# 
# ![Skewness](https://www.allaboutcircuits.com/uploads/articles/understanding-the-normal-distribution-parametric-tests-skewness-and-kurtosis-rk-aac-image2.jpg)
# 

# Skewness is defined as follows:
# 
# 
# $$\text{skewness} = \tilde{\mu}_3 = E\big[ \big( \frac{X-\mu}{\sigma} \big)^3 \big]$$
# 
# Therefore, we can program a function to get the skewness of a return series like this:

# In[21]:


def skewness(r):
    """
    Alternative to scipy.stats.skew()
    Computes the skewness of the supplied Series or DataFrame
    Returns a float or a Series
    """
    demeaned_r = r - r.mean()
    # use the population standard deviation, so set dof=0
    sigma_r = r.std()
    exp = (demeaned_r**3).mean()
    return exp/sigma_r**3

# #### **Kurtosis**
# 
# Kurtosis provides a way to compare how fat tailed is a distribution compared to the normal distribution, for a normal distribution the kurtosis is 3. An image by <a href="https://www.vosesoftware.com/riskwiki/Kurtosis(K).php">vose software</a> that illustrates this concept is presented next:
# 
# ![](https://www.vosesoftware.com/riskwiki/images/image15_346.gif)

# Kurtosis is defined as:
# 
# $$\text{Kurtosis} = \tilde{\mu}_4 = E\big[ \big( \frac{X-\mu}{\sigma} \big)^4 \big]$$
# 
# We can implement is in Python like this:

# In[22]:


def kurtosis(r):
    """
    Alternative to scipy.stats.kurtosis()
    Computes the kurtosis of the supplied Series or DataFrame
    Returns a float or a Series
    """
    demeaned_r = r - r.mean()
    # use the population standard deviation, so set dof=0
    sigma_r = r.std()
    exp = (demeaned_r**4).mean()
    return exp/sigma_r**4

# ### Returns

# A very useful representation to study historic prices for investemt purposes is the return. The return is defined as the ratio between the prices of an asset two points in time.
# 
# From a sequence of prices ($\mathbf{P}$) we can calculate the return as between the price at time $t$ and $t+1$ as:
# 
# $$R_{t,t+1} = \frac{P_{t+1} - P_t}{P_t} = \frac{P_{t+1}}{P_t} -1 $$
# 
# 
# The Python we can get the returns of a price series using Pandas and the `pct_change` method as follows:

# In[23]:


def get_returns(prices):
    returns = prices.pct_change()
    returns.index = pd.to_datetime(returns.index)
    if isinstance(returns, pd.DataFrame):
        return returns.iloc[1:,:]
    if isinstance(returns, pd.Series):
        return returns.iloc[1:]

# In[24]:


returns = get_returns(example_prices)
returns_plot = px.line(get_stacked_data(returns, labels = ["date", "company", "return"]), y="return", color="company")

# The daily returns for the miniverse looks like this:

# In[25]:


returns_plot

# #### Compounded Returns

# Another useful metric is the compounded return that captures the cumulative return over a series of returns, this is defined as the product of the returns represented with respect to 1 (1 represents a null profit and below 1 represents a loss). 
# 
# The Python function that computes this metric is:

# In[26]:


def get_compounded_return(returns):
    """
    Get compounded return
    Returns compounded return centered around 0
    """
    return ((returns + 1).prod() - 1)

# The compounded returns for each stock in the miniverse from 2015 to May 2022 are:

# In[27]:


get_compounded_return(returns)

# #### Annualized Returns
# 
# In finances the convention is to represent most metrics annualized, therefore we need to annualize discrete returns. 
# 
# To annualize the returns we define the following function:

# In[28]:


def annualize_returns(returns, periods_per_year = 252):
    """
    This function recieves a returns dataframe
    """
    compounded_growth =   (1 + returns).prod()
    n_periods = returns.shape[0]
    return compounded_growth**(periods_per_year/n_periods)-1

# The miniverse mean annual return is:

# In[29]:


annualize_returns(returns)

# #### Portfolio Returns

# When we have a portfolio of assets with a certain relative weight each one with respect to the whole portfolio we can compute the overall portfolio return as a weighted average (or dot product).
# 
# The following function computes the portfolio return for a couple of weights and returns vectors where every entry represents a stock in the portfolio:

# In[30]:


def portfolio_return(weights, returns):
    """
    Computes the return on a portfolio from constituent 
    returns and weights weights are a numpy array or 
    Nx1 matrix and returns are a numpy array or Nx1 matrix
    """
    return weights.T @ returns

# If we had an equally weighted portfolio of the miniverse we would have had the following portfolio return on the last trading day in the dataset:

# In[31]:


weights = np.repeat(1/returns.shape[1], returns.shape[1])
portfolio_return(weights, returns.iloc[-1,:])

# ### Risk Measurement
# 
# There are many risk metrics in portfolio analysis, next I present some

# #### Volatility (MPT)

# In Modern Portfolio Theory (MPT) volatility is defined as the standard deviation of the returns:

# In[32]:


def get_volatility(returns):
    return returns.std()

# The mean daily volatility of the miniverse is:

# In[33]:


get_volatility(returns)

# #### Volatility (PMPT) / Semideviation

# In Post-Modern Portfolio Theory (PMPT) volatility only takes into account negative returns, this is also known as a semideviation.
# 
# This is one of the main swifts in paradigms between MPT and PMPT.
# 
# A Python function that gets the semideviation is:

# In[34]:


def semideviation(returns):
    negative_returns = returns[returns < 0 ]
    return negative_returns.std()

# The mean daily volatility for negative returns of the miniverse is:

# In[35]:


semideviation(returns)

# We can see that the assets have lower volatility in the PMPT ideology.

# #### Annualized Volatility

# Once again, standard practices require us to report results annualized.

# ##### MPT
# 
# For modern portfolio theory we can get the annualized volatility as follows:

# In[36]:


def annualize_vol(returns, periods_in_year:int = 252):
    volatility = returns.std()
    return volatility*np.sqrt(periods_in_year)

# The mean annualized volatility of the miniverse is:

# In[37]:


annualize_vol(returns)

# ##### MPT
# 
# For modern portfolio theory we can get the annualized volatility as follows:

# In[38]:


def annualize_semideviation(returns, periods_in_year:int = 252):
    volatility = semideviation(returns)
    return volatility*np.sqrt(periods_in_year)

# The mean annualized semideviation of the miniverse is:

# In[39]:


annualize_semideviation(returns)

# #### VaR (Value At Risk)

# The value at risk is another useful and common risk measure.
# 
# Is the worst-case scenario of the return distribution after eliminating a given percentile. It is usually represented as a positive number.
# 
# There are a few ways to define the value at risk:

# ##### **Historical Methodology:**
# 
# Uses historical data to predict the future. Uses the actual series of values.
# 
# The problem with this kind of model is that they rely on assuming past data can be used to model present and future times.

# In[40]:


def var_historic(r, t=0, level=5):
    """
    Returns the historic Value at Risk at a specified level
    i.e. returns the number such that "level" percent of the returns
    fall below that number, and the (100-level) percent are above
    """
    
    if isinstance(r, pd.DataFrame):
        return r.aggregate(var_historic, t=t, level=level)
    elif isinstance(r, pd.Series):
            return -np.percentile(r.iloc[-t:], level)
    else:
        raise TypeError("Expected prices to be a Series or DataFrame")

# In[41]:


def var_historic_from_prices(p, t=0, level=5):
    """
    Returns the historic Value at Risk at a specified level
    i.e. returns the number such that "level" percent of the returns
    fall below that number, and the (100-level) percent are above
    t is the number of weeks in the past to take into account
    """
    
    if isinstance(p, pd.DataFrame):
        r = get_returns(p)
        return r.aggregate(var_historic, t=t, level=level)
    elif isinstance(p, pd.Series):
            return -np.percentile(p.iloc[-t:], level)
    else:
        raise TypeError("Expected prices to be a Series or DataFrame")

# For the miniverse the historic var is:

# In[42]:


var_historic(get_returns(example_prices), t=100)

# In[43]:


var_historic_from_prices(example_prices, t=100)

# ##### **Parametric Gaussian Methodology:**
# 
# We select a return distribution model (gaussian for simplicity), in this way, we only need to determine the parameters for the model ($\mu, \sigma$).
# 
# $$VaR(1-\alpha)= -(\mu + z_\alpha \sigma)$$
# 
# Where $\alpha$ is the confidence leve, $z_\alpha$ is the $\alpha$-quantile of the standard normal distribution.

# The problem with this methodology is that it incurs in a greater model error since real-world data is rarely normally distributed.
# 
# It is implemented as follows with the Cornish-Fisher modification explained in posterior slides:

# In[44]:


def var_gaussian(r, level=5, modified=False):
    """
    Returns the Parametric Gaussian VaR of a Series or DataFrame
    If "modified" is True, then the modified VaR is returned,
    using the Cornish-Fisher modification
    """
    # compute the Z score assuming it was Gaussian
    z = norm.ppf(level/100)
    if modified:
        # modify the Z score based on observed skewness and kurtosis
        s = scipy.stats.skew(r)
        k = scipy.stats.kurtosis(r) + 3
        z = (z +
                (z**2 - 1)*s/6 +
                (z**3 -3*z)*(k-3)/24 -
                (2*z**3 - 5*z)*(s**2)/36
            )
    return -(r.mean() + z*r.std(ddof=0))

# For the miniverse the gaussian VaR is:

# In[45]:


var_gaussian(returns, level=5, modified=False)

# ##### **Parametric Non-Gaussian VaR Methodology:**
# 
# We could model the returns as other distribuion other than normal, e.g. Pareto. We could also used other more complex models. These are not yet implemented at this version of the simulator.

# **Cornish-Fisher VaR**
# 
# Uses a semi-parametric model. 
# 
# Uses a polynomial expansion for the $\alpha$-quantile that takes into account the skewness and kurtosis.

# $$\tilde{z}_\alpha = \frac{1}{6}(z_\alpha^2 - 1) S + \frac{1}{24}(z_\alpha^3 - 3 z_\alpha)(K-3) - \frac{1}{36} (2 z_\alpha^3 - 5 z_\alpha) S^2$$

# $$VaR_{\text{mod}}(1-\alpha) = - (\mu + \tilde{z}_\alpha \sigma)$$

# For the miniverse the gaussian var with the Cornish-Fisher modification is:

# In[46]:


var_gaussian(returns, level=5, modified=True)

# ##### **Conditional VaR**

# Another metric that can be used to measure risk is the conditional VaR, which is defined as the mean of the returns set aside on the normal VaR. This provides a risk measure directedly linked to the negative heavy-tailed risks.

# In[47]:


def cvar_historic(r, t=0, level=5):
    """
    Computes the Conditional VaR of Series or DataFrame
    """
    if isinstance(r, pd.Series):
        is_beyond = r <= -var_historic(r, t=t, level=level)
        return -r[is_beyond].mean()
    elif isinstance(r, pd.DataFrame):
        return r.aggregate(cvar_historic, t=t, level=level)
    else:
        raise TypeError("Expected r to be a Series or DataFrame")

# The conditional VaR for the miniverse is:

# In[48]:


cvar_historic(returns)

# #### Portfolio Volatility

# [In practice we represent the overall portfolio volatility as the matrix multiplication](https://www.coursera.org/learn/introduction-portfolio-construction-python/lecture/tnbqp/applying-quadprog-to-draw-the-efficient-frontier):
# 
# $$\text{portfolio volatility} = (W^T \Sigma W)^{\frac{1}{2}}$$
# 
# Where W is the weight vector of the portfolio and $\Sigma$ is the variace-covariance of the returns.

# In[49]:


def portfolio_vol(weights, covmat):
    """
    Computes the vol of a portfolio from a covariance matrix 
    and constituent weights. The weights are a numpy array 
    or N x 1 matrix and covmat is an N x N matrix
    """
    return (weights.T @ covmat @ weights)**0.5

# The portfolio volatility for the whole miniverse assuming an equally weighted portfolio is:

# In[50]:


weights = np.repeat(1/returns.shape[1], returns.shape[1])
portfolio_vol(weights, returns.cov())

# ### Alpha ($\alpha$)
# 
# In investing seeking $\alpha$ is one of the most important activities.
# 
# $\alpha$ is defined as the difference between a portfolio or asset and the risk free rate. It is a measure of how much additional return one could get over the one that is practically free.

# In[51]:


def get_alpha(rp, rf):
    return rp - rf

# The $\alpha$ for each stock in the miniverse for 2020 was:

# In[52]:


a_returns = annualize_returns(returns["2020":"2021"])
get_alpha(a_returns, risk_free.loc["2020-01-06"]["Risk Free Rate"])

# ### Sharpe ratio

# When analyzing an asset it is problematic to just take into account the returns. The returns say one thing but it is also important to take into account the risk.
# 
# The most useful ratio for this is to consider the ratio between the $\alpha$ and the volatility. 
# 
# In modern portfolio theory this ratio is named the Sharpe ratio and is implemented in Python as follows:

# In[53]:


def sharpe_ratio(r, riskfree_rate, periods_per_year=252):
    """
    Computes the annualized sharpe ratio of a set of returns
    """
    # convert the annual riskfree rate to per period
    rf_per_period = (1+riskfree_rate)**(1/periods_per_year)-1
    excess_ret = r - rf_per_period
    ann_ex_ret = annualize_returns(excess_ret, periods_per_year)
    ann_vol = annualize_vol(r, periods_per_year)
    return ann_ex_ret/ann_vol

# The annualized Sharp ratio for each stock the miniverse in 2020 was:

# In[54]:


sharpe_ratio(returns.loc["2020":"2021"], riskfree_rate = risk_free.loc["2020-01-06"]["Risk Free Rate"])

# ### Sortino ratio

# The equivalent metric in post-modern portfolio theory is named sortino ratio and is implemented as follows:

# In[55]:


def sortino_ratio(r, riskfree_rate, periods_per_year=252):
    """
    Computes the annualized sharpe ratio of a set of returns
    """
    # convert the annual riskfree rate to per period
    rf_per_period = (1+riskfree_rate)**(1/periods_per_year)-1
    excess_ret = r - rf_per_period
    ann_ex_ret = annualize_returns(excess_ret, periods_per_year)
    ann_vol = annualize_semideviation(r, periods_per_year)
    return ann_ex_ret/ann_vol

# The annualized Sortino ratio for each stock in the miniverse in 2020 was:

# In[56]:


sortino_ratio(returns.loc["2020":"2021"], riskfree_rate = risk_free.loc["2020-01-06"]["Risk Free Rate"])

# ### Drawdown
# 
# Drawdown is a metric for worst-case scenarios. It is a measure of how much a price has dropped from a previous historic maximum. It is defined as:
# 
# $$\text{Drawdown}_t = \frac{P_t - P_{max_t}}{P_{max_t}}$$

# In[57]:


def get_drawdown(prices):
    return (prices - prices.cummax())/prices.cummax()

# For the miniverse the historic drawdown is:

# In[58]:


drawdown_plot = px.line(get_stacked_data(get_drawdown(example_prices), 
                         labels = ["date", "company", "drawdown"]), 
        y="drawdown", color="company")

# In[59]:


drawdown_plot

# ### Momentum

# ["Momentum shows the rate of change in price movement over a period of time to help investors determine the strength of a trend."](https://www.investopedia.com/articles/technical/081501.asp)

# $$Momentum(P,t) = P - P_{t}$$
# 
# Where $P$ is the current price and $P_{t}$ is the price $t$ days ago:

# In[60]:


def get_momentum(prices, t):
    return prices - prices.shift(t)

# The momentum for the miniverse components using $t=10$ is:

# In[61]:


momentum_plot = px.line(get_stacked_data(get_momentum(example_prices["2018":], t=10), 
                         labels = ["date", "company", "Momentum"]), 
        y="Momentum", color="company")

# In[62]:


momentum_plot

# The momentum for the hole S&P500 index using $t=100$ is:

# In[63]:


sp500_momentum_plot = px.line(get_momentum(SP500_index, t=100))

# In[64]:


sp500_momentum_plot

# Lets create a function to get the latest momentum

# In[65]:


def get_latest_momentum(prices, t):
    momentum = prices - prices.shift(t)
    return momentum.iloc[-1]

# # Portfolio Optimization

# When we have two or more assets we can combine them to reduce the risk we would have with a single asset as long as the assets are not perfectly correlated. This is known as the only free lunch of finances.

# ## 2-Asset Portfolio Construction

# These are possible portfolios one can make with 2 assets, GOOGL and MSFT, if one can buy fractions of stocks one could create any portfolio along the line:

# In[66]:


assets = ["GOOG", "MSFT"]

n_points = 200

weights = [np.array([w, 1-w]) for w in np.linspace(0, 1, n_points)]

rets = [portfolio_return(w, returns[assets].iloc[-1,:]) for w in weights]
vols = [portfolio_vol(w, returns.cov().loc[assets,assets]) for w in weights]
formated_weights = np.apply_along_axis(lambda x: str(x[0])+", " +  str(x[1]) ,
                    axis=1, arr= np.round(np.array(weights)*100, 1))
frontier = pd.DataFrame({"Return": rets, "Volatility": vols, "Weights [%]":formated_weights})
frontier["Type"] = "combination"
frontier.loc[0,"Type"] = "GOOG"
frontier.loc[199,"Type"] = "MSFT"
two_assets_combination = px.scatter(frontier, x="Volatility", y="Return", color="Type", 
                                    title="Volatilities and returns of possible combination portfolios", 
                                    hover_data=["Volatility", "Return", "Weights [%]"])


two_assets_combination.update_layout(
    autosize=False,
    height=400,
    width=800
);

# In[67]:


two_assets_combination

# ## N-Asset Portfolio Construction

# With N-assets we dispose of a bigger space state to create portfolios.
# 
# To reduce the possible portfolios let's focus on those who provide the minimal volatility for a given target return.

# For this, [we use the next function](https://www.coursera.org/learn/introduction-portfolio-construction-python/lecture/9cjxj/lab-session-applying-quadprog-to-draw-the-efficient-frontier]) that uses a scipy minimizer to find the weights for such a portfolio.

# In[68]:


def minimize_vol(target_return, er, cov):
    """
    Returns the optimal weights that achieve the target return
    given a set of expected returns and a covariance matrix
    """
    n = er.shape[0]
    init_guess = np.repeat(1/n, n)
    bounds = ((0.00, 1),) * n # an N-tuple of 2-tuples!
    # construct the constraints
    weights_sum_to_1 = {'type': 'eq',
                        'fun': lambda weights: np.sum(weights) - 1
    }
    return_is_target = {'type': 'eq',
                        'args': (er,),
                        'fun': lambda weights, er: target_return - portfolio_return(weights,er)
    }
    weights = minimize(portfolio_vol, init_guess,
                       args=(cov,), method='SLSQP',
                       options={'disp': False},
                       constraints=(weights_sum_to_1,return_is_target),
                       bounds=bounds)
    return weights.x

# In[69]:


minimize_vol(3, annualize_returns(returns), returns.cov())

# The list of optimal weights for the intermediate $n$ points portfolios between investing 100% in either asset is [given by](https://www.coursera.org/learn/introduction-portfolio-construction-python/lecture/9cjxj/lab-session-applying-quadprog-to-draw-the-efficient-frontier):

# In[70]:


def optimal_weights(n_points, er, cov):
    """
    Returns a list of weights that represent a grid of n_points on the efficient frontier
    """
    target_rs = np.linspace(er.min(), er.max(), n_points)
    weights = [minimize_vol(target_return, er, cov) for target_return in target_rs]
    return weights

# We can plot the efficient frontier, the MSR, Equally Weighted, and GMV portfolios with the following function. The theory on how to calculate these portfolios is discussed next.

# In[71]:


def plot_ef(er, cov, n_points=100, show_msr=False, riskfree_rate=0, show_ew=False, show_gmv=False):
    """
    Plots the multi-asset efficient frontier
    """
    weights = optimal_weights(n_points, er, cov)
    rets = [portfolio_return(w, er) for w in weights]
    vols = [portfolio_vol(w, cov) for w in weights]
    ef = pd.DataFrame({
        "Returns": rets, 
        "Volatility": vols
    })
    
    fig = go.Figure(
        data = px.line(ef, x="Volatility", y="Returns", markers=True)

    )
    if show_msr:
        # get MSR
        w_msr = msr(riskfree_rate, er, cov)
        r_msr = [portfolio_return(w_msr, er)]
        vol_msr = [portfolio_vol(w_msr, cov)]
        # add MSR
        fig.add_trace(go.Scatter(x=vol_msr, y=r_msr,
                                 marker_color='rgba(255, 0, 0, 1)', 
                                 name="MSR", marker_size=15,
                                 hovertemplate =
                                 '<b>Volatility</b>: %{x:.2f}'+
                                 '<br><b>Return</b>: %{y}<br>'+
                                 '<b>Portfolio</b>: %{text}',
                                 text=["Maximum Sortino Ratio"]
                                ))
    if show_ew:
        n = er.shape[0]
        w_ew = np.repeat(1/n, n)
        r_ew = portfolio_return(w_ew, er)
        vol_ew = portfolio_vol(w_ew, cov)
        # add EW
        fig.add_trace(go.Scatter(x=[vol_ew], y=[r_ew],
                                 marker_color='rgba(255, 255, 0, 1)', 
                                 name="EW", marker_size=15,
                                 hovertemplate =
                                 '<b>Volatility</b>: %{x:.2f}'+
                                 '<br><b>Return</b>: %{y}<br>'+
                                 '<b>Portfolio</b>: %{text}',
                                 text=["Equally Weighted"]
                                ))
    if show_gmv:
        w_gmv = gmv(cov)
        r_gmv = portfolio_return(w_gmv, er)
        vol_gmv = portfolio_vol(w_gmv, cov)
        # add GMV
        fig.add_trace(go.Scatter(x=[vol_gmv], y=[r_gmv],
                                 marker_color='rgba(0, 255, 0, 1)', 
                                 name="GMV", marker_size=15,
                                 hovertemplate =
                                 '<b>Volatility</b>: %{x:.2f}'+
                                 '<br><b>Return</b>: %{y}<br>'+
                                 '<b>Portfolio</b>: %{text}',
                                 text=["Global Minimum Volatility"]
                                ))
    if show_msr or show_ew or show_msr:
        fig.update_layout(legend_title_text='Portfolio')
        subtitle = ""
        if show_msr: subtitle += "MSR, "
        if show_gmv: subtitle += "GMV, "
        if show_ew:  subtitle += "EW, "
        subtitle = subtitle[:-2] + " plotted"
        fig.update_layout(title=f"Portfolios with minimal volatility for a given risk<br><sup>{subtitle}</sup>")
    else:
        fig.update_layout(title="Portfolios with minimal volatility for a given risk")
    return fig

# We can plot the possible portfolio returns and volatilities for the miniverse assuming a risk-free rate equal to the one on 2015-01-06:

# In[72]:


er = annualize_returns(returns)
cov = returns.cov()
riskfree_rate = risk_free.loc["2015-01-06"]["Risk Free Rate"]

# In[73]:


plot_ef(er, cov)

# Note that we could construct any portfolio inside this curve, nonetheless, we are interested in the upper side of the curve as these portfolios have the maximum return for the minimum volatility.
# 
# This frontier of portfolios with maximum return and minimum volatility is known as the efficient frontier.

# ## Construction of Maximum Sharp Ratio Portfolio

# We can construct the maximum return/risk portfolio. This portfolio maximizes the reward per unit of risk but requires expected return estimations [[8]](https://www.coursera.org/learn/introduction-portfolio-construction-python/lecture/tnbqp/applying-quadprog-to-draw-the-efficient-frontier).

# For a portfolio:
# 
# 
# $$SR_p = \frac{\mu_p - r_f}{\sigma_p} = \frac{\sum_{i=1}^N w_i \mu_i - r_f}{\sqrt{\sum_{i,j=1}^N w_i w_j \sigma_i \sigma_j \rho_{ij}}}$$
# 
# Where $SR_p$ is the Sortino ratio of the portfolio $\mu_p = \sum_{i=1}^N w_i \mu_i$ its the mean expected return $r_f$ its the risk-free rate $\sigma_i,\sigma_j$ are the volatilities of assets $i$ and $j$, $\rho_{ij}$ its the correlation of $i$ and $j$.

# The [Python implementation](https://www.coursera.org/learn/introduction-portfolio-construction-python/lecture/9cjxj/lab-session-applying-quadprog-to-draw-the-efficient-frontier) to get the maximum Sharp ratio portfolio weights is:

# In[74]:


def msr(riskfree_rate, er, cov, min_w = 0.01, max_w = 0.95):
    """Returns the weights of the portfolio that gives you the maximum sharpe ratio
    given the riskfree rate and expected returns and a covariance matrix"""
    n = er.shape[0]
    init_guess = np.repeat(1/n, n)
    bounds = ((min_w, max_w),) * n # an N-tuple of 2-tuples!
    # construct the constraints
    weights_sum_to_1 = {'type': 'eq',
                        'fun': lambda weights: np.sum(weights) - 1
    }
    def neg_sharpe(weights, riskfree_rate, er, cov):
        """Returns the negative of the sharpe ratio
        of the given portfolio"""
        r = portfolio_return(weights, er)
        vol = portfolio_vol(weights, cov)
        return -(r - riskfree_rate)/vol
    weights = minimize(neg_sharpe, init_guess,
                       args=(riskfree_rate, er, cov), method='SLSQP',
                       options={'disp': False},
                       constraints=(weights_sum_to_1,),
                       bounds=bounds)
    return weights.x/weights.x.sum()

# Given that the cell of code from above that use the scipy minimizer has constrained bounds for the portfolio weights to be above 1% and below 95% and since the actual minimization may rely on zero weighted components this function will likely throw warnings for the clipping of the weights to fit within the bounds.
# 
# Note that these constrictions may make user-defined boundaries inexact.

# In[75]:


import warnings
warnings.filterwarnings("ignore")

# In[76]:


# Test
er = annualize_returns(returns)
cov = returns.cov()
riskfree_rate = risk_free.loc["2015-01-06"]["Risk Free Rate"]
msr(riskfree_rate, er, cov)

# The maximum Sharpe ratio portfolio is shown as the red dot in the next figure. Note that the MSR is not exactly on the frontier as we imposed a minimum of 1% in all selected stocks and a maximum of 95%. Many portfolios in the efficient frontier have zero weighted components.

# In[77]:


plot_ef(er, cov, show_msr=True, riskfree_rate=riskfree_rate)

# ## Construction of Maximum Sortino Ratio Portfolio
# 
# To be implemented in future work.

# In[78]:


def get_highest_sortino_ratio_portfolio(stocks_prices):
    # To be developed
    return np.repeat(1/stocks_prices.shape[1], stocks_prices.shape[1])

# ## Construction of Global Minimum Volatility Portfolio

# Estimations of expected returns are usually worst than estimations for the risk. 
# 
# To get a minimum risk portfolio we can simply get the maximum Sharpe ratio portfolio when all the expected returns are the same. This trick works because if the expected returns are the same the maximum Sharpe ratio must be obtained purely by minimizing the volatility [[8]](https://www.coursera.org/learn/introduction-portfolio-construction-python/lecture/tnbqp/applying-quadprog-to-draw-the-efficient-frontier).

# In[79]:


def gmv(cov, min_w = 0.01, max_w = 0.95):
    """
    Returns the weights of the Global Minimum Volatility portfolio
    given a covariance matrix
    """
    n = cov.shape[0]
    return msr(0, np.repeat(1, n), cov, min_w = 0.01, max_w = 0.95)

# A nice characteristic of this portfolio optimization is that it doesn't require expected return estimates, which are usually harder to predict than volatility.

# The Maximum Sharpe Ratio portfolio is shown in red while the Global Minimum Volatility portfolio is shown in green:

# In[80]:


plot_ef(er, cov, show_msr=True, riskfree_rate=riskfree_rate, show_gmv=True)

# ## Construction of Equally Weighted Portfolio

# To construct an equally weighted portfolio we only need to assign a weight of $\frac{1}{N}$ to each of the $N$ portfolio components.

# In[81]:


def get_eq_weighted_portfolio(expected_returns):
    number_of_assets = len(expected_returns)
    return np.repeat(1/number_of_assets, number_of_assets)

# The maximum Sortino ratio portfolio is shown in red, the Global Minimum Volatility portfolio is shown in green and the equally weighted portfolio is shown in yellow:

# In[82]:


plot_ef(er, cov, show_msr=True, riskfree_rate=riskfree_rate, show_ew=True, show_gmv=True)

# # Portfolio Evaluation

# Let's define some functions that will be useful to evaluate our portfolio.
# 
# We need a function to get the capitalization of our portfolios and to compare them to the benchmarks.

# ## Calculate Portfolio Capitalization

# First of all, let's define a function that given the universe of stocks, the day, the stocks owned and the number of stocks owned returns the portfolio value for that particular portfolio on that particular day.

# In[83]:


def get_portfolio_cap(universe, day, stocks, number_of_stocks_owned):
    prices = universe.loc[day,stocks]
    valuation = pd.Series(number_of_stocks_owned@prices, index=[day])
    valuation.index = pd.to_datetime(valuation.index)
    return valuation

# What a portfolio capitalization would be on March 16th, 2021 if it had 100 stocks from Tesla and 50 stocks from Microsoft

# In[84]:


get_portfolio_cap(universe, "2021-03-16", ["TSLA","MSFT"], [100,50])

# ## Comparing to the Benchmarks

# We need a way to compare the portfolio to the benchmark, for this let's compare them with their annualized returns and volatility.

# We can define a function that returns a comparison table between a portfolio returns series and the benchmarks

# In[85]:


def eval_portfolio(p_returns,  p_periods_per_year = 52):
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

# A portfolio that consisted purely of Meta stocks (FB) would compare to the S&P500 and the risk-free rate in the following way:

# In[86]:


meta_returns = returns["FB"]

eval_portfolio(meta_returns, p_periods_per_year = 252)

# ## Auxiliary Functions

# Finally, we need a function that takes all the stock symbols and their allocated capital and makes a formated data frame to make it easy to plot the allocations.

# In[87]:


def track_allocation(capital_dist, stocks_names, days):
    res = {"stock":[], "value":[], "date":[]}
    res = pd.DataFrame(res)
    res.index = pd.to_datetime(res.index)
    for i, d in enumerate(days):
        for j, stock in enumerate(stocks_names[i]):
            
            tmp = pd.DataFrame([[stock, capital_dist[i][j]]], 
                               columns=["stock","value"])
            tmp["date"] = [d]
            res = pd.concat([res, tmp], axis=0)
    res.set_index("date", inplace=True)
    res["date"]= res.index.map(lambda x: x.strftime("%Y/%m/%d"))
    
    return res

capital_dist = [[100, 50,60],[100,150,50],[120,60,100]]
stocks_names = [["TSLA","MSFT","NVDA"], ["TSLA","AAPL","AMZN"], ["TSLA","MSFT","WMT"]]
day = [pd.to_datetime("2020-02-02"),pd.to_datetime("2020-05-02"),pd.to_datetime("2021-02-02")]

allocations = track_allocation(capital_dist, stocks_names, day)
allocations

# Let's make an auxiliary function to plat the animation of the portfolio allocation:

# In[88]:


def plot_allocations(df, normalized=False):
    if normalized:
        for d in df["date"].unique():
            day_mask =df["date"]==d
            net_capital = df.loc[day_mask.values]["value"].sum()
            normalized_ws = (df.loc[day_mask.values]["value"]/net_capital).values
            df.loc[day_mask.values,"value"] = normalized_ws*100
    fig = px.bar(df, x="stock", y="value", color="stock",
          animation_frame="date",)# title="Allocation of capital along time",)
    
    fig.update_xaxes(categoryorder='total descending')
    fig.update_traces(hovertemplate=None)
    fig.update_layout(yaxis={'showline': True, 'visible': True, 
                          'range': (0, df["value"].max()*1.1)},
                      xaxis_title='Stocks in portfolio')
    if normalized:
        fig.update_layout(yaxis={'showline': True, 'visible': True, 
                          'range': (0, 100)},
                          yaxis_title="Capital Allocated [%]")
    fig.layout.updatemenus[0].buttons[0].args[1]["transition"]["duration"] = 0

    return fig

plot_allocations(allocations)

# In[89]:


plot_allocations(allocations, normalized=True)

# Let's make functions to plot portfolio valuations and returns with some format:

# In[90]:


def plot_pretty_portfolio_vals(portfolio_valuations, N, c_text, t, window, opt_tech):
    title = "Portfolio Valuation [USD]"
    subtitle = f"<br><sup>Using {c_text} criteria to select the top {N} stocks</sup>"
    subsubtitle = f"<br><sup>with t = {t} , a windows of analysis of {window} weeks and {opt_tech} portfolio optimization</sup>"
    
    price_sp500 = get_returns(SP500_index.loc[portfolio_valuations.index[0]:]).add(1).cumprod().mul(portfolio_valuations.values[0])
    same_dates = sorted(list(set(price_sp500.index).intersection(set(portfolio_valuations.index))))
    sp500_benchmark = price_sp500.loc[same_dates]
    sp500_benchmark.loc[portfolio_valuations.index[0]]  =  portfolio_valuations.values[0] 
    portfolio_valuations.name = "Portfolio"
    
    df = pd.concat([sp500_benchmark, portfolio_valuations], axis = 1)
    fig =  px.line(df, title=title + subtitle + subsubtitle)
    fig.update_yaxes(title="Valuation [$USD]")
    fig.update_xaxes(title="Date")
    return fig

# In[91]:


def plot_pretty_portfolio_rets(returns, N, c_text, t, window, opt_tech):
    title = "Portfolio Returns"
    subtitle = f"<br><sup>Using {c_text} criteria to select the top {N} stocks</sup>"
    subsubtitle = f"<br><sup>with t = {t} , a windows of analysis of {window} weeks and {opt_tech} portfolio optimization</sup>"
    fig = px.line(returns, title=title + subtitle + subsubtitle)
    fig.update_yaxes(title="Return")
    fig.update_xaxes(title="Date")
    return fig

# In[92]:


def plot_pretty_portfolio_allocation(fig, N, c_text, t, window, opt_tech):
    title = "Portfolio Allocation"
    subtitle = f"<br><sup>Using {c_text} criteria to select the top {N} stocks</sup>"
    subsubtitle = f"<br><sup>with t = {t} , a windows of analysis of {window} weeks and {opt_tech} portfolio optimization</sup>"
    fig.update_layout(title=title+subtitle+subsubtitle)
    fig.update_layout(margin=dict(t=100))
    return fig

# # Portfolio Management Strategy Simulator

# Let's remember the algorithm of the portfolio strategy simulator:
#         
#     - Define algorithm hyperparameters
#         
#     - Every chosen weekday (if possible):
#         - Get the top N stocks for the day according to rank by criteria and t
#         - Optimize portfolio weights according to the chosen technique and window
#         - Allocate all available capital (Buy stocks)

# Let's implement the class in the next [Gist](https://gist.github.com/ArtemioPadilla/8a51c7d7945412947a1e6a931dd165c3) that has all the methods shown we need so we can simply define the hyperparameters and then run the simulation.

# The class is the following:

# In[93]:


class PMSS:
    """
    Portfolio Management Strategy Simulator
    """
    def __init__(self, universe, initial_capital, risk_free, opt_tech, criteria, start, end, 
                 t, window, freq = "W-MON", N = 10, 
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
        top_N_stocks = sorted_stocks.iloc[:N]
        return stock_prices_window.loc[:, top_N_stocks.index]
        
    def get_expected_returns(self, returns):
        return self.expected_returns_func(returns)
    
    def get_period_risk_free_rate(self):
        # Get the mean annualized risk free rate for the analysis period
        return self.risk_free[self.start_study_day:self.day]["Risk Free Rate"].mean()
    
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
            port_weights = get_eq_weighted_portfolio(exp_rets)
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
            self.stocks_symbols.append(self.number_of_stocks_owned.keys())
            
    def track_portfolio(self):
        num_of_stocks = self.number_of_stocks_owned.values
        stocks = self.number_of_stocks_owned.keys()
        prices = universe.loc[self.day, stocks]
        capital_distribution = num_of_stocks*prices
        val = pd.Series(num_of_stocks @ prices, index = [self.day])
        self.valuations = self.valuations.append(val)
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
                weights = self.optimize(top_N_stocks)
                # Allocate all available capital (Buy stocks)
                self.buy_stocks(weights, top_N_stocks.columns)
            elif self.show_closed_dates: print(f"Markets were closed on {day}\n")
                
        p_eval = eval_portfolio(get_returns(self.valuations),  p_periods_per_year = 52)
        if track_allocations:
            allocations = self.get_allocations()
        else:
            allocations = None
        return self.valuations, p_eval, allocations

# # Results

# The next slides contain the results of investing 10 million USD dollars using the smart-beta ranking strategy.
# 
# All portfolios select the top 20 companies in the ranking selection process.
# 
# All portfolio strategies start and end at the same date:
# 
# - Start date: First trading day of 2014 - January 6th 2014
# 
# - End date: Last recorded date in dataset - May 2022

# ## Simulation examples

# ### Random Ranking Function

# Let's create a random ranking function to use as a reference:

# In[94]:


def random_ranking_func(prices, t=0):
    return prices.apply(lambda serie: np.random.random())

# In[95]:


random_ranking_func(universe)

# #### 1. Random ranking criteria function, t = 10 days, windows = 16 weeks, top 20 stocks, equally-weighted portfolio

# In[96]:


c_text = "Random" # Pretty plot optimization text
np.random.seed(0) #replicability

universe = universe
initial_capital = 10_000_000
risk_free = risk_free_rate
opt_tech = "EW"
start = "2014-01-01"
end = "2022-06-01"

t = 10 # Days 
window = 16 # Weeks
freq = "W-MON"
N = 20
criteria = random_ranking_func
highest_better = True
track_allocations = True
show_closed_dates = False

max_weight = 2/3
min_weight = 0.01

simulation = PMSS(universe = universe, 
                initial_capital = initial_capital, 
                risk_free = risk_free, 
                opt_tech = opt_tech, 
                start = start, 
                end = end, 
                t = t,
                window = window, 
                freq = freq , 
                N = N, 
                criteria = criteria,       
                highest_better = highest_better, 
                track_allocations = track_allocations,
                show_closed_dates = show_closed_dates,
                min_weight = min_weight,
                max_weight = max_weight
          )

portfolio_valuations, p_eval_1, allocations = simulation.run()

# In[97]:


p_eval_1

# The portfolio valuation over time looked like this:

# In[98]:


portfolio_plot = plot_pretty_portfolio_vals(portfolio_valuations, N, c_text, t, window, opt_tech)

# In[99]:


portfolio_plot

# The portfolio returns over time looked like this:

# In[100]:


portfolio_returns_plot = plot_pretty_portfolio_rets(get_returns(portfolio_valuations), N, c_text, t, window, opt_tech)

# In[101]:


portfolio_returns_plot

# The portfolio allocation looked like this:

# In[102]:


allocations_plot = plot_pretty_portfolio_allocation(plot_allocations(allocations), N, c_text, t, window, opt_tech)

# In[103]:


allocations_plot

# The portfolio allocation looked like this in terms of weights:

# In[104]:


allocations_plot_w = plot_pretty_portfolio_allocation(plot_allocations(allocations, normalized=True), N, c_text, t, window, opt_tech)

# In[105]:


allocations_plot_w

# #### 2. Random ranking function, t = 10 days, window =  16 weeks, top 20 stocks, equally GMV portfolio

# In[106]:


opt_tech = "GMV"
np.random.seed(0) #replicability
highest_better = True

simulation = PMSS(universe = universe, 
                initial_capital = initial_capital, 
                risk_free = risk_free, 
                opt_tech = opt_tech, 
                start = start, 
                end = end, 
                t = t,
                window = window, 
                freq = freq , 
                N = N, 
                criteria = criteria,       
                highest_better = highest_better, 
                track_allocations = track_allocations,
                show_closed_dates = show_closed_dates,
                min_weight = min_weight,
                max_weight = max_weight
          )

portfolio_valuations, p_eval_2, allocations = simulation.run()

# In[107]:


p_eval_2

# The portfolio valuation over time looked like this:

# In[108]:


portfolio_plot = plot_pretty_portfolio_vals(portfolio_valuations, N, c_text, t, window, opt_tech)

# In[109]:


portfolio_plot

# The portfolio returns over time looked like this:

# In[110]:


portfolio_returns_plot = plot_pretty_portfolio_rets(get_returns(portfolio_valuations), N, c_text, t, window, opt_tech)

# In[111]:


portfolio_returns_plot

# The portfolio allocation looked like this:

# In[112]:


allocations_plot = plot_pretty_portfolio_allocation(plot_allocations(allocations), N, c_text, t, window, opt_tech)

# In[113]:


allocations_plot

# The portfolio allocation looked like this in terms of weights:

# In[114]:


allocations_plot_w = plot_pretty_portfolio_allocation(plot_allocations(allocations, normalized=True), N, c_text, t, window, opt_tech)

# In[115]:


allocations_plot_w

# ### Maximum Ranking Function for selection

# #### 3. Maximum momentum, t = 10 days,  window = 16 weeks, top 20 stocks, GMV optimization

# In[116]:


c_text = "Maximum Momentum" # Pretty plot optimization text
opt_tech = "GMV"
criteria = get_latest_momentum
highest_better = True

simulation = PMSS(universe = universe, 
                initial_capital = initial_capital, 
                risk_free = risk_free, 
                opt_tech = opt_tech, 
                start = start, 
                end = end, 
                t = t,
                window = window, 
                freq = freq , 
                N = N, 
                criteria = criteria,       
                highest_better = highest_better, 
                track_allocations = track_allocations,
                show_closed_dates = show_closed_dates,
                min_weight = min_weight,
                max_weight = max_weight
          )

portfolio_valuations, p_eval_3, allocations = simulation.run()

# In[117]:


p_eval_3

# In[118]:


portfolio_plot = plot_pretty_portfolio_vals(portfolio_valuations, N, c_text, t, window, opt_tech)

# The portfolio valuation over time looked like this:

# In[119]:


portfolio_plot

# The portfolio returns over time looked like this:

# In[120]:


portfolio_returns_plot = plot_pretty_portfolio_rets(get_returns(portfolio_valuations), N, c_text, t, window, opt_tech)

# In[121]:


portfolio_returns_plot

# The portfolio allocation looked like this in terms of USD:

# In[122]:


allocations_plot = plot_pretty_portfolio_allocation(plot_allocations(allocations), N, c_text, t, window, opt_tech)

# In[123]:


allocations_plot

# The portfolio allocation looked like this in terms of weights:

# In[124]:


allocations_plot_w = plot_pretty_portfolio_allocation(plot_allocations(allocations, normalized=True), N, c_text, t, window, opt_tech)

# In[125]:


allocations_plot_w

# #### 4. Minimum Momentum

# In[126]:


c_text = "Minimum Momentum" # Pretty plot optimization text
opt_tech = "GMV"
criteria = get_latest_momentum
highest_better = False

simulation = PMSS(universe = universe, 
                initial_capital = initial_capital, 
                risk_free = risk_free, 
                opt_tech = opt_tech, 
                start = start, 
                end = end, 
                t = t,
                window = window, 
                freq = freq , 
                N = N, 
                criteria = criteria,       
                highest_better = highest_better, 
                track_allocations = track_allocations,
                show_closed_dates = show_closed_dates,
                min_weight = min_weight,
                max_weight = max_weight
          )

portfolio_valuations, p_eval_4, allocations = simulation.run()

# In[127]:


p_eval_4

# In[128]:


portfolio_plot = plot_pretty_portfolio_vals(portfolio_valuations, N, c_text, t, window, opt_tech)

# The portfolio valuation over time looked like this:

# In[129]:


portfolio_plot

# The portfolio returns over time looked like this:

# In[130]:


portfolio_returns_plot = plot_pretty_portfolio_rets(get_returns(portfolio_valuations), N, c_text, t, window, opt_tech)

# In[131]:


portfolio_returns_plot

# The portfolio allocation looked like this in terms of USD:

# In[132]:


allocations_plot = plot_pretty_portfolio_allocation(plot_allocations(allocations), N, c_text, t, window, opt_tech)

# In[133]:


allocations_plot

# The portfolio allocation looked like this in terms of weights:

# In[134]:


allocations_plot_w = plot_pretty_portfolio_allocation(plot_allocations(allocations, normalized=True), N, c_text, t, window, opt_tech)

# In[135]:


allocations_plot_w

# #### 5. Maximum Momentum, t = 10 days,  window = 16 weeks, top 20 stocks, MSR portfolio

# In[136]:


c_text = "Maximum Momentum"
opt_tech = "MSR"
highest_better = True

simulation = PMSS(universe = universe, 
                initial_capital = initial_capital, 
                risk_free = risk_free, 
                opt_tech = opt_tech, 
                start = start, 
                end = end, 
                t = t,
                window = window, 
                freq = freq , 
                N = N, 
                criteria = criteria,       
                highest_better = highest_better, 
                track_allocations = track_allocations,
                show_closed_dates = show_closed_dates,
                min_weight = min_weight,
                max_weight = max_weight
          )

portfolio_valuations, p_eval_5, allocations = simulation.run()

# In[137]:


p_eval_5

# The portfolio valuation over time looked like this:

# In[138]:


portfolio_plot = plot_pretty_portfolio_vals(portfolio_valuations, N, c_text, t, window, opt_tech)

# In[139]:


portfolio_plot

# The portfolio returns over time looked like this:

# In[140]:


portfolio_returns_plot = plot_pretty_portfolio_rets(get_returns(portfolio_valuations), N, c_text, t, window, opt_tech)

# In[141]:


portfolio_returns_plot

# The portfolio allocation looked like this:

# In[142]:


allocations_plot = plot_pretty_portfolio_allocation(plot_allocations(allocations), N, c_text, t, window, opt_tech)

# In[143]:


allocations_plot

# The portfolio allocation looked like this in terms of weights:

# In[144]:


allocations_plot_w = plot_pretty_portfolio_allocation(plot_allocations(allocations, normalized=True), N, c_text, t, window, opt_tech)

# In[145]:


allocations_plot_w

# #### 6. Minimum Momentum

# In[146]:


c_text = "Minimum Momentum"
opt_tech = "MSR"
highest_better = False

simulation = PMSS(universe = universe, 
                initial_capital = initial_capital, 
                risk_free = risk_free, 
                opt_tech = opt_tech, 
                start = start, 
                end = end, 
                t = t,
                window = window, 
                freq = freq , 
                N = N, 
                criteria = criteria,       
                highest_better = highest_better, 
                track_allocations = track_allocations,
                show_closed_dates = show_closed_dates,
                min_weight = min_weight,
                max_weight = max_weight
          )

portfolio_valuations, p_eval_6, allocations = simulation.run()

# In[147]:


p_eval_6

# The portfolio valuation over time looked like this:

# In[148]:


portfolio_plot = plot_pretty_portfolio_vals(portfolio_valuations, N, c_text, t, window, opt_tech)

# In[149]:


portfolio_plot

# The portfolio returns over time looked like this:

# In[150]:


portfolio_returns_plot = plot_pretty_portfolio_rets(get_returns(portfolio_valuations), N, c_text, t, window, opt_tech)

# In[151]:


portfolio_returns_plot

# The portfolio allocation looked like this:

# In[152]:


allocations_plot = plot_pretty_portfolio_allocation(plot_allocations(allocations), N, c_text, t, window, opt_tech)

# In[153]:


allocations_plot

# The portfolio allocation looked like this in terms of weights:

# In[154]:


allocations_plot_w = plot_pretty_portfolio_allocation(plot_allocations(allocations, normalized=True), N, c_text, t, window, opt_tech)

# In[155]:


allocations_plot_w

# ### VaR Ranking Function for selection

# #### 7. Minimum VaR, t = 252 days,  window = 16 weeks, top 20 stocks, MSR portfolio

# In[156]:


c_text = "Minimum VaR"
t = 252
criteria = var_historic_from_prices
highest_better = False

simulation = PMSS(universe = universe, 
                initial_capital = initial_capital, 
                risk_free = risk_free, 
                opt_tech = opt_tech, 
                start = start, 
                end = end, 
                t = t,
                window = window, 
                freq = freq , 
                N = N, 
                criteria = criteria,       
                highest_better = highest_better, 
                track_allocations = track_allocations,
                show_closed_dates = show_closed_dates,
                min_weight = min_weight,
                max_weight = max_weight
          )

portfolio_valuations, p_eval_7, allocations = simulation.run()

# In[157]:


p_eval_5

# The portfolio valuation over time looked like this:

# In[158]:


portfolio_plot = plot_pretty_portfolio_vals(portfolio_valuations, N, c_text, t, window, opt_tech)

# In[159]:


portfolio_plot

# The portfolio returns over time looked like this:

# In[160]:


portfolio_returns_plot = plot_pretty_portfolio_rets(get_returns(portfolio_valuations), N, c_text, t, window, opt_tech)

# In[161]:


portfolio_returns_plot

# The portfolio allocations looked like this:

# In[162]:


allocations_plot = plot_pretty_portfolio_allocation(plot_allocations(allocations), N, c_text, t, window, opt_tech)

# In[163]:


allocations_plot

# The portfolio allocations looked like this in terms of weights:

# In[164]:


allocations_plot_w = plot_pretty_portfolio_allocation(plot_allocations(allocations, normalized=True), N, c_text, t, window, opt_tech)

# In[165]:


allocations_plot_w

# #### 8. Maximum Historic VaR

# In[166]:


highest_better = True
c_text = "Maximum VaR"

simulation = PMSS(universe = universe, 
                initial_capital = initial_capital, 
                risk_free = risk_free, 
                opt_tech = opt_tech, 
                start = start, 
                end = end, 
                t = t,
                window = window, 
                freq = freq , 
                N = N, 
                criteria = criteria,       
                highest_better = highest_better, 
                track_allocations = track_allocations,
                show_closed_dates = show_closed_dates,
                min_weight = min_weight,
                max_weight = max_weight
          )

portfolio_valuations, p_eval_8, allocations = simulation.run()

# In[167]:


p_eval_8

# The portfolio valuation over time looked like this:

# In[168]:


portfolio_plot = plot_pretty_portfolio_vals(portfolio_valuations, N, c_text, t, window, opt_tech)

# In[169]:


portfolio_plot

# The portfolio returns over time looked like this:

# In[170]:


portfolio_returns_plot = plot_pretty_portfolio_rets(get_returns(portfolio_valuations), N, c_text, t, window, opt_tech)

# In[171]:


portfolio_returns_plot

# The portfolio allocations looked like this:

# In[172]:


allocations_plot = plot_pretty_portfolio_allocation(plot_allocations(allocations), N, c_text, t, window, opt_tech)

# In[173]:


allocations_plot

# The portfolio allocations looked like this in terms of weights:

# In[174]:


allocations_plot_w = plot_pretty_portfolio_allocation(plot_allocations(allocations, normalized=True), N, c_text, t, window, opt_tech)

# In[175]:


allocations_plot_w

# Analyzing the portfolio behavior with respect to the dramatic valuation spike from 2020 to the present we can see that the portfolio invertedly heavily in Moderna MRN at the begining of the pandemic. This company had a drastic stock value increase and during the pandemic for being one of the top USA COVID vaccine manufacturers and the portfolio manage to take advantage of this.

# In[176]:


moderna = px.line(universe.loc["2019":,["MRNA"]], title="Moderna [MRNA] stock valuation from 2020 to May 2022")
moderna.update_yaxes(title='Stock Valuation [USD]');

# In[177]:


moderna

# We can also see that is the last past weeks, since early March 2022, the portfolio invested heavily in Occidental Petroleum Corporation [OXY], which is having a value appreciation because of the war.

# In[194]:


oxy = px.line(universe.loc["2022":,["OXY"]], title="Occidental Petroleum Corporation [OXY] stock valuation from 2022 to May 2022")
oxy.update_yaxes(title='Stock Valuation [USD]');

# In[195]:


oxy

# #### 9. Maximum Historic VaR - Equally Weighted Portfolio

# In[180]:


highest_better = True
c_text = "Maximum VaR"
opt_tech = "EW"

simulation = PMSS(universe = universe, 
                initial_capital = initial_capital, 
                risk_free = risk_free, 
                opt_tech = opt_tech, 
                start = start, 
                end = end, 
                t = t,
                window = window, 
                freq = freq , 
                N = N, 
                criteria = criteria,       
                highest_better = highest_better, 
                track_allocations = track_allocations,
                show_closed_dates = show_closed_dates,
                min_weight = min_weight,
                max_weight = max_weight
          )

portfolio_valuations, p_eval_9, allocations = simulation.run()

# In[181]:


p_eval_9

# The portfolio valuation over time looked like this:

# In[182]:


portfolio_plot = plot_pretty_portfolio_vals(portfolio_valuations, N, c_text, t, window, opt_tech)

# In[183]:


portfolio_plot

# We can see that only by choosing the assets in this way we are getting a much higher return than the market yet the MSR improved the portfolio valuation.

# The portfolio returns over time looked like this:

# In[184]:


portfolio_returns_plot = plot_pretty_portfolio_rets(get_returns(portfolio_valuations), N, c_text, t, window, opt_tech)

# In[185]:


portfolio_returns_plot

# The portfolio allocations looked like this:

# In[186]:


allocations_plot = plot_pretty_portfolio_allocation(plot_allocations(allocations), N, c_text, t, window, opt_tech)

# In[187]:


allocations_plot

# The portfolio allocations looked like this in terms of weights:

# In[188]:


allocations_plot_w = plot_pretty_portfolio_allocation(plot_allocations(allocations, normalized=True), N, c_text, t, window, opt_tech)

# In[189]:


allocations_plot_w

# ### Aggregated Results

# In[191]:


def get_strategies_comparisons(strategies_evaluations, rank_funcs, optimizations):
    """"To be a valid comparison strategies have been active in the same days"""
    df = pd.DataFrame()
    for idx, s in enumerate(strategies_evaluations):
        to_append = s["Portfolio"]
        to_append.name = "Portfolio " + str(idx+1)                                        
        df = pd.concat([df, to_append], axis=1)
    df = pd.concat([df, s["S&P500 Benchmark"],s["RFR Benchmark"]], axis=1)
    df.loc["Sharpe Ratio"] = df.loc["Return"]/df.loc["Volatility"]
    df.loc["Sortino Ratio"] = df.loc["Return"]/df.loc["Semideviation"]
    df.loc["Alpha"] = df.loc["Return"] - df.loc["Return","RFR Benchmark"]
    df.columns.name = "Annualized Average"
    df.index.name = strategies_evaluations[0].index.name
    df = df.T
    df.loc[:, "Ranking Function"] = rank_funcs
    df.loc[:, "Optimization"] = optimizations
    df = df.loc[:, ["Ranking Function", "Optimization", "Return", "Alpha", "Volatility", 
                    "Semideviation", "Sharpe Ratio", "Sortino Ratio"]]
    df.loc["RFR Benchmark", "Sortino Ratio"] = None
    df.loc["RFR Benchmark", "Sharpe Ratio"] = None
    df.loc[:,"Return Diff. with S&P500"] = df.loc[:,"Return"] -  df.loc["S&P500 Benchmark","Return"]
    df.loc[:,"Volatility Diff. with S&P500"] = df.loc[:,"Volatility"] -  df.loc["S&P500 Benchmark","Volatility"]
    df.loc[:,"Semideviation Diff. with S&P500"] = df.loc[:,"Semideviation"] -  df.loc["S&P500 Benchmark","Semideviation"]
    return df.sort_values("Sortino Ratio", ascending=False)

rank_funcs = ["Random", "Random",
              "MaxMomentum", "MinMomentum", 
              "MaxMomentum", "MinMomentum", 
              "MinVaR", "MaxVaR", "MaxVaR",
             None, None # Benchmarks
             ]
optimizations = ["Eq Weighted", "GMV",
                 "GMV", "GMV", 
                 "MSR", "MSR", 
                 "MSR", "MSR", "Eq Weighted",
                None, None # Benchmarks
                ]

strategies_evaluations = [p_eval_1, p_eval_2, p_eval_3, p_eval_4, p_eval_5, 
                          p_eval_6, p_eval_7, p_eval_8, p_eval_9]

# The overall result table for annualized returns, volatilities and ratios is:

# In[192]:


def _color_red_or_green(val):
    if isinstance(val, float):
        color = 'red' if val < 0 else 'green'
        return 'background-color: %s' % "red"
    else:
        return None

res = get_strategies_comparisons(strategies_evaluations, rank_funcs, optimizations)
results_table = res.iloc[:,:].style.background_gradient(cmap = "RdYlGn", axis=0, vmin=-.75, vmax=0.75)  

# In[193]:


results_table

# From the table we can see that contrary to the first impression, the maximum momentum was worst than the minimum momentum and that the maximum VaR was better than the minimum VaR. Remember that for the momentum ranking function $t=10$ while for the VaR ranking function $t=252$.

# I have to confess I didn't expect to have these results. I hypothesized that bigger momentum or minimum VaR were going to be the best portfolios. I didn't even intend to implement simulation for minimum momentum or maximum VaR, yet after trying, viewing the results, and double-checking my implementation I was very surprised that these portfolios were the most profitable.
# 
# After some thought my explication for these results is that maybe allocating capital to maximum momentum companies in the last 10 days didn't capture the same increment in the future, while by investing in companies that had recent prices losses we profited from regressions to the mean of the price.
# 
# A similar phenomenon may explain why investing in companies with a high historic VaR in the past year was profitable as these companies had recent high negative returns and the algorithm take advange of market corrections.

# # Conclusions

# This project presents a portfolio management strategy simulator inspired by smart-beta strategies and ranking selection. 
# 
# The simulator that this project presents is based on periodically ranking the top N stocks of a universe of possible assets and constructing a portfolio with them. The ranking function can be created ad-hoc or can be one of many popular metrics.
# 
# This project presents the implementation of a versatile portfolio strategy and its simulation. The simulator can be tuned with many user-defined hyperparameters.
# 
# This project has explored only 3 ranking functions so far. Many others may provide a better signal for asset selection.

# This project implemented three different portfolio optimization techniques, including the equally weighted portfolio, Maximum Sortino Ratio, and Minimum Global Volatility portfolios.
# 
# By letting the user choose which optimization technique it wants to use this implementation provides an additional grade of versatility.

# The simulator put to the test 8 different portfolio management strategies. 
# 
# The higher return portfolio had an excess return above the S&P500 average of 42% and had 30% more volatility. Nonetheless, this portfolio only had twice as much semideviation as the S&P500.
# 
# 
# Investing in stocks with a recent minimum momentum and a maximum historic VaR resulted in better portfolio returns.

# Since the explicability of the decision making in portfolio management and understanding of portfolio behavior are two great qualities in investing this implementation follows clear rules for the selection and allocation of assets.
# 
# This implementation also provides historic data on how the allocation of capital would have been in the strategy.

# # Future Work

# - This project uses a simple factor approach to rank the assets, yet in the future, more complex ranking functions that provide a multifactorial approach could be implemented, such as neural networks that could take into account a variety of technical, economical, and fundamental data.
# 
# - Expected returns, which are used in MSR portfolio optimizations are currently based on historic data. Other more robust forms of returns estimations can be implemented
# 
# - Implementation of other ranking functions is easy, therefore, other ranking functions, such as some risk metrics or ranking functions that take into account fundamental analysis can be relatively quickly implemented.

# - This project can be used to grid search for the best hyperparameters, ranking functions, and portfolio optimization techniques. In this way, one could explore how different combinations could interact in the portfolio behavior. This process can be accelerated using parallel computing.
# 
# - Other constraints could be applied for constraining stock selection such as maximum volatility, an industry area max capitalization, etc.
# 
# - To speed up the implementation we could change Pandas to pure NumPy. A difficulty for this is greatly the dependence on Pandas DateTimeIndex.
# 
# - Reduce the assumptions made to model portfolio behavior

# # References

# - [Investment Management with Python and Machine Learning - EDHEC Business School - Coursera Specialization](https://www.coursera.org/specializations/investment-management-python-machine-learning)
# - [What is Smart Beta? - Corporate Finance Institute](https://corporatefinanceinstitute.com/resources/knowledge/trading-investing/smart-beta/)
# - [What is factor investing? - Black Rock](https://www.blackrock.com/us/individual/investment-ideas/what-is-factor-investing)
# - [Nifty 200 Momentum 30](https://www.niftyindices.com/indices/equity/strategy-indices/nifty200-momentum-30)
# - [Sustainable investing - Black Rock](https://www.blackrock.com/us/individual/investment-ideas/sustainable-investing)
# 
# - [Dynamics of Ranking - Nature Communications - Iñuiguez et at - 2022](https://www.nature.com/articles/s41467-022-29256-x#:~:text=Rankings%20reduce%20complex%20systems%20to,temporal%20rank%20data%20is%20aggregated.)
# - [NFL's top 100 player rankings - NFL](https://www.nfl.com/network/shows/nfl-top-100)
# - [List of most followed Instragram accounts - Instagram](https://en.wikipedia.org/wiki/List_of_most-followed_Instagram_accounts)
# - [World's Billionaires List - Forbes](https://www.forbes.com/billionaires/)
# - [S&P500 - Investopedia](https://www.investopedia.com/terms/s/sp500.asp)
# - [S&P500 - S&P Global](https://www.spglobal.com/spdji/es/indices/equity/sp-500/#overview)
# - [S&P500 companies - Datahub](https://datahub.io/core/s-and-p-500-companies)
# - [Alpha Vantage](https://www.alphavantage.co/)

# - [Selected Interest Rates (Daily) H.15 - FED](https://www.federalreserve.gov/releases/H15/default.htm)
# - [Top 10 component companies of the S&P 500 - Investopedia](https://www.investopedia.com/top-10-s-and-p-500-stocks-by-index-weight-4843111)
# 
# - [Understanding Parametric Tests, Skewness, and Kurtosis - Robert Keim - All About Circuits - 2020](https://www.allaboutcircuits.com/technical-articles/understanding-the-normal-distribution-parametric-tests-skewness-and-kurtosis/)
# - [Kurtosis (K) - vose software](https://www.vosesoftware.com/riskwiki/Kurtosis(K).php)
# - [Momentum Indicates Stock Price Strength - Investopedia](https://www.investopedia.com/articles/technical/081501.asp)
