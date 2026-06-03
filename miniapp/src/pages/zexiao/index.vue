<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">我的择校方向建议</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page">
      <view class="save-banner">
        <text class="save-banner-text">💾 <text class="save-banner-strong">这是一张可保存到相册的长图</text>{{ '\n' }}保存下来，后面和家人 / 顾问沟通时会更方便。</text>
      </view>

      <view id="posterContent" class="longimg">
        <view class="li-cover">
          <text class="li-cover-brand">■ 研知道 · 川渝在职考研</text>
          <text class="li-cover-title">我的择校方向建议</text>
          <text class="li-cover-sub">{{ currentDate }}</text>
        </view>

        <view class="li-toc">
          <text class="li-toc-meta">本图目录 · 6 段</text>
          <view v-for="item in tocItems" :key="item.seq" class="li-toc-row">
            <text class="li-seq">{{ item.seq }}</text>
            <text class="li-lbl">{{ item.lbl }}</text>
            <view class="li-dots"></view>
            <text class="li-toc-desc">{{ item.desc }}</text>
          </view>
        </view>

        <view class="li-section">
          <view class="li-kicker"><text>■</text><text>画像摘要</text></view>
          <text class="text-sm">{{ profile }}</text>
        </view>

        <view class="li-section">
          <view class="li-kicker"><text>■</text><text>判断建议</text></view>
          <text class="li-rec-title">首推：{{ recommendation.title }}</text>
          <text class="text-sm summary-line">匹配度 {{ recommendation.match }}%</text>
          <text class="text-sm summary-line">备选：{{ recommendation.backup }}</text>
          <text class="text-sm text-2 summary-line">{{ recommendation.reason }}</text>
        </view>

        <view class="li-section">
          <view class="li-kicker"><text>■</text><text>路径含义</text></view>
          <text class="li-rec-title">这条路对你可能意味着什么</text>
          <text class="text-sm summary-line">{{ pathMeaning }}</text>
        </view>

        <view class="li-section">
          <view class="li-kicker"><text>■</text><text>参考政策</text></view>
          <view v-for="item in policies" :key="item.name" class="li-policy-card">
            <text class="li-policy-name">{{ item.name }}</text>
            <text class="text-sm">{{ item.desc }}</text>
          </view>
        </view>

        <view class="li-section">
          <view class="li-kicker"><text>■</text><text>相似故事</text></view>
          <view v-for="story in stories" :key="story.who + story.choice" class="li-story-card">
            <text class="li-story-who">{{ story.who }}</text>
            <text class="li-story-choice">选 → {{ story.choice }}</text>
            <text class="li-story-quote">“{{ story.quote }}”</text>
          </view>
        </view>

        <view class="li-section">
          <view class="li-kicker"><text>■</text><text>行动清单</text></view>
          <text class="li-rec-title">接下来步骤</text>
          <view v-for="(step, index) in actionSteps" :key="index" class="action-item">
            <text class="action-num">{{ index + 1 }}</text>
            <text class="action-text">{{ step }}</text>
          </view>
        </view>

        <view class="li-section">
          <view class="li-kicker"><text>■</text><text>风险与边界</text></view>
          <view class="li-disclaimer-box">
            <text class="li-disclaimer-text">{{ disclaimer }}</text>
          </view>
        </view>

        <view class="li-footer">
          <text class="li-footer-brand">■ 研知道</text>
          <text class="li-footer-tag">川渝在职考研 · 不骗人 · 真服务</text>
          <view class="li-footer-qr-grid">
            <view class="li-footer-qr-card" v-for="item in footerQRCodes" :key="item.label">
              <image class="li-footer-qr-img" :src="item.src" mode="aspectFit" :show-menu-by-longpress="true" />
              <text class="li-footer-qr-label">{{ item.label }}</text>
            </view>
          </view>
          <text class="li-footer-qr-hint">微信扫码添加 · 备注「小程序」</text>
        </view>
      </view>

      <canvas
        type="2d"
        id="posterCanvas"
        class="poster-canvas"
      ></canvas>

      <view class="btn-primary" @click="saveImage">{{ saving ? '正在生成长图...' : '💾 保存到手机相册' }}</view>
      <text class="save-hint">不需要登录 / 不需要关注 / 不需要分享</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { getCurrentInstance, onMounted, ref } from 'vue'
