# projectOps 最小总控层与提测流水线

> 更新时间：2026-05-15  
> 目标：建立一个控制整个大项目的数据更新、同步、校验和构建入口，避免院校库、案例库、小程序之间靠人工手工搬文件。

## 1. 为什么需要 projectOps

当前项目已经拆成多个职责目录：

- `miniapp/`：微信小程序，负责页面、交互和展示。
- `schoolData/`：院校库，负责源数据、标准化数据和发布数据。
- `studentCases/`：学生案例库，负责源数据、匿名标准化数据和发布数据。
- `courseRecommendationStrategy/`：推荐方案库，后续负责测一测策略方案。
- `AIAgent/`：清洗脚本、数据飞轮和 AI 相关中间能力。

小程序依赖多个目录的发布数据。如果没有总控层，每次更新都要人工记住脚本顺序，容易出现：

- 数据清洗了但没同步到小程序。
- 小程序构建的是旧数据。
- 案例库隐私字段误入发布层。
- MEM、MPA、MBA 顺序或数据口径被不同脚本改乱。
- 提测前没有统一检查报告。

因此新增 `projectOps/` 作为中控台。

## 2. projectOps 边界

`projectOps/` 不承载业务数据，不写页面逻辑，不替代各业务目录。

它只负责：

1. 调度数据更新。
2. 同步 L2 发布数据到小程序。
3. 校验 JSON、数量、隐私字段和核心口径。
4. 统一执行小程序类型检查和构建。
5. 输出提测/发版报告。

## 3. 已建立的最小结构

```text
projectOps/
  README.md
  config/
    data-pipeline.json
    release-checklist.json
  scripts/
    update-all.py
    sync-miniapp-data.py
    check-all.py
    build-miniapp.py
    release.py
  reports/
    latest-update-report.json
    latest-sync-report.json
    latest-check-report.json
    latest-build-report.json
    latest-release-report.json
```

## 4. 当前最小流水线

分步执行：

```bash
python3 projectOps/scripts/update-all.py
python3 projectOps/scripts/sync-miniapp-data.py
python3 projectOps/scripts/check-all.py
python3 projectOps/scripts/build-miniapp.py --target h5
```

一键执行：

```bash
python3 projectOps/scripts/release.py --target h5
```

微信小程序构建：

```bash
python3 projectOps/scripts/release.py --target mp-weixin
```

## 5. 当前覆盖范围

已接入：

- MEM HTML 数据重建。
- 管综院校 L2 发布数据生成，含 `MPA -> MEM -> MBA`。
- 学生案例 L1 匿名化和 L2 发布数据生成。
- 推荐方案库 L1 和 L2 发布数据生成。
- 发布数据同步到 `miniapp/src/data/`。
- JSON 可读性检查。
- 院校库最低数据量检查。
- 学生案例最低数据量检查。
- 学生案例隐私扫描。
- 推荐策略最低数量和路径覆盖检查。
- 小程序 `type-check` 和 H5/微信小程序构建入口。

暂未完全接入：

- 党校完整院校库并入小程序。
- 自动浏览器页面冒烟测试。
- 用户行为/留资/反馈数据飞轮回写。

## 6. 后续原则

1. 跨目录更新优先走 `projectOps/`，不要手工复制发布数据。
2. 子项目只做自己的事：数据目录管数据，小程序管展示，中控台管流程。
3. 每次新增数据域，都要补 `projectOps/config/data-pipeline.json` 和 `check-all.py` 的最低校验。
4. 每次上线前，必须保留 `projectOps/reports/latest-release-report.json`。
