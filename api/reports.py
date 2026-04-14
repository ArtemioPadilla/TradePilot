"""
TradePilot PDF Report Generation

Generates portfolio summary, performance, and holdings detail reports using reportlab.
"""

import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)
from reportlab.graphics.shapes import Drawing, String
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.lineplots import LinePlot
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.widgets.markers import makeMarker


# --- Branding ---

BRAND_COLOR = colors.HexColor("#6366f1")
BRAND_DARK = colors.HexColor("#4f46e5")
ACCENT_GREEN = colors.HexColor("#16a34a")
ACCENT_RED = colors.HexColor("#dc2626")
LIGHT_BG = colors.HexColor("#f8f9fa")


def _get_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        "BrandTitle",
        parent=styles["Title"],
        textColor=BRAND_COLOR,
        fontSize=22,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        textColor=BRAND_DARK,
        fontSize=14,
        spaceBefore=16,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        textColor=colors.gray,
        fontSize=10,
        spaceAfter=12,
    ))
    styles.add(ParagraphStyle(
        "MetricLabel",
        parent=styles["Normal"],
        textColor=colors.gray,
        fontSize=9,
    ))
    styles.add(ParagraphStyle(
        "MetricValue",
        parent=styles["Normal"],
        textColor=colors.black,
        fontSize=12,
        fontName="Helvetica-Bold",
    ))
    return styles


def _header(styles, title: str, date_range: dict | None = None):
    """Return common header elements."""
    elements = []
    elements.append(Paragraph("TradePilot", styles["BrandTitle"]))
    elements.append(Paragraph(title, styles["Heading1"]))
    if date_range:
        start = date_range.get("start", "N/A")
        end = date_range.get("end", "N/A")
        elements.append(Paragraph(f"Period: {start} to {end}", styles["Subtitle"]))
    elements.append(Paragraph(
        f"Generated: {datetime.now().strftime('%B %d, %Y %I:%M %p')}",
        styles["Subtitle"],
    ))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_COLOR))
    elements.append(Spacer(1, 12))
    return elements


def _metrics_table(metrics: dict):
    """Build a horizontal metrics summary table."""
    labels = list(metrics.keys())
    values = list(metrics.values())
    data = [labels, values]
    t = Table(data, colWidths=[1.8 * inch] * len(labels))
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_BG),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.gray),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("FONTSIZE", (0, 1), (-1, 1), 12),
        ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def _pie_chart(data: dict, width=300, height=200):
    """Create a pie chart drawing from {label: value} dict."""
    drawing = Drawing(width, height)
    pie = Pie()
    pie.x = 50
    pie.y = 20
    pie.width = 120
    pie.height = 120
    pie.data = list(data.values())
    pie.labels = [f"{k} ({v:.1f}%)" for k, v in data.items()]
    color_palette = [
        BRAND_COLOR, BRAND_DARK, ACCENT_GREEN,
        colors.HexColor("#f59e0b"), colors.HexColor("#06b6d4"),
        colors.HexColor("#8b5cf6"), colors.HexColor("#ec4899"),
        colors.HexColor("#64748b"), colors.HexColor("#84cc16"),
        colors.HexColor("#f97316"),
    ]
    for i in range(len(data)):
        pie.slices[i].fillColor = color_palette[i % len(color_palette)]
        pie.slices[i].strokeWidth = 0.5
    drawing.add(pie)
    return drawing