import { ensurePrivacyAuthorization } from '@/api/privacy'
import { trackNavClick, trackPageView } from '@/api/tracking'
import type { QuizRuntime } from '@/data/quiz-runtime'
import { remoteAssets } from '@/data/remote-assets'

const instance = getCurrentInstance()
const EXPORT_SCALE = 2

const currentDate = new Date().toISOString().slice(0, 10)

const profile = ref('32 岁 · 成都 · 财政局 · 全日制本科 · 党员 · 价值取向：防御兼进取')
const recommendation = ref({
  title: '四川省委党校 · 经济学',
  backup: '西南财经 MPA',
  reason: '财政系统 + 党员 + 全日制本科 + 晋升窗口期，党校单证更贴合本系统内部使用场景。',
  match: 88
})

const pathMeaning = ref('考研不是只看现在，而是在为 3-5 年后的职业节点提前布局。学历在体制内的真实作用，是竞争上岗、组织考察和岗位门槛中的稳定加分。')
const disclaimer = ref('以上信息来自公开渠道政策文件，及研知道服务 1000+ 川渝学员沉淀的实操经验，仅供参考。具体执行以最新招生简章和你所在单位的实际政策为准。')

const policies = ref<Array<{ name: string; desc: string }>>([
  { name: '① 延迟退休 3-5 年', desc: '体制内职业生涯被拉长，学历投资回收期也同步拉长。' },
  { name: '② 限研岗比例上升', desc: '越来越多岗位从“本科可报”转向“研究生优先或限定”。' },
  { name: '③ 末等退出常态化', desc: '学历是少数可以靠自己持续积累、又不会被替代的资产。' }
])

const stories = ref<Array<{ who: string; choice: string; quote: string }>>([
  { who: '王 X · 33 岁 · 税务', choice: '省委党校经济学', quote: '不读的话三年后还是一样。' },
  { who: '陈 X · 34 岁 · 财政', choice: '西南财大 MPA', quote: '我是为了后面遴选，双证更稳。' }
])

const actionSteps = ref<string[]>([
  '核对目标院校最新招生简章和报名资格',
  '确认自己更看重内部晋升还是双证通用性',
  '联系顾问 1 对 1 过一遍路径选择'
])

const tocItems = [
  { seq: '01', lbl: '判断建议', desc: '首推路径 + 备选 + 匹配度' },
  { seq: '02', lbl: '路径含义', desc: '这条路对你意味着什么' },
  { seq: '03', lbl: '参考政策', desc: '你该知道的政策背景' },
  { seq: '04', lbl: '相似故事', desc: '与你画像相似的同学' },
  { seq: '05', lbl: '行动清单', desc: '接下来可以做什么' },
  { seq: '06', lbl: '风险与边界', desc: '我们能给你什么 / 不能给什么' }
]

const footerQRCodes = [
  { label: '企业微信', src: remoteAssets.contact.enterpriseWechatQr },
  { label: '公众号', src: remoteAssets.contact.officialAccountQr },
]

const saving = ref(false)
const posterTempFile = ref('')

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/index/index' })
}

const measurePosterRect = () =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const query = uni.createSelectorQuery().in(instance)
    query.select('#posterContent').boundingClientRect((rect: any) => {
      if (!rect?.width || !rect?.height) {
        reject(new Error('poster content not found'))
        return
      }
      resolve({ width: rect.width, height: rect.height })
    }).exec()
  })

const wrapTextByWidth = (ctx: any, text: string, maxWidth: number) => {
  const lines: string[] = []
  const paragraphs = String(text || '').split('\n')
  paragraphs.forEach(paragraph => {
    if (!paragraph) {
      lines.push('')
      return
    }
    let current = ''
    Array.from(paragraph).forEach(char => {
      const next = current + char
      if (ctx.measureText(next).width > maxWidth && current) {
        lines.push(current)
        current = char
      } else {
        current = next
      }
    })
    if (current) lines.push(current)
  })
  return lines
}

