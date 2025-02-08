# setup.py
from setuptools import setup, find_packages

setup(
    name="pmt",
    version="1.0",
    packages=find_packages(),
    install_requires=[
        "numpy",
        "pandas",
        "scipy",
        "yfinance",
        "requests",
        "plotly"  # Optional, if you plan to include visualization functions
    ],
    author="Your Name",
    description="Library for simulation and live trading with backtesting capabilities",
)