def _holdings_table(holdings: list[dict]):
    """Build a holdings detail table."""
    header = ["Symbol", "Shares", "Price", "Value", "Weight %", "P&L"]
    rows = [header]
    for h in holdings:
        pnl = h.get("unrealized_pnl", 0)
        pnl_str = f"${pnl:,.2f}" if pnl >= 0 else f"-${abs(pnl):,.2f}"
        rows.append([
            h.get("symbol", ""),
            f"{h.get('shares', 0):,.2f}",
            f"${h.get('price', 0):,.2f}",
            f"${h.get('value', 0):,.2f}",
            f"{h.get('weight', 0):.1f}%",
            pnl_str,
        ])
    t = Table(rows, colWidths=[1.0 * inch, 0.8 * inch, 0.9 * inch, 1.1 * inch, 0.9 * inch, 1.1 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_COLOR),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def _equity_curve(values: list[dict], width=450, height=200):
    """Draw an equity curve line chart from [{date, value}, ...]."""
    if not values:
        return Spacer(1, 12)
    drawing = Drawing(width, height)
    lp = LinePlot()
    lp.x = 50
    lp.y = 30
    lp.width = width - 80
    lp.height = height - 60
    lp.data = [[(i, v["value"]) for i, v in enumerate(values)]]
    lp.lines[0].strokeColor = BRAND_COLOR
    lp.lines[0].strokeWidth = 2
    lp.xValueAxis.labels.fontSize = 7
    lp.yValueAxis.labels.fontSize = 7
    lp.yValueAxis.labelTextFormat = "$%0.0f"
    drawing.add(lp)
    return drawing


def _monthly_returns_table(monthly_returns: list[dict]):
    """Build a monthly returns table."""
    header = ["Month", "Return %", "Benchmark %", "Alpha"]
    rows = [header]
    for m in monthly_returns:
        ret = m.get("return_pct", 0)
        bench = m.get("benchmark_pct", 0)
        alpha = ret - bench
        rows.append([
            m.get("month", ""),
            f"{ret:+.2f}%",
            f"{bench:+.2f}%",
            f"{alpha:+.2f}%",
        ])
    t = Table(rows, colWidths=[1.5 * inch, 1.2 * inch, 1.2 * inch, 1.2 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_COLOR),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


# ============================================================================
# Public API — report generators
# ============================================================================

def generate_portfolio_report(
    portfolio_value: float = 100000,
    date_range: dict | None = None,
    holdings: list[dict] | None = None,
    allocation: dict | None = None,
    metrics: dict | None = None,
) -> bytes:
    """Generate a Portfolio Summary PDF report.

    Returns the PDF as bytes.
    """
    date_range = date_range or {"start": "2025-01-01", "end": "2025-12-31"}
    holdings = holdings or [
        {"symbol": "AAPL", "shares": 50, "price": 185.0, "value": 9250, "weight": 18.5, "unrealized_pnl": 750},
        {"symbol": "MSFT", "shares": 30, "price": 380.0, "value": 11400, "weight": 22.8, "unrealized_pnl": 1200},
        {"symbol": "GOOGL", "shares": 25, "price": 140.0, "value": 3500, "weight": 7.0, "unrealized_pnl": -200},
        {"symbol": "NVDA", "shares": 20, "price": 450.0, "value": 9000, "weight": 18.0, "unrealized_pnl": 3000},
        {"symbol": "JPM", "shares": 40, "price": 195.0, "value": 7800, "weight": 15.6, "unrealized_pnl": 500},
    ]
    allocation = allocation or {
        "Technology": 48.3,
        "Financials": 15.6,
        "Healthcare": 12.0,
        "Consumer": 14.1,
        "Other": 10.0,
    }
    metrics = metrics or {
        "Total Value": f"${portfolio_value:,.2f}",
        "Return": "+12.4%",
        "Sharpe": "1.32",
        "Max DD": "-8.5%",
    }

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, topMargin=0.5 * inch, bottomMargin=0.5 * inch)
    styles = _get_styles()
    story = []

    # Header
    story.extend(_header(styles, "Portfolio Summary Report", date_range))

    # Metrics
    story.append(Paragraph("Performance Metrics", styles["SectionHeader"]))
    story.append(_metrics_table(metrics))
    story.append(Spacer(1, 16))

    # Asset Allocation Pie
    story.append(Paragraph("Asset Allocation", styles["SectionHeader"]))
    story.append(_pie_chart(allocation))
    story.append(Spacer(1, 16))

    # Top Holdings
    story.append(Paragraph("Top Holdings", styles["SectionHeader"]))
    story.append(_holdings_table(holdings))

    doc.build(story)
    return buf.getvalue()


def generate_performance_report(
    date_range: dict | None = None,
    equity_curve: list[dict] | None = None,
    monthly_returns: list[dict] | None = None,
    metrics: dict | None = None,
) -> bytes:
    """Generate a Performance PDF report with equity curve and monthly returns.

    Returns the PDF as bytes.
    """
    date_range = date_range or {"start": "2025-01-01", "end": "2025-12-31"}
    equity_curve = equity_curve or [
        {"date": f"2025-{m:02d}-01", "value": 100000 + i * 1200 + (i % 3) * 500}
        for i, m in enumerate(range(1, 13))
    ]
    monthly_returns = monthly_returns or [
        {"month": f"2025-{m:02d}", "return_pct": 1.2 + (m % 3) * 0.5 - (m % 5) * 0.8, "benchmark_pct": 0.9 + (m % 4) * 0.3}
        for m in range(1, 13)
    ]
    metrics = metrics or {
        "Ann. Return": "+14.2%",
        "Sharpe": "1.45",
        "Max DD": "-7.3%",
        "Volatility": "12.8%",
        "Beta": "0.95",
    }

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, topMargin=0.5 * inch, bottomMargin=0.5 * inch)
    styles = _get_styles()
    story = []

    story.extend(_header(styles, "Performance Report", date_range))

    # Metrics
    story.append(Paragraph("Risk & Return Metrics", styles["SectionHeader"]))
    story.append(_metrics_table(metrics))
    story.append(Spacer(1, 16))

    # Equity Curve
    story.append(Paragraph("Equity Curve", styles["SectionHeader"]))
    story.append(_equity_curve(equity_curve))
    story.append(Spacer(1, 16))

    # Monthly Returns
    story.append(Paragraph("Monthly Returns", styles["SectionHeader"]))
    story.append(_monthly_returns_table(monthly_returns))

    doc.build(story)
    return buf.getvalue()


