"""技术指标计算与买卖信号生成."""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

import numpy as np
import pandas as pd


@dataclass
class StockSignal:
    code: str
    name: str
    market: str  # "A" or "US"
    last_close: float
    prev_close: float
    change_pct: float
    ma: dict          # {5: 12.3, 10: 12.1, ...}
    rsi: float
    macd: float
    macd_signal: float
    macd_hist: float
    volume_ratio: float  # 当日成交量 / 5日均量
    signals: List[str]   # 文字信号: "金叉", "RSI 超卖", ...
    trend: str           # "看多" / "看空" / "震荡"


def _ema(series: pd.Series, span: int) -> pd.Series:
    return series.ewm(span=span, adjust=False).mean()


def _rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1 / period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / period, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def _macd(close: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    ema_fast = _ema(close, fast)
    ema_slow = _ema(close, slow)
    macd_line = ema_fast - ema_slow
    signal_line = _ema(macd_line, signal)
    hist = macd_line - signal_line
    return macd_line, signal_line, hist


def analyze(
    df: pd.DataFrame,
    code: str,
    name: str,
    market: str,
    ma_periods: List[int],
    rsi_period: int = 14,
    rsi_oversold: float = 30,
    rsi_overbought: float = 70,
    change_alert_pct: float = 5.0,
) -> Optional[StockSignal]:
    if df is None or len(df) < max(ma_periods + [26]):
        return None

    close = df["close"].astype(float)
    volume = df["volume"].astype(float)

    # MA
    ma_dict = {p: float(close.rolling(p).mean().iloc[-1]) for p in ma_periods}

    # RSI
    rsi_series = _rsi(close, rsi_period)
    rsi_val = float(rsi_series.iloc[-1])

    # MACD
    macd_line, signal_line, hist = _macd(close)
    macd_val = float(macd_line.iloc[-1])
    sig_val = float(signal_line.iloc[-1])
    hist_val = float(hist.iloc[-1])
    prev_hist = float(hist.iloc[-2])

    # 价格 / 涨跌
    last_close = float(close.iloc[-1])
    prev_close = float(close.iloc[-2])
    change_pct = (last_close - prev_close) / prev_close * 100 if prev_close else 0.0

    # 量比
    avg_vol5 = float(volume.tail(6).iloc[:-1].mean()) if len(volume) >= 6 else float(volume.mean())
    vol_ratio = float(volume.iloc[-1] / avg_vol5) if avg_vol5 else 0.0

    # 信号
    signals: List[str] = []
    if rsi_val <= rsi_oversold:
        signals.append(f"RSI 超卖({rsi_val:.1f})")
    elif rsi_val >= rsi_overbought:
        signals.append(f"RSI 超买({rsi_val:.1f})")

    if prev_hist <= 0 < hist_val:
        signals.append("MACD 金叉")
    elif prev_hist >= 0 > hist_val:
        signals.append("MACD 死叉")

    if 5 in ma_dict and 20 in ma_dict:
        if last_close > ma_dict[5] > ma_dict[20]:
            signals.append("多头排列")
        elif last_close < ma_dict[5] < ma_dict[20]:
            signals.append("空头排列")

    if abs(change_pct) >= change_alert_pct:
        signals.append(f"{'大涨' if change_pct > 0 else '大跌'} {change_pct:+.2f}%")

    if vol_ratio >= 2.0:
        signals.append(f"放量({vol_ratio:.1f}x)")

    # 综合趋势判定
    bull_score = sum(s in signals for s in ("多头排列", "MACD 金叉")) + (1 if rsi_val > 50 else 0)
    bear_score = sum(s in signals for s in ("空头排列", "MACD 死叉")) + (1 if rsi_val < 50 else 0)
    if bull_score >= 2 and bull_score > bear_score:
        trend = "看多"
    elif bear_score >= 2 and bear_score > bull_score:
        trend = "看空"
    else:
        trend = "震荡"

    return StockSignal(
        code=code,
        name=name,
        market=market,
        last_close=last_close,
        prev_close=prev_close,
        change_pct=change_pct,
        ma=ma_dict,
        rsi=rsi_val,
        macd=macd_val,
        macd_signal=sig_val,
        macd_hist=hist_val,
        volume_ratio=vol_ratio,
        signals=signals,
        trend=trend,
    )
