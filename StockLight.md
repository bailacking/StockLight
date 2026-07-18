# StockLight 工程规格说明书

## 1. 项目总览

- **项目名称**：StockLight
- **项目定位**：面向个人使用的轻量级 A 股行情分析工具，使用 Python 获取和计算股票数据，使用浏览器展示表格、筛选排序结果和个股日 K 线。
- **核心目标**：完成 A 股股票日线行情的本地采集、增量更新、预处理、指标计算和浏览器可视化展示。
- **前端形态**：纯 HTML + CSS + JavaScript，不引入 Vue、React 等前端框架。
- **访问方式**：支持本机浏览器访问，也支持同一局域网内手机浏览器访问。
- **Python 版本**：3.10+
- **基础依赖**：`requests>=2.25.0`
- **项目状态**：全部代码已实现并通过验证，文档同步更新。

当前磁盘实况：

| 文件 | 状态 | 说明 |
|---|---|---|
| `StockLight.md` | ✓ | 本规格说明书（即本文档） |
| `README.md` | ✓ | GitHub 项目说明与操作指南 |
| `AGENT.md` | ✓ | AI 助手快速指南 |
| `LICENSE` | ✓ | MIT 开源许可证 |
| `.gitignore` | ✓ | Git 忽略规则 |
| `stock_api_specs.json` | ✓ | 数据源接口规格（腾讯/新浪/东方财富） |
| `codes.txt` | ✓ | 3199 条股票代码，每行一个 |
| `requirements.txt` | ✓ | 依赖清单：`requests>=2.25.0` |
| `启动程序.bat` | ✓ | 集成菜单：启动服务/全量初始化/日常更新/分步操作 |
| `scripts/stocklight/` | ✓ | 公共模块：`__init__.py` + `config.py` + `utils.py` |
| `scripts/kline_update.py` | ✓ | 日 K 采集（`--full`/`--incremental`） |
| `scripts/fetch_data.py` | ✓ | 数据采集（`--names`/`--realtime`） |
| `scripts/preprocess.py` | ✓ | 预处理 + 指标计算 + JSON 生成 |
| `server/start_server.py` | ✓ | HTTP 服务（`0.0.0.0:8000`，含 Cache-Control） |
| `server/启动程序.bat` | ✓ | 集成菜单：启动服务/全量初始化/日常更新/分步操作 |
| `server/启动服务.bat` | ✓ | 双击启动服务 + 打开浏览器 |
| `server/初始化数据.bat` | ✓ | 首次准备：全量日 K + 名称+实时行情 + 预处理 |
| `server/更新数据.bat` | ✓ | 一键日常更新：增量日 K + 实时行情 + 预处理 |
| `server/更新日K.bat` | ✓ | 仅增量更新日 K 线 |
| `server/获取股票名称.bat` | ✓ | 仅采集股票名称缓存 |
| `server/获取实时行情.bat` | ✓ | 仅采集实时行情 |
| `server/预处理数据.bat` | ✓ | 仅执行预处理生成前端 JSON |
| `web/index.html` | ✓ | 股票列表主页（CSS 内联，骨架屏，深色模式） |
| `web/detail.html` | ✓ | 个股详情页（CSS 内联，骨架屏，深色模式） |
| `web/css/style.css` | ✓ | 全局样式参考文件（已内联至 HTML） |
| `web/js/app.js` | ✓ | 主页逻辑：加载 `summary.json`、缓存、渲染 |
| `web/js/table.js` | ✓ | 表格排序/筛选/分页/防抖 |
| `web/js/detail.js` | ✓ | 详情页逻辑：加载 K 线 JSON、上一只/下一只导航 |
| `web/js/chart.js` | ✓ | Canvas K 线图绘制（日 K/均线/成交量/十字光标/滚动） |
| `web/js/indicators.js` | ✓ | 数值格式化工具函数 |
| `data/` 所有文件 | — | 运行时生成 |

## 2. 目录结构与文件职责

