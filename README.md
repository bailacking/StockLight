# StockLight

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-blue" alt="Python">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/github/actions/workflow/status/bailacking/StockLight/python-app.yml?branch=main&label=CI" alt="CI">
  <img src="https://img.shields.io/badge/Ruff-passing-brightgreen" alt="Ruff">
  <img src="https://img.shields.io/badge/tests-61%20passed-brightgreen" alt="Tests">
</p>

轻量级 A 股行情分析工具。Python 采集股票日 K 线数据，浏览器展示筛选排序和个股 K 线图。

纯静态前端（HTML + CSS + JS），不依赖数据库和前端框架。

## 功能

- 增量/全量采集 A 股日 K 线数据（腾讯财经 + 新浪财经）
- MA5/MA10/MA20/MA60、振幅、RSI6 等技术指标计算
- 17 列股票列表：筛选、排序、分页、深色模式
- Canvas 绘制 K 线图：均线、成交量、十字光标、横向滚动
- 支持局域网手机浏览器访问

## 快速开始

### 环境要求

- Python 3.10+
- 安装依赖：`pip install -r requirements.txt`

### 首次使用

```
双击 启动程序.bat → 选 2（首次初始化）
```

或手动执行：

```bash
python scripts/kline_update.py --full
python scripts/fetch_data.py --names --realtime
python scripts/preprocess.py
```

### 启动服务

```
双击 启动程序.bat → 选 1（启动 HTTP 服务）
```

浏览器打开 `http://127.0.0.1:8000/`

### 日常更新

```
双击 启动程序.bat → 选 3（日常更新）
```

或手动：

```bash
python scripts/kline_update.py --incremental
python scripts/fetch_data.py --realtime
python scripts/preprocess.py
```

### 分步操作

| 脚本 | 功能 |
|---|---|
| `更新日K.bat` | 仅增量更新日 K 线 |
| `获取实时行情.bat` | 仅采集实时行情 |
| `获取股票名称.bat` | 仅采集股票名称 |
| `预处理数据.bat` | 仅执行预处理 |

## 项目结构

```
StockLight/
├─ scripts/          # Python 采集与处理
│  ├─ stocklight/    # 公共模块（配置、工具函数）
│  ├─ kline_update.py
│  ├─ fetch_data.py
│  └─ preprocess.py
├─ web/              # 前端页面
│  ├─ index.html     # 股票列表页
│  ├─ detail.html    # 个股详情页
│  └─ js/            # JavaScript 逻辑
├─ server/           # HTTP 服务与启动脚本
├─ 启动程序.bat      # 集成菜单
└─ StockLight.md     # 工程规格说明书
```

## 数据来源

- 腾讯财经 `ifzq.gtimg.cn`（主力）
- 新浪财经 `money.finance.sina.com.cn`（备用）

数据仅供个人学习参考，不构成投资建议。

## 许可

[MIT](LICENSE)