type PosterSection =
  | { type: 'text'; title: string; bodyLines: string[] }
  | { type: 'stories'; title: string; stories: Array<{ who: string; choice: string; quote: string }> }
  | { type: 'actions'; title: string; steps: string[] }
  | { type: 'risk'; title: string; riskText: string }

const buildPosterSections = (): PosterSection[] => [
  { type: 'text', title: '画像摘要', bodyLines: [profile.value] },
  {
    type: 'text',
    title: '判断建议',
    bodyLines: [
      `首推：${recommendation.value.title}`,
      `匹配度：${recommendation.value.match}%`,
      `备选：${recommendation.value.backup}`,
      recommendation.value.reason
    ]
  },
  { type: 'text', title: '路径含义', bodyLines: [pathMeaning.value] },
  { type: 'text', title: '参考政策', bodyLines: policies.value.map(item => `${item.name} ${item.desc}`) },
  { type: 'stories', title: '相似故事', stories: stories.value },
  { type: 'actions', title: '行动清单', steps: actionSteps.value },
  { type: 'risk', title: '风险与边界', riskText: disclaimer.value }
]

const drawBlock = (ctx: any, text: string, x: number, y: number, maxWidth: number, fontSize: number, color: string, lineHeight: number) => {
  ctx.fillStyle = color
  ctx.font = `${fontSize}px sans-serif`
  const lines = wrapTextByWidth(ctx, text, maxWidth)
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight)
  })
  return y + lines.length * lineHeight
}