```
StockLight/
├─ StockLight.md                  # 本工程规格说明书
├─ README.md                      # GitHub 项目说明与操作指南
├─ AGENT.md                       # AI 快速指南
├─ LICENSE                        # MIT 开源许可证
├─ .gitignore                     # Git 忽略规则
├─ 启动程序.bat                   # 集成菜单：启动服务/初始化/更新/分步操作
├─ stock_api_specs.json           # 数据源接口规格（腾讯、新浪、东方财富的可用性及限制）
├─ codes.txt                      # 每行一个 6 位股票代码，约 3199 条
├─ requirements.txt               # Python 依赖清单
│
├─ scripts/                       # 数据采集与处理模块
│  ├─ stocklight/                 # 公共模块，消除各脚本重复代码
│  │  ├─ __init__.py
│  │  ├─ config.py                # 配置常量（路径、接口、限速参数等）
│  │  └─ utils.py                 # 工具函数（市场映射、HTTP 请求、CSV 读写等）
│  ├─ kline_update.py             # 日 K 数据采集：--full / --incremental
│  ├─ fetch_data.py               # 数据采集：--names / --realtime
│  └─ preprocess.py               # 汇总原始数据、计算指标、生成前端 JSON
│
├─ data/                          # 缓存数据与日志
│  ├─ stocks_meta.csv             # 股票代码→完整名称缓存
│  ├─ stocks_realtime.csv         # 实时行情缓存（量比、换手率、市值、PE/PB 等）
│  ├─ date/
│  │  └─ raw/{code}.csv           # 单股日线 CSV，约 3199 个文件

│  └─ logs/
│     ├─ update.log               # 日 K 更新日志
│     ├─ preprocess.log           # 预处理日志
│     └─ fetch_names.log          # 名称采集日志
│
├─ server/                        # Web 服务与启动脚本
│  ├─ start_server.py             # 启动本地 HTTP 服务（绑定 0.0.0.0:8000，含 Cache-Control）
│  ├─ 启动服务.bat                 # 启动服务并自动打开浏览器
│  ├─ 初始化数据.bat               # 首次准备：全量日 K + 名称/实时行情 + 预处理
│  ├─ 更新数据.bat                 # 日常更新：增量日 K + 实时行情 + 预处理
│  ├─ 更新日K.bat                  # 仅增量更新日 K 线
│  ├─ 获取股票名称.bat             # 仅采集股票名称
│  ├─ 获取实时行情.bat             # 仅采集实时行情
│  └─ 预处理数据.bat               # 仅执行预处理
│
└─ web/                           # 前端页面（纯静态）
   ├─ index.html                  # 股票列表主页（筛选、排序、分页、深色模式）
   ├─ detail.html                 # 个股详情页（概要、日 K 线图、均线）
   ├─ css/style.css               # 全局样式（参考文件，CSS 已内联至 HTML）
   ├─ js/
   │  ├─ indicators.js            # 数值格式化工具（formatPrice/formatPercent/formatVolume 等）
   │  ├─ app.js                   # 主页逻辑：加载 summary.json、缓存控制、渲染
   │  ├─ table.js                 # 表格排序、筛选、分页、防抖
   │  ├─ detail.js                # 详情页逻辑：加载 K 线 JSON、前后导航
   │  └─ chart.js                 # Canvas K 线图绘制（日 K、均线、成交量、十字光标、滚动）
   └─ data/
      ├─ summary.json             # 主页摘要数据（由 preprocess.py 生成）
      └─ kline/{code}.json        # 单股 K 线数据（由 preprocess.py 生成）
```

**说明**：
- CSS 已通过 `<style>` 标签内联到 `index.html` 和 `detail.html`，消除渲染阻塞请求。`web/css/style.css` 为源文件参考，未在 HTML 中引用。
- `data/moneyflow/` 为预留目录，当前未使用。
- `web/data/` 目录由 `preprocess.py` 在运行时创建。

