"""股票行情数据拉取: A 股 (akshare) + 美股 (yfinance)"""
from __future__ import annotations

import logging
import os
import time
from datetime import datetime, timedelta
from typing import Optional

import pandas as pd

logger = logging.getLogger(__name__)


def _retry(fn, *, retries: int = 3, delay: float = 2.0, label: str = ""):
    last_exc = None
    for i in range(retries):
        try:
            return fn()
        except Exception as exc:  # noqa: BLE001
            last_exc = exc
            logger.warning("%s 第 %d/%d 次失败: %s", label, i + 1, retries, exc)
            time.sleep(delay * (i + 1))
    if last_exc:
        logger.error("%s 重试耗尽: %s", label, last_exc)
    return None


def _is_etf_code(code: str) -> bool:
    """根据代码前缀判断是否为 ETF / 基金.

    沪市 ETF: 5xxxxx (如 510950, 588000, 513000)
    深市 ETF: 159xxx (如 159941, 159971, 159509)
    LOF 等其他基金也这些前缀为主
    """
    if not code:
        return False
    return code.startswith("5") or code.startswith("159") or code.startswith("15")


def _normalize_kline(df: pd.DataFrame, lookback_days: int) -> Optional[pd.DataFrame]:
    """统一列名 / 排序 / 截取 lookback_days."""
    if df is None or df.empty:
        return None
    rename_map = {
        "日期": "date",
        "开盘": "open",
        "最高": "high",
        "最低": "low",
        "收盘": "close",
        "成交量": "volume",
    }
    df = df.rename(columns=rename_map)
    needed = ["date", "open", "high", "low", "close", "volume"]
    df = df[[c for c in needed if c in df.columns]].copy()
    if "date" not in df.columns or len(df) == 0:
        return None
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)
    return df.tail(lookback_days).reset_index(drop=True)


def _sina_symbol(code: str) -> str:
    """将 6 位代码转换为新浪格式: sh600519 / sz000001."""
    if code.startswith("6") or code.startswith("5"):
        return f"sh{code}"
    return f"sz{code}"


def fetch_a_share(code: str, lookback_days: int = 120) -> Optional[pd.DataFrame]:
    """拉取 A 股 / ETF 历史日 K 线 (前复权).

    三级 fallback:
      1. 东财 (境内快, GitHub Actions 可能被屏蔽)
      2. 新浪 (境外可达, 通用 fallback)
    返回 DataFrame 列: date, open, high, low, close, volume
    """
    try:
        import akshare as ak
    except ImportError:
        logger.error("akshare 未安装, 请: pip install akshare")
        return None

    end_date = datetime.now().strftime("%Y%m%d")
    start_date = (datetime.now() - timedelta(days=lookback_days * 2)).strftime("%Y%m%d")
    is_etf = _is_etf_code(code)
    label = f"{'ETF' if is_etf else 'A股'} {code}"
    sina_sym = _sina_symbol(code)

    # 临时禁用代理 (Windows 本地设了 IE 注册表代理会干扰)
    proxy_keys = ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy")
    saved = {k: os.environ.pop(k, None) for k in proxy_keys}
    saved_no = os.environ.get("NO_PROXY"), os.environ.get("no_proxy")
    os.environ["NO_PROXY"] = "*"
    os.environ["no_proxy"] = "*"

    def _try_etf_em():
        return ak.fund_etf_hist_em(
            symbol=code, period="daily",
            start_date=start_date, end_date=end_date, adjust="qfq",
        )

    def _try_stock_em():
        return ak.stock_zh_a_hist(
            symbol=code, period="daily",
            start_date=start_date, end_date=end_date, adjust="qfq",
        )

    def _try_etf_sina():
        return ak.fund_etf_hist_sina(symbol=sina_sym)

    def _try_stock_sina():
        return ak.stock_zh_a_daily(symbol=sina_sym, adjust="qfq")

    try:
        # 第一级: 东财接口 (ETF / 个股)
        primary = _try_etf_em if is_etf else _try_stock_em
        df = _retry(primary, retries=2, delay=2.0, label=f"{label}[东财]")

        # 第二级: 东财互换 (防代码误判)
        if df is None or df.empty:
            secondary = _try_stock_em if is_etf else _try_etf_em
            logger.info("%s 东财主接口无数据, 尝试东财备用", label)
            df = _retry(secondary, retries=1, delay=2.0, label=f"{label}[东财备]")

        # 第三级: 新浪接口 (境外可达, GitHub Actions 通用)
        if df is None or df.empty:
            sina_fn = _try_etf_sina if is_etf else _try_stock_sina
            logger.info("%s 东财全部失败, 切换新浪接口 %s", label, sina_sym)
            df = _retry(sina_fn, retries=3, delay=2.0, label=f"{label}[新浪]")

        # 新浪也试试互换
        if df is None or df.empty:
            sina_alt = _try_stock_sina if is_etf else _try_etf_sina
            logger.info("%s 新浪主接口无数据, 尝试新浪备用", label)
            df = _retry(sina_alt, retries=1, delay=2.0, label=f"{label}[新浪备]")

    finally:
        for k, v in saved.items():
            if v is not None:
                os.environ[k] = v
        if saved_no[0] is None:
            os.environ.pop("NO_PROXY", None)
        else:
            os.environ["NO_PROXY"] = saved_no[0]
        if saved_no[1] is None:
            os.environ.pop("no_proxy", None)
        else:
            os.environ["no_proxy"] = saved_no[1]

    out = _normalize_kline(df, lookback_days)
    if out is None:
        logger.warning("%s 所有接口均失败", label)
    return out


def fetch_us_stock(code: str, lookback_days: int = 120) -> Optional[pd.DataFrame]:
    """拉取美股历史日 K 线."""
    try:
        import yfinance as yf
    except ImportError:
        logger.error("yfinance 未安装, 请: pip install yfinance")
        return None

    period_days = max(lookback_days * 2, 200)

    def _do_fetch():
        ticker = yf.Ticker(code)
        return ticker.history(period=f"{period_days}d", auto_adjust=False)

    df = _retry(_do_fetch, retries=3, delay=5.0, label=f"美股 {code}")
    # 限速友好: 每只美股之间间隔, 避免触发 Yahoo Rate Limit
    time.sleep(2.0)

    if df is None or df.empty:
        logger.warning("美股 %s 返回空数据", code)
        return None

    df = df.reset_index().rename(
        columns={
            "Date": "date",
            "Open": "open",
            "High": "high",
            "Low": "low",
            "Close": "close",
            "Volume": "volume",
        }
    )
    df["date"] = pd.to_datetime(df["date"]).dt.tz_localize(None)
    df = df[["date", "open", "high", "low", "close", "volume"]].sort_values("date")
    return df.tail(lookback_days).reset_index(drop=True)
