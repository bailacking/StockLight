# StockLight — AI Agent 快速指南

## 项目概述

- **项目名称**：StockLight
- **项目定位**：轻量级 A 股行情分析工具，Python 采集 → 浏览器展示（纯 HTML+CSS+JS）
- **GitHub**：https://github.com/bailacking/StockLight
- **默认分支**：`main`
- **许可证**：MIT
- **项目状态**：全部功能已实现，61 个单元测试通过，CI/CD 通过

## 核心数据流

```
codes.txt → kline_update.py → data/date/raw/{code}.csv
                                       ↓
fetch_data.py (--names / --realtime) → stocks_meta.csv + stocks_realtime.csv
                                       ↓
preprocess.py → web/data/summary.json + web/data/kline/{code}.json
                                       ↓
start_server.py → 浏览器 (0.0.0.0:8000)
```

## 开发指引

### 环境要求

- Python 3.10+，`requests>=2.25.0`，`pytest>=7.0`，`ruff>=0.6.0`
- 前端：纯原生，**无** Vue/React/jQuery
- 数据源：腾讯财经（主）+ 新浪财经（备）
- 无数据库，无用户系统

### 常用命令

| 命令 | 用途 |
|---|---|
| `ruff check scripts/ tests/ server/start_server.py` | 代码检查（lint） |
| `pytest tests/ -v` | 运行全部测试 |
| `python scripts/kline_update.py --full` | 全量采集日 K |
| `python scripts/kline_update.py --incremental` | 增量采集日 K |
| `python scripts/fetch_data.py --names` | 采集股票名称 |
| `python scripts/fetch_data.py --realtime` | 采集实时行情 |
| `python scripts/preprocess.py` | 预处理生成前端 JSON |
| `python server/start_server.py` | 启动 HTTP 服务（0.0.0.0:8000） |

### 关键文件

| 文件 | 作用 |
|---|---|
| `scripts/kline_update.py` | 日 K 采集 `--full` / `--incremental` |
| `scripts/fetch_data.py` | 名称 `--names` / 实时行情 `--realtime` |
| `scripts/preprocess.py` | 计算 MA5/10/20/60、振幅、RSI6 → 生成 JSON |
| `scripts/stocklight/config.py` | 路径/接口/限速配置 |
| `scripts/stocklight/utils.py` | HTTP 请求/CSV 读写/格式化工具 |
| `pyproject.toml` | 项目元数据 + ruff/pytest 配置 |
| `.github/workflows/python-app.yml` | CI/CD：lint + 矩阵测试 |
| `tests/` | 61 个单元测试（test_config / test_preprocess / test_utils） |
| `server/start_server.py` | HTTP 服务（含 Cache-Control） |
| `web/index.html` | 股票列表主页（筛选/排序/分页/深色模式） |
| `web/detail.html` | 个股详情页（K 线图/十字光标/滚动） |
| `web/js/app.js` | 主页逻辑（缓存/渲染/自动刷新） |
| `web/js/table.js` | 表格排序/筛选/防抖/分页 |
| `web/js/detail.js` | 详情页逻辑（导航/加载） |
| `web/js/chart.js` | Canvas K 线图绘制 |
| `web/js/indicators.js` | 数值格式化（formatCompact 等） |
| `web/css/style.css` | 样式参考（已内联至 HTML） |
| `stock_api_specs.json` | 数据源接口规格 |
| `codes.txt` | 3199 条股票代码 |
| `启动程序.bat` | 根目录集成菜单（启动服务/初始化/更新） |
| `CHANGELOG.md` | 版本更新日志 |
| `CONTRIBUTING.md` | 贡献指南 |
| `SECURITY.md` | 安全策略 |
| `StockLight.md` | **完整工程规格说明书** |
| `AGENT.md` | **本文件 — AI 助手快速指南** |

### 批处理脚本（server/）

| 脚本 | 用途 |
|---|---|
| `启动服务.bat` | 启动 HTTP 服务 + 打开浏览器 |
| `初始化数据.bat` | 首次全量设置（全量日K + 名称+实时 + 预处理） |
| `更新数据.bat` | 日常更新（增量日K + 实时 + 预处理） |
| `更新日K.bat` | 仅增量日 K |
| `获取股票名称.bat` | 仅采集名称 |
| `获取实时行情.bat` | 仅采集实时行情 |
| `预处理数据.bat` | 仅预处理 |

## GitHub 协作

- **远程仓库**：`origin` → `https://github.com/bailacking/StockLight.git`
- **提交规范**：使用语义化提交，如 `feat:` / `fix:` / `docs:` / `refactor:` / `test:`
- **推送规则**：先 `git pull` 同步，再 `git push`
- **CI/CD**：推送到 `main` 自动触发 lint + 矩阵测试（Python 3.10~3.13）

## ⚠️ 操作规则（必须遵守）

1. **及时更新工程文档** — 每次改动后同步更新 `StockLight.md`
2. **需求分析** — 分析用户需求，有遗漏点先询问，确认后再执行
3. **修改前询问** — 创建或修改文件前先询问用户，等用户说"确认执行"再动手
4. **大规模改动** — 不好改的地方就扩大范围重写；耗时长时实时告知当前进度
5. **版本管理** — 未经用户确认，不得擅自修改版本号。新功能完成后询问用户：插入工程文档（StockLight.md）还是列入版本记录
6. **及时推送到 GitHub** — 每次改动完成后及时 `git add → git commit → git push`