## 3. 技术架构与数据流

StockLight 采用"本地数据文件 + Python 预处理 + 静态浏览器界面"的轻量架构，不引入数据库服务。

```
codes.txt
  ↓
scripts/kline_update.py --full / --incremental
  ↓
data/date/raw/{code}.csv
  ↑
    scripts/fetch_data.py --names --realtime
  ↓
  scripts/preprocess.py
  ↓
web/data/summary.json + web/data/kline/{code}.json
  ↓
server/start_server.py
  ↓
web/index.html 只加载 summary.json
web/detail.html 按需加载 kline/{code}.json
  ↓
PC 浏览器 / 局域网手机浏览器
```

技术选型：

| 层级 | 技术 | 说明 |
|---|---|---|
| 数据采集 | Python + requests | 统一通过 `scripts/stocklight/utils.py` 封装 HTTP 请求 |
| 数据处理 | Python 标准库优先 | 标准库足够时不强制引入 pandas |
| 数据存储 | CSV + JSON | 原始数据分股票存 CSV，前端使用汇总 JSON |
| 前端页面 | HTML + CSS + 原生 JavaScript | 不依赖前端框架；CSS 内联消除渲染阻塞 |
| 图表展示 | Canvas | 日 K 线、成交量、均线、十字光标和图内浮层 |
| Web 服务 | Python `http.server` | 绑定 `0.0.0.0:8000` 支持局域网；含 Cache-Control 头 |

## 4. 数据格式规范

### 4.1 原始日线 CSV

位置：`data/date/raw/{code}.csv`，每文件只保存一只股票。

| 字段 | 类型 | 示例 | 说明 |
|---|---|---|---|
| `date` | string | `2026-07-16` | 交易日期，格式 `YYYY-MM-DD` |
| `code` | string | `000001` | 6 位股票代码 |
| `open` | number | `10.54` | 开盘价 |
| `high` | number | `10.67` | 最高价 |
| `low` | number | `10.44` | 最低价 |
| `close` | number | `10.54` | 收盘价 |
| `volume` | integer | `1062386` | 成交量（股） |
| `pctchg` | number | `-0.95` | 涨跌幅，百分比，保留 2 位小数 |

存储规则：
- 每个文件必须包含表头行，字段顺序如上表。
- 日期必须按升序排列。
- 价格字段保留接口原始精度，不在采集阶段截断。
- 仅当日 K 数据，不存储周 K、月 K 或分钟 K。

### 4.2 股票名称缓存

位置：`data/stocks_meta.csv`。

| 字段 | 类型 | 示例 | 说明 |
|---|---|---|---|
| `code` | string | `000001` | 6 位股票代码 |
| `name` | string | `平安银行` | 股票完整名称 |

规则：由 `fetch_data.py --names` 生成，`preprocess.py` 只读取不请求接口。名称为空时前端显示 `-`。

### 4.3 实时行情缓存

位置：`data/stocks_realtime.csv`。

| 字段 | 类型 | 示例 | 说明 |
|---|---|---|---|
| `code` | string | `000001` | 6 位股票代码 |
| `name` | string | `平安银行` | 股票名称 |
| `price` | number | `10.78` | 最新价 |
| `volume_ratio` | number | `1.11` | 量比 |
| `turnover_rate` | number | `0.55` | 换手率 |
| `amount` | number | `1163189279` | 成交额（元） |
| `market_cap` | number | `2091.96` | 总市值（接口原始单位） |
| `float_market_cap` | number | `2091.92` | 流通市值 |
| `pe_ttm` | number | `4.86` | 市盈率（TTM） |
| `pb` | number | `0.46` | 市净率 |
| `limit_up` | number | `11.85` | 涨停价 |
| `limit_down` | number | `9.69` | 跌停价 |
| `updated_at` | string | `20260717151300` | 接口数据时间 |
| `generated_at` | string | `2026-07-17 15:20:00` | 本地缓存生成时间 |

