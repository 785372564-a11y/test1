# Daily Stock Analysis → 飞书

每日自动拉取 A 股 + 美股行情,计算 MA / RSI / MACD / 量比,生成多空信号并通过飞书群机器人推送富文本卡片。

## 功能

- A 股数据源: [akshare](https://akshare.akfamily.xyz/)(免费,免 Key)
- 美股数据源: [yfinance](https://github.com/ranaroussi/yfinance)(免费,免 Key)
- 技术指标: MA(5/10/20/60)、RSI(14)、MACD(12,26,9)、量比
- 信号: 金叉/死叉、超买/超卖、多头/空头排列、放量、大涨/大跌
- 推送: 飞书群机器人 webhook(可选签名校验)
- 调度: GitHub Actions 定时(A 股收盘 + 美股收盘),亦可本地手动运行

## 一、获取飞书机器人 Webhook

1. 在飞书目标群里 → 群设置 → 群机器人 → 添加机器人 → **自定义机器人**
2. 自定义名字与头像,点击「添加」
3. 复制 webhook URL,形如:
   `https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
4. **(可选,推荐)** 安全设置勾选「签名校验」,复制密钥

## 二、本地运行

```bash
cd daily_stock_analysis
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 FEISHU_WEBHOOK_URL 与 (可选) FEISHU_WEBHOOK_SECRET

# 自定义关注的股票
# 编辑 config.yaml 中的 a_shares 与 us_stocks 列表

python main.py
```

成功后飞书群里会收到一张交互卡片,包含每只股票的现价、涨跌、趋势判断与信号。

## 三、GitHub Actions 定时推送

工作流已配置在仓库根目录 `.github/workflows/daily_stock.yml`,默认在以下时间触发:

- 北京时间 周一~周五 16:00 (A 股收盘后)
- 北京时间 周二~周六 05:30 (美股收盘后)

### 配置 Secrets

在 GitHub 仓库:Settings → Secrets and variables → Actions → New repository secret

| Secret 名 | 值 |
| --- | --- |
| `FEISHU_WEBHOOK_URL` | 飞书机器人 webhook 完整 URL |
| `FEISHU_WEBHOOK_SECRET` | 签名密钥(若开启签名校验,否则可不加) |

也可在 Actions 页面手动触发(`Run workflow`)。

## 四、配置说明 (config.yaml)

```yaml
a_shares:        # A 股代码列表 (akshare 6 位数字)
  - { code: "600519", name: "贵州茅台" }
us_stocks:       # 美股代码列表 (yfinance ticker)
  - { code: "AAPL", name: "苹果" }

analysis:
  lookback_days: 120     # 历史 K 线天数
  ma_periods: [5,10,20,60]
  rsi_period: 14
  rsi_oversold: 30
  rsi_overbought: 70
  change_alert_pct: 5.0  # 涨跌幅警示阈值

feishu:
  title: "📊 每日股票分析报告"
  card_color: "blue"     # blue/red/green/orange/...
```

## 五、目录结构

```
daily_stock_analysis/
├── main.py                  # 入口
├── config.yaml              # 股票列表 / 阈值
├── requirements.txt
├── .env.example
└── stock_analysis/
    ├── fetcher.py           # akshare + yfinance 数据拉取
    ├── analyzer.py          # 指标计算与信号
    └── feishu.py            # 飞书 webhook 推送
```

## 常见问题

- **akshare 拉取失败 / 网络超时**:akshare 部分接口走新浪/东财源站,境外服务器(GH Actions)有时会被限流,可重试或换接口。
- **签名校验失败**:确保机器人开启签名校验时 `FEISHU_WEBHOOK_SECRET` 已正确设置;未开启则不要填,否则会因多余 sign 字段被拒。
- **没收到消息**:检查 webhook URL 完整性、机器人是否被移出群、`python main.py` 输出是否报错。
