# 推荐方案库

`courseRecommendationStrategy/` 用来存放“测一测”提前生成的推荐策略方案。

## 分层

```text
sourceData/      策略种子和人工可编辑源文件
standardized/    L1 标准化策略库
publish/         L2 小程序发布策略库
```

小程序不直接读取 `sourceData/`，只读取同步后的：

```text
miniapp/src/data/recommendation-strategies-publish.json
```

## 当前口径

- 用户完成 8 题后，不实时生成全新方案。
- 小程序会把用户答案与 L2 策略库做相似度匹配。
- 命中最高的策略用于展示路径、院校筛选建议、风险提示和本周计划。
- 院校推荐仍从小程序院校发布库中按专业、省份、预算筛选。