规则：由 `fetch_data.py --realtime` 生成，`preprocess.py` 只读取。量比为 null 时前端显示 `-`，排序排末尾。

### 4.4 前端 JSON — 主页摘要

位置：`web/data/summary.json`，由 `preprocess.py` 生成。

```json
{
  "generated_at": "2026-07-17 20:00:00",
  "count": 3199,
  "stocks": [
    {
      "code": "000001",
      "name": "平安银行",
      "latest_date": "2026-07-16",
      "open": 0, "high": 0, "low": 0, "close": 0,
      "volume": 0, "pctchg": 0,
      "amplitude": 0,
      "volume_ratio": 1.11, "turnover_rate": 0.55,
      "realtime_amount": 1163189279,
      "market_cap": 2091.96, "float_market_cap": 2091.92,
      "pe_ttm": 4.86, "pb": 0.46
    }
  ]
}
```

设计原则：
- 只包含主页列表、筛选和排序所需字段，不包含完整 K 线。
- 手机端打开主页时只加载此文件（约 16 字段/只，包体约 35% 缩减）。
- 指标值可为 `null`，前端显示为 `-`。

### 4.5 前端 JSON — 单股 K 线

位置：`web/data/kline/{code}.json`，由 `preprocess.py` 生成。

```json
{
  "code": "000001",
  "name": "平安银行",
  "latest_date": "2026-07-16",
  "kline_limit": 260,
  "kline": [
    {
      "date": "2026-07-16",
      "open": 10.54, "high": 10.67, "low": 10.44, "close": 10.54,
      "volume": 1062386, "pctchg": -0.95,
      "ma5": 10.62, "ma10": 10.58, "ma20": 10.70, "ma60": 10.65,
      "vol_ma5": 1200000,
      "amplitude": 2.18
    }
  ]
}
```

设计原则：
- 仅包含单只股票数据，进入详情页时按需加载。
- `kline` 数组保留最近 260 个交易日数据。
- `ma5`/`ma10`/`ma20`/`ma60` 不足周期时为 `null`。
- `rsi6` 在 `preprocess.py` 中计算但当前不写入 JSON。

## 5. 模块功能规格

### 5.1 股票代码文件 `codes.txt`

每行一个 6 位数字股票代码，忽略空行。不允许在代码中写市场前缀。

市场映射规则：
- `0`、`3` 开头 → 深市（`sz`）
- `6` 开头 → 沪市（`sh`）
- `8` 开头 → 北交所（`bj`）

### 5.2 数据接口规格 `stock_api_specs.json`

记录腾讯财经、新浪财经、东方财富等数据源的可用性、字段、限制和测试结果。
采集脚本必须优先读取此文件，不应把接口信息散落在多个脚本中。

当前日 K 优先策略：
1. 腾讯财经 `ifzq.gtimg.cn` 前复权数据
2. 前复权为空时回退到不复权数据
3. 新浪财经作为历史 K 线备用源

### 5.3 日 K 数据采集 `kline_update.py`

CLI 参数：`--full`（全量）或 `--incremental`（增量，默认）

**输入**：`codes.txt`、`stock_api_specs.json`、`data/date/raw/{code}.csv`（增量模式）

**处理**：
- 读取股票代码列表，根据代码开头生成市场前缀（`sh`/`sz`/`bj`）
- 请求腾讯财经前复权日 K 接口（限速 1 次/秒，最多重试 3 次）
- 前复权数据为空时回退到不复权日 K
- 仍无数据时尝试新浪财经接口（限速 1.5 秒/次）
- 合并新旧数据，按日期升序去重
- 重新计算 `pctchg` = 相邻交易日收盘价涨跌幅（百分比，保留 2 位小数）
- 写入前先将新数据写入临时文件，再替换目标文件
- 写入 `data/logs/update.log`

**全量模式**：从头采集所有股票的全部日 K 数据（默认 320 条/只）