const drawRoundedRect = (ctx: any, x: number, y: number, width: number, height: number, radius: number, fill: string) => {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

const loadCanvasImage = (canvas: any, src: string) =>
  new Promise<any>((resolve, reject) => {
    const image = canvas.createImage()
    image.onload = () => resolve(image)
    image.onerror = (error: any) => reject(error)
    image.src = src
  })

const renderPoster = () =>
  new Promise<string>((resolve, reject) => {
    try {
      const sections = buildPosterSections()
      Promise.all([
        measurePosterRect(),
        new Promise<any[]>((resolveCanvas) => {
          const query = uni.createSelectorQuery().in(instance)
          ;(query.select('#posterCanvas') as any)
            .fields({ node: true, size: true })
            .exec((res: any) => resolveCanvas(res))
        })
      ]).then(async ([posterRect, res]) => {
          if (!res || !res[0] || !res[0].node) {
            reject(new Error('canvas node not found'))
            return
          }

          const scale = EXPORT_SCALE
          const canvasWidth = Math.round(posterRect.width * scale)
          const outerPadding = 0
          const coverHeight = Math.round(112 * scale)
          const sectionHPad = Math.round(20 * scale)
          const sectionVPad = Math.round(24 * scale)
          const tocPad = Math.round(20 * scale)
          const tocRowHeight = Math.round(44 * scale)
          const footerHeight = Math.round(214 * scale)
          const titleWidth = canvasWidth - sectionHPad * 2

          const canvas = res[0].node as any
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('canvas context not found'))
            return
          }
          const footerQRImages = await Promise.all(footerQRCodes.map(item => loadCanvasImage(canvas, item.src)))

          ctx.font = `${Math.round(13 * scale)}px sans-serif`
          const sectionWidth = canvasWidth - sectionHPad * 2
          const innerWarmWidth = sectionWidth - Math.round(28 * scale)
          const cardRadius = Math.round(20 * scale)
          const innerRadius = Math.round(14 * scale)
          const dashedYGap = Math.round(1 * scale)
          const sectionGap = 0
          let cursorY = 0

          const measureTextBlockHeight = (lines: string[], fontSize: number, lineHeight: number, maxWidth: number, color = '#2A251E') => {
            ctx.fillStyle = color
            ctx.font = `${fontSize}px sans-serif`
            return lines.reduce((sum, line) => sum + wrapTextByWidth(ctx, line, maxWidth).length * lineHeight, 0)
          }

          const getTextSectionHeight = (bodyLines: string[], hasRecTitle = false) => {
            const kickerHeight = Math.round(18 * scale)
            const bodyWidth = sectionWidth
            const recTitleHeight = hasRecTitle ? Math.round(30 * scale) : 0
            const bodyHeight = measureTextBlockHeight(bodyLines, Math.round(13 * scale), Math.round(22 * scale), bodyWidth, '#6B6258')
            return sectionVPad * 2 + kickerHeight + Math.round(8 * scale) + recTitleHeight + bodyHeight
          }

          const getStoriesSectionHeight = () => {
            const kickerHeight = Math.round(18 * scale)
            let h = sectionVPad * 2 + kickerHeight + Math.round(8 * scale)
            stories.value.forEach(item => {
              const bodyWidth = innerWarmWidth
              ctx.font = `${Math.round(14 * scale)}px sans-serif`
              const whoLines = wrapTextByWidth(ctx, item.who, bodyWidth).length
              ctx.font = `${Math.round(12 * scale)}px sans-serif`
              const choiceLines = wrapTextByWidth(ctx, `选 → ${item.choice}`, bodyWidth).length
              const quoteLines = wrapTextByWidth(ctx, `“${item.quote}”`, bodyWidth).length
              h += Math.round(14 * scale) * 2 + whoLines * Math.round(24 * scale) + choiceLines * Math.round(21 * scale) + quoteLines * Math.round(21 * scale) + Math.round(10 * scale)
            })
            return h
          }

          const getActionsSectionHeight = () => {
            const kickerHeight = Math.round(18 * scale)
            let h = sectionVPad * 2 + kickerHeight + Math.round(8 * scale) + Math.round(30 * scale)
            actionSteps.value.forEach(step => {
              ctx.font = `${Math.round(13 * scale)}px sans-serif`
              const lines = wrapTextByWidth(ctx, step, sectionWidth - Math.round(36 * scale)).length
              h += Math.max(Math.round(20 * scale), lines * Math.round(22 * scale)) + Math.round(12 * scale)
            })
            return h
          }

          const getRiskSectionHeight = () => {
            const kickerHeight = Math.round(18 * scale)
            const bodyHeight = measureTextBlockHeight([disclaimer.value], Math.round(12 * scale), Math.round(22 * scale), innerWarmWidth, '#6B6258')
            return sectionVPad * 2 + kickerHeight + Math.round(8 * scale) + Math.round(14 * scale) * 2 + bodyHeight
          }

          const tocHeight = tocPad * 2 + Math.round(13 * scale) + tocItems.length * tocRowHeight
          const computedHeight =
            coverHeight +
            tocHeight +
            getTextSectionHeight([profile.value]) +
            getTextSectionHeight([
              `匹配度 ${recommendation.value.match}%`,
              `备选：${recommendation.value.backup}`,
              recommendation.value.reason
            ], true) +
            getTextSectionHeight([pathMeaning.value], true) +
            getTextSectionHeight(policies.value.map(item => `${item.name} ${item.desc}`)) +
            getStoriesSectionHeight() +
            getActionsSectionHeight() +
            getRiskSectionHeight() +
            footerHeight +
            Math.round(6 * scale)

          const canvasHeight = Math.max(Math.round(posterRect.height * scale), computedHeight)
          canvas.width = canvasWidth
          canvas.height = canvasHeight

          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, canvasWidth, canvasHeight)

          const coverGradient = ctx.createLinearGradient(0, 0, canvasWidth, coverHeight)
          coverGradient.addColorStop(0, '#CF7140')
          coverGradient.addColorStop(1, '#B85F38')
          drawRoundedRect(ctx, outerPadding, 0, canvasWidth, coverHeight, cardRadius, coverGradient)

          ctx.fillStyle = '#FFFFFF'
          ctx.textAlign = 'center'
          ctx.font = `${Math.round(11 * scale)}px sans-serif`
          ctx.fillText('■ 研知道 · 川渝在职考研', canvasWidth / 2, Math.round(40 * scale))
          ctx.font = `${Math.round(26 * scale)}px serif`
          ctx.fillText('我的择校方向建议', canvasWidth / 2, Math.round(74 * scale))
          ctx.fillStyle = 'rgba(255,255,255,0.88)'
          ctx.font = `${Math.round(13 * scale)}px sans-serif`
          ctx.fillText(currentDate, canvasWidth / 2, Math.round(102 * scale))
          ctx.textAlign = 'left'

          cursorY = coverHeight

          const drawDashedDivider = (y: number) => {
            ctx.save()
            ctx.setStrokeStyle ? ctx.setStrokeStyle('#E8E1D5') : (ctx.strokeStyle = '#E8E1D5')
            if (ctx.setLineDash) ctx.setLineDash([Math.round(4 * scale), Math.round(4 * scale)])
            ctx.lineWidth = dashedYGap
            ctx.beginPath()
            ctx.moveTo(sectionHPad, y)
            ctx.lineTo(canvasWidth - sectionHPad, y)
            ctx.stroke()
            ctx.restore()
          }

          const drawToc = () => {
            ctx.fillStyle = '#8A8175'
            ctx.font = `${Math.round(11 * scale)}px sans-serif`
            ctx.fillText('本图目录 · 6 段', sectionHPad, cursorY + Math.round(20 * scale))

            tocItems.forEach((item, index) => {
              const rowY = cursorY + tocPad + Math.round(13 * scale) + index * tocRowHeight
              drawRoundedRect(ctx, sectionHPad, rowY, Math.round(24 * scale), Math.round(24 * scale), Math.round(4 * scale), '#CF7140')
              ctx.fillStyle = '#FFFFFF'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.font = `${Math.round(11 * scale)}px sans-serif`
              ctx.fillText(item.seq, sectionHPad + Math.round(12 * scale), rowY + Math.round(12 * scale))
              ctx.textAlign = 'left'
              ctx.textBaseline = 'alphabetic'
              ctx.fillStyle = '#2A251E'
              ctx.font = `${Math.round(13 * scale)}px serif`
              ctx.fillText(item.lbl, sectionHPad + Math.round(36 * scale), rowY + Math.round(16 * scale))
              ctx.fillStyle = '#8A8175'
              ctx.font = `${Math.round(12 * scale)}px sans-serif`
              const descWidth = ctx.measureText(item.desc).width
              ctx.fillText(item.desc, canvasWidth - sectionHPad - descWidth, rowY + Math.round(16 * scale))
            })

            cursorY += tocHeight
            drawDashedDivider(cursorY)
          }

          const drawSectionKicker = (title: string, y: number) => {
            ctx.fillStyle = '#CF7140'
            ctx.font = `${Math.round(11 * scale)}px serif`
            ctx.fillText(`■ ${title}`, sectionHPad, y)
          }

          const drawTextSection = (title: string, bodyLines: string[], heading?: string, warmCards?: boolean) => {
            cursorY += sectionVPad
            drawSectionKicker(title, cursorY)
            let bodyY = cursorY + Math.round(26 * scale)
            if (heading) {
              ctx.fillStyle = '#2A251E'
              ctx.font = `${Math.round(20 * scale)}px serif`
              ctx.fillText(heading, sectionHPad, bodyY)
              bodyY += Math.round(26 * scale)
            }
            bodyLines.forEach((line, index) => {
              if (warmCards) {
                const textHeight = measureTextBlockHeight([line], Math.round(13 * scale), Math.round(22 * scale), innerWarmWidth, '#6B6258')
                drawRoundedRect(ctx, sectionHPad, bodyY - Math.round(14 * scale), sectionWidth, textHeight + Math.round(28 * scale), innerRadius, '#FAF6EF')
                ctx.fillStyle = index === 0 && line.startsWith('①') ? '#CF7140' : '#6B6258'
                drawBlock(ctx, line, sectionHPad + Math.round(14 * scale), bodyY, innerWarmWidth, Math.round(13 * scale), ctx.fillStyle, Math.round(22 * scale))
                bodyY += textHeight + Math.round(24 * scale)
              } else {
                const color = line.includes(`${recommendation.value.match}%`) ? '#2A251E' : '#6B6258'
                bodyY = drawBlock(ctx, line, sectionHPad, bodyY, sectionWidth, Math.round(13 * scale), color, Math.round(22 * scale))
                bodyY += Math.round(8 * scale)
              }
            })
            cursorY = bodyY + sectionVPad - Math.round(8 * scale)
            drawDashedDivider(cursorY)
          }

          const drawStoriesSection = () => {
            cursorY += sectionVPad
            drawSectionKicker('相似故事', cursorY)
            let y = cursorY + Math.round(26 * scale)
            stories.value.forEach(story => {
              const bodyWidth = sectionWidth - Math.round(28 * scale)
              const whoHeight = measureTextBlockHeight([story.who], Math.round(14 * scale), Math.round(24 * scale), bodyWidth, '#2A251E')
              const choiceHeight = measureTextBlockHeight([`选 → ${story.choice}`], Math.round(12 * scale), Math.round(21 * scale), bodyWidth, '#CF7140')
              const quoteHeight = measureTextBlockHeight([`“${story.quote}”`], Math.round(12 * scale), Math.round(21 * scale), bodyWidth, '#6B6258')
              const cardHeight = Math.round(14 * scale) * 2 + whoHeight + choiceHeight + quoteHeight + Math.round(8 * scale)
              drawRoundedRect(ctx, sectionHPad, y, sectionWidth, cardHeight, innerRadius, '#FAF6EF')
              let innerY = y + Math.round(22 * scale)
              innerY = drawBlock(ctx, story.who, sectionHPad + Math.round(14 * scale), innerY, bodyWidth, Math.round(14 * scale), '#2A251E', Math.round(24 * scale))
              innerY += Math.round(4 * scale)
              innerY = drawBlock(ctx, `选 → ${story.choice}`, sectionHPad + Math.round(14 * scale), innerY, bodyWidth, Math.round(12 * scale), '#CF7140', Math.round(21 * scale))
              innerY += Math.round(4 * scale)
              drawBlock(ctx, `“${story.quote}”`, sectionHPad + Math.round(14 * scale), innerY, bodyWidth, Math.round(12 * scale), '#6B6258', Math.round(21 * scale))
              y += cardHeight + Math.round(10 * scale)
            })
            cursorY = y + Math.round(14 * scale)
            drawDashedDivider(cursorY)
          }

          const drawActionsSection = () => {
            cursorY += sectionVPad
            drawSectionKicker('行动清单', cursorY)
            let y = cursorY + Math.round(26 * scale)
            ctx.fillStyle = '#2A251E'
            ctx.font = `${Math.round(20 * scale)}px serif`
            ctx.fillText('接下来步骤', sectionHPad, y)
            y += Math.round(26 * scale)
            actionSteps.value.forEach((step, index) => {
              drawRoundedRect(ctx, sectionHPad, y - Math.round(8 * scale), Math.round(20 * scale), Math.round(20 * scale), Math.round(10 * scale), '#CF7140')
              ctx.fillStyle = '#FFFFFF'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.font = `${Math.round(11 * scale)}px sans-serif`
              ctx.fillText(String(index + 1), sectionHPad + Math.round(10 * scale), y + Math.round(2 * scale))
              ctx.textAlign = 'left'
              ctx.textBaseline = 'alphabetic'
              const textX = sectionHPad + Math.round(32 * scale)
              const endY = drawBlock(ctx, step, textX, y + Math.round(6 * scale), sectionWidth - Math.round(32 * scale), Math.round(13 * scale), '#2A251E', Math.round(22 * scale))
              y = endY + Math.round(10 * scale)
            })
            cursorY = y + Math.round(8 * scale)
            drawDashedDivider(cursorY)
          }

          const drawRiskSection = () => {
            cursorY += sectionVPad
            drawSectionKicker('风险与边界', cursorY)
            const boxY = cursorY + Math.round(26 * scale)
            const riskTextHeight = measureTextBlockHeight([disclaimer.value], Math.round(12 * scale), Math.round(22 * scale), innerWarmWidth, '#6B6258')
            drawRoundedRect(ctx, sectionHPad, boxY, sectionWidth, riskTextHeight + Math.round(28 * scale), innerRadius, '#FAF7F2')
            drawBlock(ctx, disclaimer.value, sectionHPad + Math.round(14 * scale), boxY + Math.round(20 * scale), innerWarmWidth, Math.round(12 * scale), '#6B6258', Math.round(22 * scale))
            cursorY = boxY + riskTextHeight + Math.round(28 * scale) + sectionVPad
            drawDashedDivider(cursorY)
          }

          drawToc()
          drawTextSection('画像摘要', [profile.value])
          drawTextSection('判断建议', [
            `匹配度 ${recommendation.value.match}%`,
            `备选：${recommendation.value.backup}`,
            recommendation.value.reason
          ], `首推：${recommendation.value.title}`)
          drawTextSection('路径含义', [pathMeaning.value], '这条路对你可能意味着什么')
          drawTextSection('参考政策', policies.value.map(item => `${item.name} ${item.desc}`), undefined, true)
          drawStoriesSection()
          drawActionsSection()
          drawRiskSection()

          drawRoundedRect(ctx, 0, cursorY, canvasWidth, footerHeight, cardRadius, '#2A251E')
          ctx.fillStyle = '#FFFFFF'
          ctx.textAlign = 'center'
          ctx.font = `${Math.round(13 * scale)}px sans-serif`
          ctx.fillText('■ 研知道', canvasWidth / 2, cursorY + Math.round(30 * scale))
          ctx.fillStyle = 'rgba(255,255,255,0.72)'
          ctx.font = `${Math.round(11 * scale)}px sans-serif`
          ctx.fillText('川渝在职考研 · 不骗人 · 真服务', canvasWidth / 2, cursorY + Math.round(54 * scale))
          const footerCardGap = Math.round(12 * scale)
          const footerCardY = cursorY + Math.round(72 * scale)
          const footerCardW = Math.round((canvasWidth - sectionHPad * 2 - footerCardGap) / 2)
          const footerCardH = Math.round(98 * scale)
          const footerQRSize = Math.round(64 * scale)
          footerQRCodes.forEach((item, index) => {
            const cardX = sectionHPad + index * (footerCardW + footerCardGap)
            drawRoundedRect(ctx, cardX, footerCardY, footerCardW, footerCardH, Math.round(14 * scale), '#FAF6EF')
            const qrX = cardX + Math.round((footerCardW - footerQRSize) / 2)
            ctx.drawImage(footerQRImages[index], qrX, footerCardY + Math.round(10 * scale), footerQRSize, footerQRSize)
            ctx.fillStyle = '#2A251E'
            ctx.font = `${Math.round(11 * scale)}px sans-serif`
            ctx.fillText(item.label, cardX + footerCardW / 2, footerCardY + Math.round(88 * scale))
          })
          ctx.fillStyle = 'rgba(255,255,255,0.66)'
          ctx.font = `${Math.round(11 * scale)}px sans-serif`
          ctx.fillText('微信扫码添加 · 备注「小程序」', canvasWidth / 2, cursorY + Math.round(194 * scale))
          ctx.textAlign = 'left'

          setTimeout(() => {
            uni.canvasToTempFilePath(
              {
                canvas: canvas,
                x: 0,
                y: 0,
                width: canvasWidth,
                height: canvasHeight,
                destWidth: canvasWidth,
                destHeight: canvasHeight,
                fileType: 'png',
                quality: 1,
                success: (result: any) => {
                  posterTempFile.value = result.tempFilePath
                  resolve(result.tempFilePath)
                },
                fail: (error: any) => reject(error)
              } as any,
              instance
            )
          }, 200)
        }).catch(reject)
    } catch (error) {
      reject(error)
    }
  })

