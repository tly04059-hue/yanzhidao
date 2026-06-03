# Miniapp 微信隐私合规修复与后台文案

更新时间：2026-06-01

适用目录：`/Users/march/yanzhidao/miniapp`

适用 AppID：`wx72386d5026c9782a`

## 1. 这次微信提示的直接原因

当前 `miniapp` 里已确认调用了微信认定的隐私接口：

1. `uni.saveImageToPhotosAlbum`
2. 对应微信接口：`wx.saveImageToPhotosAlbum`
3. 对应隐私类型：`使用你的相册（仅写入）权限`

代码位置：

1. `miniapp/src/pages/downloads/index.vue`
2. `miniapp/src/pages/zexiao/index.vue`

已补的代码侧兜底：

1. 新增 `miniapp/src/api/privacy.ts`
2. 保存图片前先调用 `wx.requirePrivacyAuthorize`
3. `miniapp/src/manifest.json` 已显式加上 `__usePrivacyCheck__: true`

注意：代码兜底不能替代微信后台声明。真正解除平台提示，仍需在微信小程序后台补齐《用户隐私保护指引》与服务内容声明。

## 2. 当前 miniapp 的隐私数据处理全景

### 2.1 已确认的用户信息/设备信息处理

#### A. 用户主动保存图片到系统相册

触发点：

1. `pages/zexiao/index` 保存择校长图
2. `pages/downloads/index` 保存图片资料

特点：

1. 仅在用户主动点击后触发
2. 写入用户本机系统相册
3. 前端不会把“相册内容”上传回你们服务器

#### B. 用户问卷答案写入本地缓存

代码位置：`miniapp/src/pages/test/index.vue`

当前写入本地存储的键：

1. `yz_quiz_normalized`
2. `yz_quiz_profile`
3. `yz_quiz_skipped`
4. `yz_quiz_dp`
5. `yz_quiz_result`

字段内容主要包括：

1. 工作系统
2. 党员状态
3. 所在省份/区域
4. 学历
5. 年龄段
6. 目标
7. 岗位方向
8. 预算
9. 英数顾虑与 DP 追问结果
10. 推荐结果摘要

说明：

1. 这些信息属于业务问卷信息
2. 当前代码表现为“本地缓存后本地计算结果”
3. 未在当前运行代码中发现将整份答题答案直接上报到埋点接口

#### C. 会话 ID 与微信场景值用于埋点

代码位置：

1. `miniapp/src/api/request.ts`
2. `miniapp/src/api/tracking.ts`

当前运行代码实际会上报的主要字段：

1. `session_id`
2. `page`
3. `source`
4. `route`
5. `from_route`
6. `position`
7. `scene`
8. `target_type`
9. `target_id`
10. `target_name`

说明：

1. `session_id` 是本地生成的随机会话标识，不是手机号或微信号
2. `scene` 来自 `getEnterOptionsSync` / `getLaunchOptionsSync`
3. 当前代码里实际通用上报的是 `page_view` / `nav_click` / `tab_click`
4. 文档里写过 `finish_assessment.answers` 等扩展字段，但当前源码未发现对应真实上报实现

#### D. 联系页展示企业微信/公众号二维码

代码位置：`miniapp/src/pages/contact/index.vue`

说明：

1. 当前是展示静态二维码图片
2. 使用了 `uni.previewImage`
3. 未发现直接读取通讯录、手机号、微信号输入框或剪贴板

#### E. 学员案例匿名展示

代码位置：

1. `miniapp/src/data/student-cases-publish.json`
2. `miniapp/src/data/peer-insights.ts`

当前特征：

1. 发布层含 `privacy_note`
2. 展示名以 `刘女士`、`唐女士`、`王 X` 这类匿名/弱实名形式出现
3. 未扫到手机号、身份证号、家庭地址、详细单位全称

### 2.2 本轮未发现的高风险微信隐私接口

当前 `miniapp` 未扫到以下接口调用：

1. `getPhoneNumber`
2. `getRealtimePhoneNumber`
3. `getLocation`
4. `chooseLocation`
5. `chooseAddress`
6. `chooseImage`
7. `chooseMedia`
8. `camera`
9. `record`
10. `getClipboardData`
11. `setClipboardData`
12. 蓝牙相关接口

## 3. 微信后台需要勾选什么

路径：