def generate_holdings_report(
    holdings: list[dict] | None = None,
    sector_breakdown: dict | None = None,
) -> bytes:
    """Generate a Holdings Detail PDF report.

    Returns the PDF as bytes.
    """
    holdings = holdings or [
        {"symbol": "AAPL", "shares": 50, "price": 185.0, "value": 9250, "weight": 18.5, "cost_basis": 170.0, "unrealized_pnl": 750},
        {"symbol": "MSFT", "shares": 30, "price": 380.0, "value": 11400, "weight": 22.8, "cost_basis": 340.0, "unrealized_pnl": 1200},
        {"symbol": "GOOGL", "shares": 25, "price": 140.0, "value": 3500, "weight": 7.0, "cost_basis": 148.0, "unrealized_pnl": -200},
        {"symbol": "NVDA", "shares": 20, "price": 450.0, "value": 9000, "weight": 18.0, "cost_basis": 300.0, "unrealized_pnl": 3000},
        {"symbol": "JPM", "shares": 40, "price": 195.0, "value": 7800, "weight": 15.6, "cost_basis": 182.5, "unrealized_pnl": 500},
    ]
    sector_breakdown = sector_breakdown or {
        "Technology": 48.3,
        "Financials": 15.6,
        "Healthcare": 12.0,
        "Consumer Disc.": 14.1,
        "Energy": 10.0,
    }

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, topMargin=0.5 * inch, bottomMargin=0.5 * inch)
    styles = _get_styles()
    story = []

    story.extend(_header(styles, "Holdings Detail Report"))

    # Detailed holdings with cost basis
    story.append(Paragraph("All Positions", styles["SectionHeader"]))
    header = ["Symbol", "Shares", "Price", "Cost Basis", "Value", "Weight", "Unrealized P&L"]
    rows = [header]
    for h in holdings:
        pnl = h.get("unrealized_pnl", 0)
        pnl_str = f"${pnl:,.2f}" if pnl >= 0 else f"-${abs(pnl):,.2f}"
        rows.append([
            h.get("symbol", ""),
            f"{h.get('shares', 0):,.2f}",
            f"${h.get('price', 0):,.2f}",
            f"${h.get('cost_basis', 0):,.2f}",
            f"${h.get('value', 0):,.2f}",
            f"{h.get('weight', 0):.1f}%",
            pnl_str,
        ])
    t = Table(rows, colWidths=[0.8 * inch, 0.7 * inch, 0.8 * inch, 0.9 * inch, 0.9 * inch, 0.7 * inch, 1.0 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_COLOR),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t)
    story.append(Spacer(1, 20))

    # Sector Breakdown
    story.append(Paragraph("Sector Breakdown", styles["SectionHeader"]))
    story.append(_pie_chart(sector_breakdown))

    doc.build(story)
    return buf.getvalue()


# Map report type names to generator functions
REPORT_GENERATORS = {
    "portfolio_summary": generate_portfolio_report,
    "performance": generate_performance_report,
    "holdings_detail": generate_holdings_report,
}