**增量模式**：
- 读取已有单股 CSV 的最后日期，从该日期起请求最新数据
- 单股 CSV 不存在时跳过，不执行全量补采
- 最后日期 ≥ 当前日期时跳过该股票
- 当天非交易日或接口无新数据，不应视为失败
- 输出更新/已最新/无新数据/跳过/失败的分类统计

**输出**：`data/date/raw/{code}.csv`，表头固定为 `date,code,open,high,low,close,volume,pctchg`

**进度显示**：采集过程中实时显示进度条 + 分类统计（更新/已最新/无新数据/跳过/失败），采集完成时汇总输出。

**异常**：
- 接口超时：按配置重试，重试仍失败时跳过该股票
- 前复权为空：自动回退不复权
- 单只股票无数据/文件异常：跳过，不中断全局
- 必须保留限速和重试逻辑
- 必须使用 `scripts/stocklight/config.py` 中的路径配置

### 5.4 数据采集集 `fetch_data.py`

CLI 子命令：`--names`、`--realtime`，可组合使用

**输入**：`codes.txt`

**处理**（按子命令）：

| 子命令 | 接口 | 输出文件 | 说明 |
|---|---|---|---|
| `--names` | 腾讯实时行情（批量 100 只） | `data/stocks_meta.csv` | 字段 `code,name` |
| `--realtime` | 腾讯实时行情（批量 100 只） | `data/stocks_realtime.csv` | 价格、量比、换手率、成交额、市值、PE、PB、涨跌停价 |

**异常**：
- 单只股票获取失败时跳过并记录，不中断批量流程
- 采集过程中实时显示成功/失败计数，完成时输出汇总

### 5.5 数据预处理 `preprocess.py`

**输入**：
- `data/date/raw/{code}.csv`（所有股票日 K 数据）
- `data/stocks_meta.csv`（名称缓存）
- `data/stocks_realtime.csv`（实时行情缓存）

**处理**：
- 遍历所有日 K CSV，每只股票读取后计算：
  - `ma5`、`ma10`、`ma20`、`ma60`（移动均线，交易日不足时为 `null`）
  - `vol_ma5`（5 日均量）
  - `amplitude` = `(high - low) / 前收盘价 * 100`
  - `rsi6`（6 日 RSI，内部计算暂不输出）
- 从 `data/stocks_meta.csv` 匹配股票名称
- 从 `data/stocks_realtime.csv` 匹配实时行情字段（量比、换手率、成交额、市值、PE、PB）

**输出**：
- `web/data/summary.json` — 所有股票摘要，用于主页列表（16 字段/只）
- `web/data/kline/{code}.json` — 每只股票的 K 线数组（最近 260 条）

**异常**：
- CSV 表头不一致：跳过该文件并记录日志
- 数字字段为空或非法：转换为 `null` 或跳过该行
- 日期重复：以同一日期最后一条有效记录为准
- 日期乱序：输出前统一按日期升序排序
- 写入 `data/logs/preprocess.log`

### 5.6 HTTP 服务 `start_server.py`

**处理**：
- 服务根目录指向 `web/`
- 绑定 `0.0.0.0:8000`
- 启动后输出本机地址和局域网地址
- Cache-Control 策略：
  - `.js` / `.css`：`public, max-age=86400`（缓存 1 天）
  - `.json` / `.html`：`no-cache`（每次验证）

**异常**：
- 端口被占用时提示用户更换端口
- Windows 防火墙可能拦截局域网访问，启动输出中提示

### 5.7 前端主页 `web/index.html`

**数据加载**：
- 加载 `web/data/summary.json` 渲染股票列表
- `localStorage` 缓存 `summary.json`（30 分钟 TTL），缓存有效时直接渲染，同时后台异步请求保持新鲜
- 数据加载失败显示错误信息 + "重试"按钮
- **自动刷新**：前台每 120 秒自动轮询 `summary.json`；切回标签页或窗口获得焦点时立即刷新；标签页隐藏时停止轮询节约资源