1. 登录 [微信小程序后台](https://mp.weixin.qq.com/)
2. `设置`
3. `服务内容声明`
4. `用户隐私保护指引`

本项目当前至少需要声明：

1. `使用你的相册（仅写入）权限`

对应触发接口：

1. `wx.saveImageToPhotosAlbum`

对应真实业务目的：

1. 用户主动保存择校建议长图到手机相册
2. 用户主动保存资料下载页中的图片资料到手机相册

## 4. 可直接填写的后台文案

### 4.1 服务内容声明里的用途描述

可直接填写为：

`用于在用户主动点击“保存到手机相册”或下载图片资料时，将用户选择保存的图片写入其设备系统相册，便于用户后续查看、留存或转发。该能力仅在用户主动触发相关按钮后调用，不会在未经用户主动操作时写入相册。`

### 4.2 《用户隐私保护指引》核心文案

以下文案可作为后台填写底稿，带 `【待替换】` 的内容需你们补成真实主体信息。

#### 小程序开发者信息

开发者名称：

`【待替换：公司主体全称】`

#### 处理信息及用途

`1. 当你在小程序内主动点击“保存到手机相册”或下载图片资料时，我们会申请使用你的相册（仅写入）权限，用于将你选择保存的图片写入你的设备系统相册，便于你后续查看、留存或转发。`

`2. 当你使用“测一测”“估分”等功能时，我们会处理你主动填写的问卷信息与分数信息，用于在小程序内生成择校建议、估分结果和相关内容展示。`

`3. 当你浏览页面、点击页面按钮时，我们可能记录必要的页面访问和操作信息，如页面标识、来源、路由、会话标识、微信场景值等，用于统计页面使用情况、优化产品体验和排查故障。`

#### 处理规则

`1. 我们仅在本指引所述目的范围内使用相关信息。`

`2. 相册写入能力仅在你主动触发保存操作时调用；不同意该权限不会影响你浏览小程序的其他基础内容，但会影响图片保存功能。`

`3. 问卷信息主要用于生成你在当前小程序内看到的诊断结果与建议。`

`4. 我们不会主动向第三方出售你的个人信息。`

#### 信息存储说明

`1. 你主动保存到系统相册的图片保存在你的设备本地系统相册中，不会因为该保存动作额外上传至我们的服务器。`

`2. 你在小程序内填写的部分问卷结果和推荐结果，当前可能以本地缓存形式保存在你的设备中，用于结果页与长图页回显。`

`3. 如涉及服务端统计数据，我们会按业务运营与排障所需的最短必要期限保存。`

#### 用户权利与联系方式

`如你希望咨询、查阅、更正、删除相关信息，或对未成年人个人信息保护有疑问，可通过以下方式联系我们：`

`联系邮箱：【待替换：客服/法务邮箱】`

`联系主体：【待替换：公司主体全称】`

`联系地址：成都市高新区天府五街【待补充详细地址】`

#### 日期

更新日期：

`2026-06-01`

生效日期：

`2026-06-01`

## 5. 可上传的补充文档建议

微信后台支持上传 `.txt` 纯文本补充文档。仓库内已同步准备一份：

1. `miniapp/docs/wechat-privacy-supplement-2026-06-01.txt`

上传前请先替换其中的：

1. 公司主体全称
2. 联系邮箱
3. 详细地址

## 6. 还建议你们补的合规动作

### P0 必做

1. 在微信后台勾选 `使用你的相册（仅写入）权限`
2. 填写真实用途说明
3. 填写真实开发者主体与联系方式
4. 确认提审时不要再勾“未采集隐私”

### P1 建议做

1. 在小程序内补一个“隐私说明/用户隐私保护指引”入口页
2. 把当前本地缓存的问卷结果加上过期时间或清理策略
3. 将埋点设计文档与真实实现对齐，避免文档里声明会上传 `answers`，但代码实际并未这样做
4. 如果后续启用 `leadApi.submit`、手机号收集、留资表单，需要同步更新微信后台隐私声明

### P2 发布前复测

1. 真机删除最近使用记录或清除授权缓存
2. 重新进入小程序
3. 进入 `择校长图` 页点击保存图片
4. 进入 `资料下载` 页点击保存图片
5. 确认首次触发时隐私授权逻辑与保存成功路径正常

## 7. 关键代码索引

1. `miniapp/src/pages/downloads/index.vue`
2. `miniapp/src/pages/zexiao/index.vue`
3. `miniapp/src/api/privacy.ts`
4. `miniapp/src/api/request.ts`
5. `miniapp/src/api/tracking.ts`
6. `miniapp/src/pages/test/index.vue`
7. `miniapp/src/pages/result/index.vue`
8. `miniapp/src/pages/contact/index.vue`
9. `miniapp/src/data/student-cases-publish.json`

