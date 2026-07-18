# 贡献指南

感谢你考虑为 StockLight 贡献代码。

## 开发环境

- Python 3.10+
- `pip install -r requirements.txt`

## 代码规范

- 提交前运行 `ruff check scripts/ tests/ server/start_server.py` 确保无 lint 错误
- 运行 `pytest tests/ -v` 确保所有测试通过
- 使用中文注释和英文变量名/函数名

## 提交规范

采用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat: 新功能
fix: 修复
refactor: 重构
test: 测试相关
docs: 文档
chore: 构建/配置
ci: CI 相关
```

## PR 流程

1. Fork 仓库并创建功能分支
2. 提交变更
3. 确保测试通过、无 lint 错误
4. 发起 Pull Request 到 `main` 分支
