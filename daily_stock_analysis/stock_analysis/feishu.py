"""飞书群机器人 webhook 推送 (含签名)."""
from __future__ import annotations

import base64
import hashlib
import hmac
import logging
import time
from typing import List, Optional

import requests

from .analyzer import StockSignal

logger = logging.getLogger(__name__)


def _gen_sign(secret: str, timestamp: int) -> str:
    string_to_sign = f"{timestamp}\n{secret}"
    h = hmac.new(string_to_sign.encode("utf-8"), digestmod=hashlib.sha256)
    return base64.b64encode(h.digest()).decode("utf-8")


def _trend_emoji(trend: str) -> str:
    return {"看多": "🟢", "看空": "🔴", "震荡": "🟡"}.get(trend, "⚪")


def _fmt_price(price: float, market: str) -> str:
    if market == "A":
        return f"¥{price:.2f}"
    return f"${price:.2f}"


def build_card(title: str, color: str, signals: List[StockSignal]) -> dict:
    """生成飞书富文本卡片消息体."""
    a_shares = [s for s in signals if s.market == "A"]
    us_stocks = [s for s in signals if s.market == "US"]

    elements: list = []
    date_str = time.strftime("%Y-%m-%d %H:%M", time.localtime())
    elements.append({
        "tag": "div",
        "text": {"tag": "lark_md", "content": f"**报告时间:** {date_str}"},
    })

    def _section(market_title: str, items: List[StockSignal]):
        if not items:
            return
        elements.append({"tag": "hr"})
        elements.append({
            "tag": "div",
            "text": {"tag": "lark_md", "content": f"**{market_title}**"},
        })
        for s in items:
            sig_text = " / ".join(s.signals) if s.signals else "无显著信号"
            change_color = "green" if s.change_pct >= 0 else "red"
            ma_str = " ".join(f"MA{p}:{v:.2f}" for p, v in s.ma.items())
            content = (
                f"{_trend_emoji(s.trend)} **{s.name}** ({s.code}) — "
                f"<font color='{change_color}'>{_fmt_price(s.last_close, s.market)} "
                f"({s.change_pct:+.2f}%)</font>\n"
                f"  趋势: **{s.trend}** | RSI: {s.rsi:.1f} | "
                f"MACD柱: {s.macd_hist:+.3f} | 量比: {s.volume_ratio:.2f}\n"
                f"  {ma_str}\n"
                f"  信号: {sig_text}"
            )
            elements.append({
                "tag": "div",
                "text": {"tag": "lark_md", "content": content},
            })

    _section("🇨🇳 A 股", a_shares)
    _section("🇺🇸 美股", us_stocks)

    # 统计摘要
    bull = sum(1 for s in signals if s.trend == "看多")
    bear = sum(1 for s in signals if s.trend == "看空")
    flat = sum(1 for s in signals if s.trend == "震荡")
    elements.append({"tag": "hr"})
    elements.append({
        "tag": "div",
        "text": {
            "tag": "lark_md",
            "content": f"**汇总:** 看多 {bull} | 看空 {bear} | 震荡 {flat}",
        },
    })

    return {
        "msg_type": "interactive",
        "card": {
            "config": {"wide_screen_mode": True},
            "header": {
                "title": {"tag": "plain_text", "content": title},
                "template": color,
            },
            "elements": elements,
        },
    }


def build_text(signals: List[StockSignal]) -> dict:
    """纯文本备用消息体."""
    lines = [time.strftime("每日股票分析 %Y-%m-%d", time.localtime()), ""]
    for s in signals:
        lines.append(
            f"[{s.market}] {s.name}({s.code}) {s.last_close:.2f} "
            f"{s.change_pct:+.2f}% RSI={s.rsi:.1f} 趋势:{s.trend} "
            f"信号:{','.join(s.signals) or '-'}"
        )
    return {"msg_type": "text", "content": {"text": "\n".join(lines)}}


def push(
    webhook_url: str,
    payload: dict,
    secret: Optional[str] = None,
    timeout: int = 10,
) -> bool:
    """推送消息到飞书群机器人. 返回是否成功."""
    if not webhook_url:
        logger.error("FEISHU_WEBHOOK_URL 未配置")
        return False

    body = dict(payload)
    if secret:
        ts = int(time.time())
        body["timestamp"] = str(ts)
        body["sign"] = _gen_sign(secret, ts)

    try:
        resp = requests.post(webhook_url, json=body, timeout=timeout)
        data = resp.json()
    except Exception as exc:
        logger.error("飞书推送失败: %s", exc)
        return False

    code = data.get("code", data.get("StatusCode", 0))
    if code in (0, "0"):
        logger.info("飞书推送成功")
        return True
    logger.error("飞书推送返回错误: %s", data)
    return False
