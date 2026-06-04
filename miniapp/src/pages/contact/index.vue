<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">加企微 1 对 1 咨询</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page">
      <view class="brand-row">已服务 1,000+ 川渝同学 · 不骗人 · 真服务</view>

      <view class="hero-card">
        <text class="kicker-cn">1 对 1 顾问</text>
        <text class="hero-title">不骗人，真服务{{'\n'}}请放心聊</text>
        <text class="hero-copy">结合我们知道的数据、信息和经验，助你把想法、方向变成清晰的判断、计划、行动。</text>
      </view>

      <!-- 顾问名片卡 -->
      <view class="consultant-card-v6">
        <view class="consultant-avatar-v6">
          <image class="avatar-logo" src="/static/Logo研.svg" mode="aspectFit" />
        </view>
        <text class="consultant-name-v6">扫码咨询</text>
        <text class="consultant-title-v6">已服务超过 1,000 名川渝在职同学</text>

        <view class="qr-area">
          <view class="qrcode-grid">
            <view class="qrcode-card" v-for="item in qrcodes" :key="item.label" @click="openQR(item)">
              <image class="qrcode-image" :src="item.src" mode="aspectFit" :show-menu-by-longpress="true" />
              <text class="qrcode-label">{{ item.label }}</text>
            </view>
          </view>
          <text class="qr-hint">微信扫码添加 · 备注「小程序」</text>
        </view>
      </view>

      <!-- 放大浮层 -->
      <view v-if="activeQR" class="qr-overlay" @click="closeQR">
        <view class="qr-overlay-box" @click.stop>
          <image class="qr-overlay-image" :src="activeQR.src" mode="aspectFit" :show-menu-by-longpress="true" @click.stop="previewQR(activeQR.src)" />
          <text class="qr-overlay-label">{{ activeQR.label }}</text>
          <text class="qr-overlay-tip">长按识别二维码</text>
        </view>
      </view>

      <!-- 顾问能帮你什么 -->
      <view class="note-card">
        <text class="help-title">顾问能帮你什么</text>
        <text class="note-card-text" v-for="item in helpItems" :key="item" style="margin-top: 12px; display: block;">· {{ item }}</text>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { trackContactClick, trackPageView } from '@/api/tracking'
import { remoteAssets } from '@/data/remote-assets'
import { usePageShare } from '@/utils/share'

usePageShare({
  title: '和研知道顾问聊聊在职考研路径',
  path: '/pages/contact/index'
})

interface QRItem { label: string; src: string }

const activeQR = ref<QRItem | null>(null)

const qrcodes: QRItem[] = [
  { label: '企业微信', src: remoteAssets.contact.enterpriseWechatQr },
  { label: '公众号', src: remoteAssets.contact.officialAccountQr },
]

const openQR = (item: QRItem) => {
  trackContactClick('contact', 'qr_open', item.label, '', {
    target_id: item.label,
    target_name: item.label
  })
  activeQR.value = item
}
const closeQR = () => { activeQR.value = null }
const previewQR = (src: string) => {
  uni.previewImage({ current: src, urls: [src], showmenu: true })
}

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/index/index' })
}

const helpItems = [
  '把你的小程序建议结果转成具体动作清单',
  '给出 1-3 个院校的针对性建议',
  '解答政策、报考、备考、复试相关问题',
  '提供信息，不推销不打扰',
  '带你进入备考群，与更多备考同学交流',
]

onMounted(() => trackPageView('contact'))
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";

.shell { background: #FAF7F2; min-height: 100vh; }

.avatar-logo {
  width: 28px;
  height: 36px;
  display: block;
}

.qr-area { margin-top: 16px; }

.qrcode-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.qrcode-card {
  padding: 12px;
  border-radius: 16px;
  background: #FAF6EF;
  border: 0.5px solid #ECE5D8;
  text-align: center;
  cursor: pointer;
}

.qrcode-image {
  width: 100%;
  height: 140px;
  display: block;
}

.qrcode-label {
  display: block;
  margin-top: 8px;
  color: #2A251E;
  font-size: 12px;
}

.qr-hint {
  display: block;
  text-align: center;
  font-size: 12px;
  color: #8A8175;
  margin-top: 8px;
}

.help-title {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 15px;
  font-weight: 600;
  color: #2A251E;
  margin-bottom: 12px;
}

.qr-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.72);
  padding: 40px 32px;
}

.qr-overlay-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px 28px 20px;
  max-width: 320px;
  width: 100%;
}

.qr-overlay-image { width: 240px; height: 240px; border-radius: 8px; }
.qr-overlay-label { margin-top: 14px; font-size: 15px; font-weight: 600; color: #2A251E; display: block; }
.qr-overlay-tip { margin-top: 6px; font-size: 12px; color: #8A8175; display: block; }


</style>
