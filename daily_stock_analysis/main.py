"""每日股票分析入口: 拉取行情 -> 计算指标 -> 推送飞书."""
from __future__ import annotations

import logging
import os
import sys
from pathlib import Path
from typing import List

import yaml
from dotenv import load_dotenv

from stock_analysis import analyzer, feishu, fetcher

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("daily_stock")

ROOT = Path(__file__).parent


def load_config(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def run() -> int:
    load_dotenv(ROOT / ".env")

    webhook = os.getenv("FEISHU_WEBHOOK_URL", "").strip()
    secret = os.getenv("FEISHU_WEBHOOK_SECRET", "").strip() or None
    if not webhook:
        logger.error("环境变量 FEISHU_WEBHOOK_URL 未设置, 终止")
        return 1

    cfg = load_config(ROOT / "config.yaml")
    ana_cfg = cfg.get("analysis", {})
    ma_periods = ana_cfg.get("ma_periods", [5, 10, 20, 60])
    lookback = int(ana_cfg.get("lookback_days", 120))

    signals: List[analyzer.StockSignal] = []

    for item in cfg.get("a_shares", []) or []:
        code, name = item["code"], item["name"]
        logger.info("拉取 A 股 %s %s", code, name)
        df = fetcher.fetch_a_share(code, lookback)
        sig = analyzer.analyze(
            df, code, name, "A",
            ma_periods=ma_periods,
            rsi_period=int(ana_cfg.get("rsi_period", 14)),
            rsi_oversold=float(ana_cfg.get("rsi_oversold", 30)),
            rsi_overbought=float(ana_cfg.get("rsi_overbought", 70)),
            change_alert_pct=float(ana_cfg.get("change_alert_pct", 5.0)),
        )
        if sig:
            signals.append(sig)

    for item in cfg.get("us_stocks", []) or []:
        code, name = item["code"], item["name"]
        logger.info("拉取美股 %s %s", code, name)
        df = fetcher.fetch_us_stock(code, lookback)
        sig = analyzer.analyze(
            df, code, name, "US",
            ma_periods=ma_periods,
            rsi_period=int(ana_cfg.get("rsi_period", 14)),
            rsi_oversold=float(ana_cfg.get("rsi_oversold", 30)),
            rsi_overbought=float(ana_cfg.get("rsi_overbought", 70)),
            change_alert_pct=float(ana_cfg.get("change_alert_pct", 5.0)),
        )
        if sig:
            signals.append(sig)

    if not signals:
        logger.error("未获取到任何股票数据, 不推送")
        return 2

    fs_cfg = cfg.get("feishu", {})
    payload = feishu.build_card(
        title=fs_cfg.get("title", "📊 每日股票分析报告"),
        color=fs_cfg.get("card_color", "blue"),
        signals=signals,
    )
    ok = feishu.push(webhook, payload, secret=secret)
    return 0 if ok else 3


if __name__ == "__main__":
    sys.exit(run())