**筛选功能**：
- 股票代码/名称模糊搜索（300ms 防抖）
- 筛选/排序结果缓存：筛选条件和排序未变化时跳过重复计算
- 支持 9 种条件区间筛选：涨跌幅、收盘价、成交量（万）、量比、换手率、PE、PB、总市值（亿）、振幅
- 点击"更多筛选"展开/收起高级筛选面板
- "重置"按钮一键清空全部筛选条件和排序状态

**排序功能**：
- 表头 17 列全部支持点击升序/降序切换
- 双箭头常显，当前排序列高亮（浅蓝背景 `#e6f7ff`）+ 箭头变蓝
- 数字按数值、日期按字符串、`null` 排末尾

**分页功能**：
- 支持每页 50/100/200 条切换
- 首页/上一页/页码按钮/下一页/末页
- 页码按钮最多显示 9 个，两端带省略号

**表格**：
- 17 列：代码、名称、日期、开盘、最高、最低、收盘、涨跌幅、成交量、量比、振幅、换手率、成交额、总市值、流通市值、PE、PB
- 涨跌颜色标识（涨 `#ef5350`，跌 `#26a69a`），涨跌幅加粗
- 表头粘性定位（`position: sticky; top: 0`），垂直滚动时始终可见
- 斑马纹、hover 高亮
- 点击代码或名称跳转 `detail.html?code=XXXXXX`（携带前后股票信息）

**深色模式**：
- CSS 变量体系重构所有颜色，`:root` 定义亮色/暗色两套变量集
- `[data-theme="dark"]` 切换深色
- Header 右侧主题切换按钮（☀️/🌙）
- `localStorage` 持久化偏好
- 首次加载自动跟随系统 `prefers-color-scheme`

**加载体验**：
- 骨架屏（shimmer 脉冲动画）替代纯文本"加载中..."
- "返回顶部"浮动按钮，滚动超过 500px 显示，点击平滑回顶
- 移动端适配：表格横向滚动、筛选区纵向排列

**视觉风格**：
- 背景 `#f0f2f5`、卡片圆角 10px、深层阴影 + 悬浮提升感
- Header 深色渐变配白字
- 按钮圆角过渡动画
- 自定义滚动条样式

### 5.8 前端详情页 `web/detail.html`

**导航**：
- 从 URL 参数 `code` 读取股票代码
- "返回列表"链接跳回 `index.html`
- "上一只/下一只"导航按钮，基于当前筛选排序结果跳转前后股票
- 导航 URL 携带 `prev`/`next` 参数实现链式跳转

**数据加载**：
- 加载 `web/data/kline/{code}.json`
- 骨架屏加载态，错误时显示"重试"按钮
- **自动刷新**：切回标签页或窗口获得焦点时自动重新加载数据

**个股概要卡片**：
- 分组展示：价格（日期/开盘/最高/最低/收盘/涨跌幅）、均线（MA5/MA10/MA20）、量价（成交量/振幅）
- 涨跌色标识收盘价和涨跌幅

**K 线图（Canvas 绘制）**：
- 日 K 线图展示开盘/收盘（实体柱）/最高/最低（影线）
- 叠加 MA5（橙 `#f39c12`）、MA10（蓝 `#3498db`）、MA20（绿 `#2ecc71`）均线
- 成交量柱状图在 K 线下方，颜色同 K 线涨跌色
- Vol MA5 均量线（紫 `#9b59b6`）

**坐标轴**：
- 左侧 Y 轴价格刻度 + 水平网格线（虚线），智能步长算法（1/2/5 倍数）
- 右侧百分比副轴（以首根 K 线收盘价为基准）
- 底部 X 轴日期标签 + 竖网格线，月份分隔线，跨年感知
- 时间跨度自适应标签间隔，防重叠
- 成交量区右侧 Y 轴标尺

