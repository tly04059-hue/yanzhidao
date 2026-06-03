<template>
  <page-meta :page-style="previewItem ? 'overflow: hidden;' : ''" />
  <view class="shell" :class="{ 'modal-open': previewItem }">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">资料下载</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page">
      <view class="brand-row">{{ content.brandLine }}</view>

      <view class="hero-card">
        <!-- <text class="kicker-cn">{{ content.hero.kicker }}</text> -->
        <text class="hero-title" style="font-size: 24px;">{{ content.hero.title }}</text>
        <!-- <text class="hero-copy">{{ content.hero.subtitle }}</text> -->
      </view>

      <view class="section">
        <!-- <view class="section-head">
          <text class="section-head-title">{{ content.section.title }}</text>
          <text class="section-head-meta">{{ content.section.meta }}</text>
        </view> -->

        <view class="dl-stack">
          <view class="dl-card" v-for="item in content.items" :key="item.id">
            <view class="dl-preview" v-if="item.type === 'image'">
              <image
                class="dl-preview-img"
                :class="{ 'dl-preview-img-top': item.previewMeta?.crop === 'top' }"
                :src="item.previewSrc"
                :mode="item.previewMeta?.crop === 'top' ? 'widthFix' : 'widthFix'"
                show-menu-by-longpress
              />
            </view>
            <view class="dl-preview dl-preview-doc" v-else>
              <text class="dl-doc-tag">{{ item.tag }}</text>
              <text class="dl-doc-title">{{ item.title }}</text>
              <text class="dl-doc-sub" v-if="item.previewMeta?.subtitle">{{ item.previewMeta.subtitle }}</text>
            </view>

            <view class="dl-info">
              <view class="dl-head">
                <text class="dl-title-text">{{ item.title }}</text>
                <!-- <text class="chip">{{ item.tag }}</text> -->
              </view>
              <text class="dl-note">{{ item.note }}</text>
              <view v-if="item.subjects?.length" class="dl-subject-list">
                <view v-for="subject in item.subjects" :key="subject.title" class="dl-subject-row">
                  <text class="dl-subject-title">{{ subject.title }}</text>
                  <view
                    class="dl-subject-btn"
                    :class="{ disabled: downloadingId === getDownloadKey(subject) }"
                    @click="handleDownload(subject)"
                  >{{ downloadingId === getDownloadKey(subject) ? '处理中' : '下载' }}</view>
                </view>
              </view>
            </view>

            <view v-if="!item.subjects?.length" class="dl-action-row">
              <view
                class="dl-btn"
                :class="{ disabled: downloadingId === item.id }"
                @click="handleDownload(item)"
              >{{ downloadingId === item.id ? '处理中...' : '点击下载' }}</view>
            </view>
          </view>
        </view>
      </view>

      <view class="note-card">
        <text class="note-card-text">{{ content.hint }}</text>
      </view>
    </view>

    <view v-if="previewItem" class="preview-modal-mask" @click="closePreview" @touchmove.stop.prevent>
      <view class="preview-modal" @click.stop @touchmove.stop>
        <view class="preview-modal-head">
          <text class="preview-modal-title">{{ previewItem.title }}</text>
          <view class="preview-close" @click="closePreview">×</view>
        </view>
        <scroll-view class="preview-scroll" scroll-y>
          <image class="preview-full-img" :src="previewItem.fileSrc" mode="widthFix" show-menu-by-longpress />
        </scroll-view>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { v6DownloadsContent } from '@/data/v5'
import { ensurePrivacyAuthorization } from '@/api/privacy'
import { trackNavClick, trackPageView } from '@/api/tracking'

type DownloadItem = (typeof v6DownloadsContent.items)[number]
type DownloadSubject = NonNullable<DownloadItem['subjects']>[number]
type DownloadTarget = DownloadItem | DownloadSubject

const content = v6DownloadsContent
const downloadingId = ref('')
const previewItem = ref<DownloadItem | null>(null)