const saveToAlbum = (filePath: string) =>
  new Promise<void>((resolve, reject) => {
    uni.saveImageToPhotosAlbum({
      filePath,
      success: () => resolve(),
      fail: error => reject(error)
    })
  })

const saveImage = async () => {
  if (saving.value) return

  const privacyReady = await ensurePrivacyAuthorization()
  if (!privacyReady) {
    uni.showToast({ title: '未同意隐私授权，暂时无法保存图片', icon: 'none' })
    return
  }

  saving.value = true
  uni.showLoading({ title: '生成长图中', mask: true })
  try {
    const filePath = posterTempFile.value || await renderPoster()
    await saveToAlbum(filePath)
    uni.hideLoading()
    uni.showToast({ title: '已保存到相册', icon: 'success' })
    trackNavClick('zexiao', 'save-image')
  } catch (error: any) {
    uni.hideLoading()
    const message = String(error?.errMsg || '')
    if (message.includes('auth deny') || message.includes('authorize no response')) {
      uni.showModal({
        title: '需要相册权限',
        content: '请允许保存到相册，之后就能把择校建议长图保存到手机。',
        success: modal => {
          if (modal.confirm) {
            uni.openSetting({})
          }
        }
      })
    } else {
      uni.showToast({ title: '保存失败，请稍后重试', icon: 'none' })
    }
  } finally {
    saving.value = false
  }
}

