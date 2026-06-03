/**
 * 远程静态资源（阿里云 OSS）
 * 这些资源已从本地删除，统一从 OSS 加载以减小主包体积。
 *
 * 换图步骤（无需重新发布小程序）：
 * 1. 在 OSS 覆盖上传同名文件
 * 2. 在 CDN 控制台刷新对应文件的缓存
 *
 * 前提：OSS 上 miniapp/ 目录已设置 Cache-Control: max-age=3600（缓存1小时），
 * 微信小程序会按此头刷新，覆盖上传+CDN刷新后最多1小时全量生效。
 */
const OSS_BASE = 'https://toutu-videos.oss-cn-chengdu.aliyuncs.com/miniapp'

export const remoteAssets = {
  downloads: {
    onePageImage: `${OSS_BASE}/26%E5%9B%9B%E5%B7%9D%E5%85%9A%E6%A0%A1%E8%80%83%E5%89%8D%E5%BF%85%E8%83%8C%E4%B8%80%E9%A1%B5%E7%BA%B8.jpg`,
    politicsJpg: `${OSS_BASE}/%E6%94%BF%E6%B2%BB%E5%AD%A6.jpg`,
    economicsJpg: `${OSS_BASE}/%E7%BB%8F%E6%B5%8E%E5%AD%A6.jpg`,
    lawJpg: `${OSS_BASE}/%E6%B3%95%E5%AD%A6.jpg`
  },
  contact: {
    enterpriseWechatQr: `${OSS_BASE}/wechat-miniapp-qrcode.png`,
    officialAccountQr: `${OSS_BASE}/wechat-official-qrcode.jpg`
  },
  about: {
    build: `${OSS_BASE}/build.jpg`,
    door: `${OSS_BASE}/door.jpg`
  },
  map: {
    serviceMap: `${OSS_BASE}/service-map.svg`
  }
} as const
