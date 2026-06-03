# 阿里云 OSS 静态资源迁移操作手册

> 创建日期：2026-06-03
> 目标：将微信小程序中大体积静态资源迁移到阿里云 OSS，减小主包体积，并实现换图无需重新发布。

---

## 目录

1. [架构说明](#1-架构说明)
2. [一次性操作（上线前必须完成）](#2-一次性操作上线前必须完成)
3. [后续换图操作（无需重新发布小程序）](#3-后续换图操作无需重新发布小程序)
4. [添加新资源](#4-添加新资源)
5. [故障恢复](#5-故障恢复)
6. [参考信息](#6-参考信息)

---

## 1. 架构说明

```
微信小程序
  ↓ 启动时请求一次
https://yanzhidao.com/static/assets-config.json
  ↓ 获取资源 URL 列表
  ↓ 页面渲染时加载
https://toutu-videos.oss-cn-chengdu.aliyuncs.com/miniapp/build.jpg?v=1
```

- **assets-config.json** 存放在服务器上，通过 nginx 暴露为静态文件
- **图片文件**存放在阿里云 OSS（toutu-videos bucket）
- **版本号**（`?v=1`）用于控制缓存：换图时只改版本号，小程序自动加载新图

---

## 2. 一次性操作（上线前必须完成）

### 2.1 OSS 上传文件（已完成 ✓）

以下文件已上传到阿里云 OSS Bucket `toutu-videos`，路径前缀为 `miniapp/`：

| 文件名 | OSS URL |
|--------|---------|
| `build.jpg` | `https://toutu-videos.oss-cn-chengdu.aliyuncs.com/miniapp/build.jpg` |
| `door.jpg` | `https://toutu-videos.oss-cn-chengdu.aliyuncs.com/miniapp/door.jpg` |
| `service-map.svg` | `https://toutu-videos.oss-cn-chengdu.aliyuncs.com/miniapp/service-map.svg` |
| `wechat-official-qrcode.jpg` | `https://toutu-videos.oss-cn-chengdu.aliyuncs.com/miniapp/wechat-official-qrcode.jpg` |
| `26四川党校考前必背一页纸.jpg` | `https://toutu-videos.oss-cn-chengdu.aliyuncs.com/miniapp/26四川党校考前必背一页纸.jpg` |
| `26四川党校-政治学.pdf` | `https://toutu-videos.oss-cn-chengdu.aliyuncs.com/miniapp/26四川党校-政治学.pdf` |
| `26四川党校-法学.pdf` | `https://toutu-videos.oss-cn-chengdu.aliyuncs.com/miniapp/26四川党校-法学.pdf` |
| `26四川党校-经济学.pdf` | `https://toutu-videos.oss-cn-chengdu.aliyuncs.com/miniapp/26四川党校-经济学.pdf` |

> ⚠️ 确认每个文件在 OSS 控制台已设置为「公共读」权限。

### 2.2 创建 assets-config.json

在项目根目录创建 `assets-config.json`：

```bash
cd /Users/march/yanzhidao
```

文件内容：

```json
{
  "version": 1,
  "baseUrl": "https://toutu-videos.oss-cn-chengdu.aliyuncs.com/miniapp",
  "assets": {
    "build": "build.jpg",
    "door": "door.jpg",
    "serviceMap": "service-map.svg",
    "wechatOfficialQrcode": "wechat-official-qrcode.jpg",
    "scPartyOnePage": "26四川党校考前必背一页纸.jpg",
    "scPartyPolitical": "26四川党校-政治学.pdf",
    "scPartyLaw": "26四川党校-法学.pdf",
    "scPartyEconomics": "26四川党校-经济学.pdf"
  }
}
```

### 2.3 上传 assets-config.json 到服务器

```bash
scp assets-config.json root@47.108.212.185:/var/www/yanzhidao/static/
```

### 2.4 确认服务器 nginx 已配置 /static/ 路径

SSH 登录服务器检查：

```bash
ssh root@47.108.212.185
sudo nginx -T | grep -A5 "location /static"
```

如果**没有** `/static/` 的 location 配置，添加以下内容到 nginx 配置文件中：

```nginx
location /static/ {
    alias /var/www/yanzhidao/static/;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
}
```

然后重载 nginx：

```bash
sudo nginx -t && sudo nginx -s reload
```

### 2.5 验证配置可访问

在浏览器或命令行验证：

```bash
curl https://yanzhidao.com/static/assets-config.json
```

应该返回 JSON 内容。

### 2.6 修改小程序代码

#### 2.6.1 新建 OSS 辅助工具文件

创建文件 `miniapp/src/utils/oss.ts`，内容如下：

```typescript
/**
 * OSS 资产配置
 * 从服务端获取动态图片 URL，换图时无需重新发布小程序
 */

interface AssetConfig {
  version: number
  baseUrl: string
  assets: Record<string, string>
}

let cachedConfig: AssetConfig | null = null

const CONFIG_URL = 'https://yanzhidao.com/static/assets-config.json'

/**
 * 获取 OSS 资产配置（带本地缓存）
 */
export async function getAssetConfig(): Promise<AssetConfig | null> {
  if (cachedConfig) return cachedConfig

  try {
    const res = await uni.request({ url: CONFIG_URL, timeout: 5000 })
    const data = res.data as any
    if (data && data.assets && data.baseUrl) {
      cachedConfig = res.data as AssetConfig
      return cachedConfig
    }
  } catch (e) {
    console.warn('[OSS] 获取资产配置失败，使用本地 fallback')
  }
  return null
}

/**
 * 根据 key 获取完整 OSS URL
 * @param key - assets-config.json 中定义的 key
 * @param fallback - 本地 fallback 路径（可选）
 * @returns 完整 URL 字符串
 */
export function getOssUrl(key: string, fallback?: string): string {
  if (cachedConfig) {
    const asset = cachedConfig.assets[key]
    if (asset) {
      return `${cachedConfig.baseUrl}/${asset}?v=${cachedConfig.version}`
    }
  }
  return fallback || ''
}

/**
 * 在 App 启动时调用，预加载配置
 */
export function initOssConfig(): void {
  getAssetConfig()
}
```

#### 2.6.2 在 App.vue 中初始化

在 `miniapp/src/App.vue` 的 `<script>` 部分：

```typescript
// 在现有 import 后添加
import { initOssConfig } from '@/utils/oss'

// 在 onLaunch 中调用
onLaunch(() => {
  // ... 现有代码 ...
  initOssConfig()
})
```

#### 2.6.3 修改各页面的图片引用

**文件 1：`miniapp/src/pages/about/index.vue`**

```html
<!-- 原来 -->
<image class="office-image" src="/static/build.jpg" mode="aspectFill" />
<image class="office-image" src="/static/door.jpg" mode="aspectFill" />

<!-- 改为 -->
<image class="office-image" :src="ossUrls.build" mode="aspectFill" />
<image class="office-image" :src="ossUrls.door" mode="aspectFill" />
```

在 `<script setup>` 中添加：

```typescript
import { getOssUrl } from '@/utils/oss'

const ossUrls = {
  build: getOssUrl('build', '/static/build.jpg'),
  door: getOssUrl('door', '/static/door.jpg'),
}
```

**文件 2：`miniapp/src/pages/map/index.vue`**

```html
<!-- 原来 -->
<image class="map-base" src="/static/map/service-map.svg" mode="widthFix" />

<!-- 改为 -->
<image class="map-base" :src="ossUrls.serviceMap" mode="widthFix" />
```

```typescript
import { getOssUrl } from '@/utils/oss'

const ossUrls = {
  serviceMap: getOssUrl('serviceMap', '/static/map/service-map.svg'),
}
```

**文件 3：`miniapp/src/pages/contact/index.vue`**

```typescript
import { getOssUrl } from '@/utils/oss'

const qrcodes: QRItem[] = [
  { label: '企业微信', src: '/static/contact/wechat-miniapp-qrcode.png' },
  { label: '公众号', src: getOssUrl('wechatOfficialQrcode', '/static/contact/wechat-official-qrcode.jpg') },
]
```

**文件 4：`miniapp/src/pages/zexiao/index.vue`**

```typescript
import { getOssUrl } from '@/utils/oss'

const footerQRCodes = [
  { label: '企业微信', src: '/static/contact/wechat-miniapp-qrcode.png' },
  { label: '公众号', src: getOssUrl('wechatOfficialQrcode', '/static/contact/wechat-official-qrcode.jpg') },
]
```

**文件 5：`miniapp/src/data/v5/downloads.ts`**

```typescript
// 原来
fileSrc: '/pages/downloads/static/26四川党校考前必背一页纸.jpg',

// 改为
fileSrc: 'https://toutu-videos.oss-cn-chengdu.aliyuncs.com/miniapp/26四川党校考前必背一页纸.jpg',
```

> **注意**：downloads.ts 是纯数据文件，不参与 Vue 渲染，且 `wx.downloadFile` 需要完整 URL，这里直接硬编码 OSS 地址更简单。

### 2.7 删除本地文件

以下文件将从项目中删除，不再打包进小程序：

```bash
cd /Users/march/yanzhidao/miniapp

# 已上传 OSS 的大文件
rm src/static/build.jpg
rm src/static/door.jpg
rm src/static/map/service-map.svg
rm src/static/contact/wechat-official-qrcode.jpg
rm src/pages/downloads/static/26四川党校考前必背一页纸.jpg

# 未被任何代码引用的冗余文件
rm src/static/logo.png
rm src/static/logo-white.png
rm src/static/school-mba.png
rm src/static/school-mem.png
rm src/static/school-mpa.png
rm src/static/school-party-cq.png
rm src/static/school-party-sc.png

# 未被引用的 SVG icon
rm src/static/icons/icon-benefit.svg
rm src/static/icons/icon-cost.svg
rm src/static/icons/icon-lock.svg
rm src/static/icons/nav-share.svg
rm src/static/icons/nav-share-white.svg
rm src/static/icons/tab-contact.svg
rm src/static/icons/tab-contact-active.svg
rm src/static/icons/tab-home.svg
rm src/static/icons/tab-home-active.svg
rm src/static/icons/tab-learn.svg
rm src/static/icons/tab-learn-active.svg
rm src/static/icons/tab-test.svg
rm src/static/icons/tab-test-active.svg

# 模板文件（不应打包）
rm src/static/icons/schools/logo_manifest.template.json
rm src/static/icons/schools/logo_manifest.template.csv
```

### 2.8 重新构建并验证

```bash
cd /Users/march/yanzhidao/miniapp

# 删除旧构建产物
rm -rf dist/build/mp-weixin

# 重新构建
NODE_ENV=production npm run build:mp-weixin

# 检查主包大小（应显著减小）
du -sh dist/build/mp-weixin/
```

### 2.9 上传微信小程序

构建完成后，用微信开发者工具导入 `dist/build/mp-weixin`，验收通过后上传到微信后台提交审核。

---

## 3. 后续换图操作（无需重新发布小程序）

### 当你想替换某张图片时

**Step 1：在 OSS 控制台覆盖上传**

1. 登录 https://oss.console.aliyun.com
2. 进入 `toutu-videos` Bucket → 打开 `miniapp/` 目录
3. 选择要替换的文件 → 点击「上传」（覆盖）
4. 确认新文件已上传

**Step 2：修改版本号**

编辑本地的 `assets-config.json`，将 `version` 加 1：

```json
{
  "version": 2,
  ...
}
```

**Step 3：上传新配置到服务器**

```bash
scp assets-config.json root@47.108.212.185:/var/www/yanzhidao/static/
```

**Step 4：验证**

```bash
curl https://yanzhidao.com/static/assets-config.json
```

确认返回的 `version` 已经是新版本号。

**结果**：用户下次打开小程序时，图片 URL 末尾的 `?v=2` 会触发微信重新下载，自动显示新图。

> ⚠️ 注意：已打开小程序的用户需要**退出重进**才会生效，因为配置只在 `onLaunch` 时加载一次。

### 如果用户已经在看旧图，想立即刷新

可以在 App.vue 的 `onShow` 里也检查版本号，发现变化后强制刷新的图片。这个功能按需再加。

---

## 4. 添加新资源

### 新增一个图片/文件到 OSS

**Step 1：上传到 OSS**

登录 OSS 控制台 → `toutu-videos/miniapp/` → 上传文件

**Step 2：在 assets-config.json 中添加**

```json
{
  "version": 1,
  "baseUrl": "https://toutu-videos.oss-cn-chengdu.aliyuncs.com/miniapp",
  "assets": {
    ...,
    "newImage": "new-image.jpg"
  }
}
```

**Step 3：上传配置到服务器**

```bash
scp assets-config.json root@47.108.212.185:/var/www/yanzhidao/static/
```

**Step 4：在小程序代码中使用**

```typescript
import { getOssUrl } from '@/utils/oss'

const imgUrl = getOssUrl('newImage', '/static/fallback.jpg')
```

---

## 5. 故障恢复

### 场景 1：服务器上的 assets-config.json 挂了

小程序会自动使用代码中传入的 `fallback` 本地路径，不会白屏。

检查服务器：

```bash
ssh root@47.108.212.185
ls -la /var/www/yanzhidao/static/assets-config.json
cat /var/www/yanzhidao/static/assets-config.json
```

如果文件丢失，重新上传：

```bash
scp assets-config.json root@47.108.212.185:/var/www/yanzhidao/static/
```

### 场景 2：OSS 上的图片加载失败

小程序有 fallback 机制。检查 OSS 控制台确认：
- 文件是否存在
- 文件权限是否为「公共读」

### 场景 3：需要回滚到本地文件

把代码中的 `getOssUrl()` 调用改回 `/static/xxx.jpg` 直接路径即可，但需要重新构建和发布小程序。

---

## 6. 参考信息

| 项目 | 地址 |
|------|------|
| 阿里云 OSS 控制台 | https://oss.console.aliyun.com |
| Bucket 名称 | `toutu-videos` |
| 区域 | 成都 `oss-cn-chengdu` |
| OSS 资源路径 | `https://toutu-videos.oss-cn-chengdu.aliyuncs.com/miniapp/` |
| 服务器 IP | `47.108.212.185` |
| 配置文件 URL | `https://yanzhidao.com/static/assets-config.json` |
| 微信后台（配域名） | https://mp.weixin.qq.com |
| downloadFile 合法域名 | `https://toutu-videos.oss-cn-chengdu.aliyuncs.com` |
| 小程序 AppID | `wx72386d5026c9782a` |