const loadFromStorage = () => {
  try {
    const runtime = uni.getStorageSync('yz_quiz_runtime') as QuizRuntime | undefined
    if (!runtime) return
    posterTempFile.value = ''

    profile.value = runtime.zexiao.profile
    recommendation.value = {
      title: runtime.zexiao.recommendation.title,
      backup: runtime.zexiao.recommendation.backup,
      reason: runtime.zexiao.recommendation.reason,
      match: runtime.zexiao.recommendation.match
    }

    pathMeaning.value = runtime.zexiao.pathMeaning
    disclaimer.value = runtime.zexiao.disclaimer
    policies.value = runtime.zexiao.policies
    actionSteps.value = runtime.zexiao.actionSteps.length ? runtime.zexiao.actionSteps : actionSteps.value
    stories.value = runtime.zexiao.stories
  } catch (error) {
    // fallback to defaults
  }
}

onMounted(() => {
  trackPageView('zexiao')
  loadFromStorage()
})
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";

.shell { background: #FAF7F2; min-height: 100vh; }

.save-banner {
  background: #FAF6EF;
  border: 0.5px dashed rgba(207, 113, 64, 0.22);
  padding: 10px 14px;
  border-radius: 14px;
  margin-bottom: 16px;
}

.save-banner-text {
  font-size: 12px;
  color: #6B6258;
  line-height: 1.7;
  display: block;
}

.save-banner-strong { font-weight: 600; }

.summary-line {
  margin-top: 12px;
  display: block;
}

.li-kicker {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--f-serif);
  font-size: 11px;
  letter-spacing: 0.25em;
  color: #CF7140;
  font-weight: 500;
  margin-bottom: 6px;
}

.li-rec-title {
  display: block;
  font-family: var(--f-serif);
  font-size: 20px;
  font-weight: 600;
  color: #2A251E;
}

.li-disclaimer-box {
  background: #FAF7F2;
  border-radius: 14px;
  padding: 14px;
}

.li-disclaimer-text {
  font-size: 12px;
  color: #6B6258;
  line-height: 1.75;
  display: block;
}

.action-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 6px 0;
}

.action-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #CF7140;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 20px;
}

.action-text {
  font-size: 13px;
  color: #2A251E;
  line-height: 1.75;
  flex: 1;
  display: block;
}

.poster-canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  width: 360px;
  opacity: 0;
  pointer-events: none;
}

.save-hint {
  display: block;
  text-align: center;
  font-size: 11px;
  color: #8A8175;
  margin-top: 8px;
}
</style>