**交互**：
- 鼠标/触摸移动显示十字参考线（竖线 + 横线）
- 图内浮层 Tooltip（日期、开高低收、涨跌幅、成交量、MA5/MA10/MA20）
- 价格标签（右边缘）+ 日期标签（底部），自动避让边界
- Tooltip 跟随鼠标 + 自动避让画布边界

**滚动**：
- 固定步长 10px，滚动条 6px 高（成交量下方）
- 支持拖拽滑块和点按跳转
- 鼠标滚轮/触摸拖拽平移视图
- 默认滚动到最新数据（最右侧）

**分层绘制**（从底到顶）：
1. 边框 + 网格线（0.5px，绘制于图形下层，不遮挡 K 线）
2. K 线柱 + 成交量柱 + 均线
3. 价格/Y 轴标签 + X 轴日期标签 + MA 图例浮层（半透明，左上角）
4. 滚动条
5. 十字光标 + 价格/日期标签

**主题切换**：
- 读取 CSS 变量获取颜色，切换主题时自动重绘 Canvas

### 5.9 启动脚本 `启动服务.bat`

- 使用 `start` 命令打开浏览器访问 `http://127.0.0.1:8000/`
- 调用 `python server/start_server.py`

### 5.10 更新脚本 `更新数据.bat`

依次执行：
1. `python scripts/kline_update.py --incremental`
2. `python scripts/fetch_data.py --realtime`
3. `python scripts/preprocess.py`

不自动启动浏览器。

### 5.11 初始化脚本 `初始化数据.bat`

首次准备数据时使用，依次执行：
1. `python scripts/kline_update.py --full`（全量日 K 采集）
2. `python scripts/fetch_data.py --names --realtime`（名称 + 实时行情）
3. `python scripts/preprocess.py`（预处理）

### 5.12 独立步骤脚本

为支持按需执行各步骤，提供以下独立批处理文件：

| 脚本 | 执行命令 | 说明 |
|---|---|---|
| `更新日K.bat` | `kline_update.py --incremental` | 仅增量更新日 K 线 |
| `获取股票名称.bat` | `fetch_data.py --names` | 仅采集股票名称 |
| `获取实时行情.bat` | `fetch_data.py --realtime` | 仅采集实时行情 |
| `预处理数据.bat` | `preprocess.py` | 仅执行预处理 |

## 6. 分阶段开发路线图（已完成）

以下四个阶段均已实现并验证通过。

### 6.1 阶段一：数据采集核心 ✓

**目标**：从零搭建 `scripts/` 目录，实现日 K 数据采集

| 步骤 | 动作 | 状态 |
|---|---|---|
| 1 | 创建 `scripts/stocklight/__init__.py` | ✓ |
| 2 | 实现 `scripts/stocklight/config.py` | ✓ |
| 3 | 实现 `scripts/stocklight/utils.py` | ✓ |
| 4 | 实现 `scripts/kline_update.py --full` | ✓ |
| 5 | 实现 `scripts/kline_update.py --incremental` | ✓ |

**阶段验证**：5 只测试股票全量采集 320 条/只，增量模式正确识别"无新数据"。

### 6.2 阶段二：数据加工链路 ✓

**目标**：实现名称、实时行情采集和预处理

| 步骤 | 动作 | 状态 |
|---|---|---|
| 1 | 实现 `scripts/fetch_data.py --names` | ✓ |
| 2 | 实现 `scripts/fetch_data.py --realtime` | ✓ |
| 3 | 实现 `scripts/preprocess.py` | ✓ |

**阶段验证**：summary.json 包含 `count` 和 `stocks`，MA5/10/20/60/振幅/RSI6 计算正确。

### 6.3 阶段三：服务与交互 ✓

**目标**：搭建 HTTP 服务，使前端可访问

| 步骤 | 动作 | 状态 |
|---|---|---|
| 1 | 创建 `server/` 目录 | ✓ |
| 2 | 实现 `server/start_server.py`（含 Cache-Control） | ✓ |
| 3 | 编写 `server/启动服务.bat` | ✓ |

