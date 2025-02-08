import plotly.express as px

def plot_portfolio_valuation(valuation):
    return px.line(valuation, title="Evolución del Portafolio", labels={"value": "USD", "index": "Fecha"})