const goBack = () => {
  trackNavClick('downloads', 'back', '/pages/index/index')
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack({ delta: 1 })
    return
  }
  uni.switchTab({ url: '/pages/index/index' })
}

const toast = (title: string, icon: 'none' | 'success' = 'none') => {
  uni.showToast({ title, icon, duration: 2200 })
}

const getDownloadKey = (item: DownloadTarget) => ('id' in item ? item.id : item.fileName)

const lockBodyScroll = (locked: boolean) => {
  // #ifdef H5
  document.body.style.overflow = locked ? 'hidden' : ''
  // #endif
}

const openPreview = (item: DownloadItem) => {
  previewItem.value = item
  lockBodyScroll(true)
}

const closePreview = () => {
  previewItem.value = null
  lockBodyScroll(false)
}

const withDownloadState = async (item: DownloadTarget, task: () => Promise<void>) => {
  downloadingId.value = getDownloadKey(item)
  try {
    await task()
  } finally {
    downloadingId.value = ''
  }
}

const saveImageToAlbum = (item: DownloadTarget) =>
  new Promise<void>((resolve, reject) => {
    uni.getImageInfo({
      src: item.fileSrc,
      success: ({ path }) => {
        uni.saveImageToPhotosAlbum({
          filePath: path,
          success: () => {
            toast('已保存到相册', 'success')
            resolve()
          },
          fail: (error) => {
            const message = String((error as { errMsg?: string })?.errMsg || '')
            if (message.includes('auth deny') || message.includes('authorize')) {
              uni.showModal({
                title: '需要相册权限',
                content: '请允许保存到相册，这样图片资料才能下载到手机中。',
                success: ({ confirm }) => {
                  if (confirm) uni.openSetting({})
                }
              })
            } else {
              toast('保存失败，请稍后重试')
            }
            reject(error)
          }
        })
      },
      fail: (error) => {
        toast('图片读取失败，请稍后重试')
        reject(error)
      }
    })
  })

const downloadByAnchor = (item: DownloadTarget) =>
  new Promise<void>((resolve, reject) => {
    try {
      const link = document.createElement('a')
      link.href = item.fileSrc
      link.download = item.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast('已开始下载', 'success')
      resolve()
    } catch (error) {
      toast('下载失败，请稍后重试')
      reject(error)
    }
  })

const openDocumentForWechat = (item: DownloadTarget) =>
  new Promise<void>((resolve, reject) => {
    // #ifdef MP-WEIXIN
    const fileType = item.fileType || 'pdf'
    const openDoc = (filePath: string) => {
      uni.openDocument({
        filePath,
        fileType,
        showMenu: true,
        success: () => {
          toast('文档已打开', 'success')
          resolve()
        },
        fail: (error) => {
          toast('文档暂时无法打开，请稍后重试')
          reject(error)
        }
      })
    }

    if (/^https?:\/\//.test(item.fileSrc)) {
      uni.downloadFile({
        url: item.fileSrc,
        success: ({ statusCode, tempFilePath }) => {
          if (statusCode >= 200 && statusCode < 300 && tempFilePath) {
            openDoc(tempFilePath)
            return
          }
          toast('下载失败，请稍后重试')
          reject(new Error(`download failed: ${statusCode}`))
        },
        fail: (error) => {
          toast('下载失败，请稍后重试')
          reject(error)
        }
      })
      return
    }

    openDoc(item.fileSrc)
    // #endif

    // #ifndef MP-WEIXIN
    downloadByAnchor(item).then(resolve).catch(reject)
    // #endif
  })

const handleDownload = (item: DownloadTarget) =>
  withDownloadState(item, async () => {
    if (item.type === 'image') {
      const privacyReady = await ensurePrivacyAuthorization()
      if (!privacyReady) {
        toast('未同意隐私授权，暂时无法保存图片')
        return
      }

      // #ifdef H5
      await downloadByAnchor(item)
      return
      // #endif

      // #ifndef H5
      await saveImageToAlbum(item)
      return
      // #endif
    }
    await openDocumentForWechat(item)
  })