**阶段验证**：HTTP 200 返回 index.html、summary.json、kline JSON、JS 文件。

### 6.4 阶段四：前端页面 ✓

**目标**：实现完整的前端界面

| 步骤 | 动作 | 状态 |
|---|---|---|
| 1 | 创建 `web/js/`、`web/css/`、`web/data/` | ✓ |
| 2 | 实现 CSS 变量体系 + 深色模式 + 全局样式 | ✓ |
| 3 | 实现 `web/js/indicators.js` | ✓ |
| 4 | 实现 `web/js/app.js` + `web/js/table.js`（含防抖/缓存/分页） | ✓ |
| 5 | 实现 `web/index.html`（含骨架屏/筛选/排序/深色模式） | ✓ |
| 6 | 实现 `web/js/chart.js` + `web/js/detail.js`（含 K 线图/十字光标/滚动） | ✓ |
| 7 | 实现 `web/detail.html`（含概要卡片/上一只下一只导航） | ✓ |
| 8 | 编写 `server/更新数据.bat` 等所有批处理脚本 | ✓ |

**阶段验证**：串联走通首次准备数据和日常更新流程。

### 6.5 日常操作

**首次准备数据**：
1. 双击 `server/初始化数据.bat`
2. 双击 `server/启动服务.bat`

或手动执行：
1. `python scripts/kline_update.py --full`
2. `python scripts/fetch_data.py --names --realtime`
3. `python scripts/preprocess.py`
4. `python server/start_server.py`

- 启动服务：双击 `server/启动程序.bat` 选 1，或双击 `server/启动服务.bat`

**日常更新**：
1. 双击 `server/更新数据.bat`
2. 刷新浏览器

等价于手动执行：
1. `python scripts/kline_update.py --incremental`
2. `python scripts/fetch_data.py --realtime`
3. `python scripts/preprocess.py`

**分步操作**（按需）：
- 仅更新日 K：双击 `server/更新日K.bat`
- 仅采集行情：双击 `server/获取实时行情.bat`
- 仅预处理：双击 `server/预处理数据.bat`

## 7. 工程约束

### 7.1 异常处理

**数据采集异常**：
- 接口超时重试，失败后跳过该股票不中断全局
- 前复权为空时自动回退不复权
- 腾讯接口无数据时尝试新浪备用接口
- 单只股票无数据时跳过并记录
- 保留全局限速和较低并发（腾讯 1 次/秒，新浪 1.5 秒/次）

**数据文件异常**：
- CSV 不存在：增量模块跳过，历史模块可补采
- 表头不一致：跳过并记录日志
- 数字字段非法：转换为 `null`
- 日期重复：以最后一条有效记录为准
- 日期乱序：统一升序排序

**前端异常**：
- JSON 加载失败：显示"数据文件未生成或无法读取"+ 重试按钮
- JSON 为空：显示"暂无股票数据"
- 指标为 `null`：显示 `-`，排序排末尾
- 图表数据不足：隐藏均线或显示提示

### 7.2 硬性约束

- 只实现日 K，不实现周 K、月 K、分钟 K
- 前端使用纯 HTML + CSS + JavaScript，不引入 Vue、React 等框架
- 不引入数据库，不实现用户登录、多用户权限和远程公网访问
- 不提供投资建议，只展示和计算数据
- 不得修改的规则：
  - 采集脚本必须使用 `scripts/stocklight` 公共模块消除重复代码
  - 预处理脚本只读取缓存文件，不直接请求外部接口
  - 所有脚本必须使用相对路径或 `scripts/stocklight/config.py` 配置
  - 前端页面必须通过 HTTP 地址访问，不支持直接双击打开 HTML

## 8. 变更记录

| 日期 | 变更内容 |
|---|---|
| 2026-07-18 | 天才王大帅完成了 StockLight V1.0 版本 |
| | *我本想征服市场，结果征服了 3199 个 CSV 文件。胜利嘛，全看你怎么定义。* |