onMounted(() => trackPageView('downloads'))
onUnmounted(() => lockBodyScroll(false))
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";

.shell { background: #FAF7F2; min-height: 100vh; }

.shell.modal-open {
  height: 100vh;
  overflow: hidden;
}

.dl-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dl-card {
  background: $card;
  border-radius: 18px;
  border: 0.5px solid $border;
  box-shadow: 0 2px 8px rgba(60, 50, 40, 0.04);
  overflow: hidden;
}

.dl-preview {
  width: 100%;
  height: 600px;
  background: $bg-tertiary;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.dl-preview-img {
  width: 100%;
  height: auto;
  display: block;
}

.dl-preview-img-top {
  min-width: 100%;
}

.dl-preview-doc {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  height: 130px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #F4DCCB 0%, #FBF7F0 100%);
}

.dl-doc-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(244, 229, 216, 0.9);
  color: #B85F38;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 10px;
}

.dl-doc-title {
  @include serif;
  font-size: 18px;
  font-weight: 600;
  color: $text-1;
  display: block;
  margin-bottom: 6px;
}

.dl-doc-sub {
  font-size: 12px;
  color: $text-2;
  display: block;
}

.dl-info {
  padding: 14px 16px 0;
}

.dl-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.dl-title-text {
  @include serif;
  font-size: 16px;
  font-weight: 600;
  color: $text-1;
  flex: 1;
}

.dl-note {
  display: block;
  font-size: 13px;
  color: $text-2;
  line-height: 1.7;
}

.preview-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  height: 30px;
  padding: 0 14px;
  border-radius: 999px;
  border: 0.5px solid rgba(207, 113, 64, 0.32);
  background: rgba(255, 250, 246, 0.96);
  color: $accent;
  font-size: 13px;
  font-weight: 700;
  box-sizing: border-box;
}

.dl-subject-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dl-subject-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 32px;
  padding: 6px 0;
  border-top: 0.5px solid rgba(236, 229, 216, 0.9);
}

.dl-subject-title {
  @include serif;
  font-size: 15px;
  font-weight: 600;
  color: $text-1;
}

.dl-subject-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 24px;
  padding: 0 12px;
  border-radius: 999px;
  border: 0.5px solid rgba(207, 113, 64, 0.45);
  background: rgba(255, 250, 246, 0.92);
  color: $accent;
  font-size: 12px;
  font-weight: 600;
  box-sizing: border-box;

  &.disabled { opacity: 0.5; }
}

.dl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 96px;
  height: 28px;
  padding: 0 18px;
  border-radius: 999px;
  background: $accent-deep;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  box-sizing: border-box;
  box-shadow: 0 8px 20px rgba(184, 95, 56, 0.16);

  &.disabled { opacity: 0.5; box-shadow: none; }
}

.dl-action-row {
  display: flex;
  justify-content: flex-start;
  margin-top: 5px;
  padding: 0 16px 16px;
}

.preview-modal-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10vh 24px;
  box-sizing: border-box;
  background: rgba(42, 37, 31, 0.52);
}

.preview-modal {
  position: relative;
  width: 100%;
  max-height: 80vh;
  height: 80vh;
  border-radius: 20px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 20px 60px rgba(42, 37, 31, 0.22);
  display: flex;
  flex-direction: column;
}

.preview-modal-head {
  flex: 0 0 auto;
  height: 48px;
  padding: 0 52px 0 16px;
  display: flex;
  align-items: center;
  border-bottom: 0.5px solid rgba(236, 229, 216, 0.9);
  box-sizing: border-box;
}

.preview-modal-title {
  @include serif;
  font-size: 16px;
  font-weight: 700;
  color: $text-1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-close {
  position: absolute;
  right: 12px;
  top: 8px;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: rgba(250, 247, 242, 0.98);
  color: $text-2;
  font-size: 26px;
  line-height: 30px;
  text-align: center;
  font-weight: 300;
}

.preview-scroll {
  flex: 1;
  height: 0;
  background: #fff;
}

.preview-full-img {
  width: 100%;
  display: block;
}
</style>
