<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">院校库</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page has-tabbar">
      <view class="page-title-row">
        <text class="page-title-h1">想读个研 · <text class="text-accent">三步</text></text>
      </view>

      <view class="zk-path-trail">
        <text v-if="!trail.length" class="zk-crumb-placeholder">还没开始 · 点下面任一节点</text>
        <view v-else class="trail-items">
          <view class="trail-inline">
            <text class="trail-node trail-start">起点</text>
            <template v-for="item in trail" :key="item.step">
              <text class="trail-sep">›</text>
              <text class="trail-node" @click="resetToStep(item.step)">{{ item.label }}</text>
            </template>
          </view>
          <text class="zk-reset" @click="resetAll">重来</text>
        </view>
      </view>

      <view class="step-tree">
        <view class="step-item">
          <view class="step-left">
            <view class="sc sc-dark">0</view>
            <view class="sc-line"></view>
          </view>
          <view class="step-content">
            <view class="root-card">
              <text class="root-card-text">首先选择路径，党校在职研还是统考非全？</text>
            </view>
          </view>
        </view>

        <view class="step-item">
          <view class="step-left">
            <view class="sc" :class="selectedPath ? 'sc-active' : 'sc-inactive'">1</view>
            <view class="sc-line"></view>
          </view>
          <view class="step-content">
            <view class="zk-l1-grid">
              <view class="zk-l1-card" :class="{ selected: selectedPath === 'A', dimmed: selectedPath && selectedPath !== 'A' }" @click="selectPath('A')">
                <text class="zk-l1-badge">A</text>
                <text class="zk-l1-name">党校在职研究生</text>
                <text class="zk-l1-feat">仅学历 · 体制内认可</text>
              </view>
              <view class="zk-l1-card" :class="{ selected: selectedPath === 'B', dimmed: selectedPath && selectedPath !== 'B' }" @click="selectPath('B')">
                <text class="zk-l1-badge-ring">B</text>
                <text class="zk-l1-name">统考非全研究生</text>
                <text class="zk-l1-feat">双证 · 学信网可查</text>
              </view>
            </view>
          </view>
        </view>

        <view class="step-item">
          <view class="step-left">
            <view class="sc" :class="(selectedPartyRegion || selectedDimKey) ? 'sc-active' : selectedPath ? 'sc-pending' : 'sc-inactive'">2</view>
            <view class="sc-line"></view>
          </view>
          <view class="step-content">
            <view class="branch-card" :class="{ 'branch-dimmed': selectedPath === 'B' }">
              <view class="branch-head">
                <view class="branch-tag" :class="{ 'branch-tag-inactive': selectedPath !== 'A' }">A</view>
                <text class="branch-title" :class="{ 'branch-title-dim': selectedPath === 'B' }">四川 vs 重庆</text>
              </view>
              <view class="city-row">
                <view
                  class="city-card"
                  :class="{ 'city-selected': selectedPartyRegion === '川', 'city-inactive': selectedPath !== 'A' }"
                  @click="selectedPath === 'A' && selectPartyRegion('川')"
                >
                  <text class="city-name">四川党校</text>
                  <text class="city-count">3 方向</text>
                </view>
                <view
                  class="city-card"
                  :class="{ 'city-selected': selectedPartyRegion === '渝', 'city-inactive': selectedPath !== 'A' }"
                  @click="selectedPath === 'A' && selectPartyRegion('渝')"
                >
                  <text class="city-name">重庆党校</text>
                  <text class="city-count">5 方向</text>
                </view>
              </view>
              <text class="branch-axis-hint">身份 · 年限 · 地区</text>
            </view>

            <view class="branch-card dim-branch" :class="{ 'branch-dimmed': selectedPath === 'A' }">
              <view class="branch-head">
                <view class="branch-tag branch-tag-b" :class="{ 'branch-tag-inactive': selectedPath === 'A' }">B</view>
                <text class="branch-title" :class="{ 'branch-title-dim': selectedPath === 'A' }">{{ dims.length }} 个维度 · 选一个看院校</text>
              </view>
              <view class="dim-chips">
                <text
                  v-for="dim in dims"
                  :key="dim.key"
                  class="chip"
                  :class="{ 'chip-active': selectedDimKey === dim.key, 'chip-disabled': selectedPath === 'A' }"
                  @click="selectedPath !== 'A' && selectPathAndDim(dim.key)"
                >{{ dim.label }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="step-item last">
          <view class="step-left">
            <view class="sc" :class="hasStep3Content ? 'sc-active' : 'sc-inactive'">3</view>
          </view>
          <view class="step-content">
            <view v-if="partyDirItems.length">
              <text class="step3-title">{{ l3Title }}</text>
              <view class="dir-list">
                <view
                  v-for="dir in partyDirItems"
                  :key="dir.id"
                  class="dir-card"
                  @click="toggleDir(dir.id)"
                >
                  <view class="dir-card-head">
                    <view>
                      <view class="dir-title-row">
                        <text class="dir-name">{{ dir.major }}</text>
                        <text v-if="dir.enrollment" class="dir-count">{{ dir.enrollment }}人</text>
                      </view>
                      <text class="dir-fit">{{ dir.fit }}</text>
                    </view>
                    <view class="dir-toggle" :class="{ open: expandedDirs[dir.id] }"></view>
                  </view>
                  <view class="dir-detail collapse-panel" :class="{ open: expandedDirs[dir.id] }">
                    <text class="dir-detail-line">考试科目：{{ dir.examSubjects }}</text>
                    <text v-if="dir.notes" class="dir-detail-line">{{ dir.notes }}</text>
                    <view
                      v-for="section in dir.detailSections"
                      :key="section.label"
                      class="dir-detail-block"
                    >
                      <text class="dir-detail-label">{{ section.label }}</text>
                      <text v-if="section.text" class="dir-detail-line">{{ section.text }}</text>
                      <view v-if="section.items?.length" class="detail-mini-list">
                        <view v-for="item in section.items" :key="item.tag + item.dir" class="detail-mini-card">
                          <text class="detail-mini-tag">{{ item.tag }}</text>
                          <text class="detail-mini-dir">{{ item.dir }}</text>
                          <text class="detail-mini-fit">{{ item.fit }}</text>
                        </view>
                      </view>
                    </view>
                    <view class="btn-primary dir-cta" @click.stop="goPrep">查看党校备考详情 →</view>
                  </view>
                </view>
              </view>
              <text class="dir-hint">↓ 点方向卡可展开班级细分、对口岗位和考试说明</text>
            </view>

            <view v-else-if="schoolSections.length">
              <text class="step3-title">{{ l3Title }}</text>
              <view class="section-stack">
                <view v-for="section in schoolSections" :key="section.title" class="bucket-card">
                  <view class="bucket-head">
                    <text class="bucket-title">{{ section.title }}</text>
                    <text class="bucket-meta">{{ section.items.length }} 所</text>
                  </view>
                  <text v-if="section.hint" class="bucket-hint">{{ section.hint }}</text>
                  <view class="zk-l3-list">
                    <view
                      v-for="school in section.items"
                      :key="school.id"
                      class="school-card"
                      @click="goSchoolDetail(school)"
                    >
                      <view class="school-card-row">
                        <image class="school-logo" :src="school.logoUrl" mode="aspectFit" />
                        <view class="school-card-body">
                          <view class="school-card-head">
                            <text class="school-name">{{ school.name }}</text>
                            <text
                              class="tag"
                              :class="school.levelText === '985' ? 'tag-985' : school.levelText === '211' ? 'tag-211' : 'tag-normal'"
                            >{{ school.levelText === '985' ? '985' : school.levelText === '211' ? '211' : '普通' }}</text>
                          </view>
                          <view class="school-meta-row">
                            <text v-for="item in getSchoolMetaItems(school, true)" :key="item">{{ item }}</text>
                          </view>
                        </view>
                      </view>
                    </view>
                  </view>
                </view>
              </view>
            </view>

            <view v-else class="step3-placeholder">
              <text class="step3-placeholder-title">具体方向 / 院校</text>
              <text class="step3-placeholder-hint">先在第 2 步选维度或城市</text>
            </view>
          </view>
        </view>
      </view>

      <view class="divider-text">
        <view class="divider-line"></view>
        <text>全部院校库</text>
        <view class="divider-line"></view>
      </view>

      <view class="zk-list-section">
        <view class="zk-list-title-row">
          <text class="zk-list-header">院校库 · {{ allSchools.length }} 所</text>
          <text class="zk-list-growing">院校正在增加中</text>
        </view>
        <text class="zk-list-sub">不想走决策图，也可以直接搜 / 按维度筛选</text>

        <view class="zk-search-wrap">
          <text class="zk-search-icon">🔍</text>
          <input
            v-model="searchText"
            class="zk-search-input"
            placeholder="搜索院校名（如 川大 / 西财 / 西政）"
          />
        </view>

        <view class="filter-row">
          <text class="filter-label">学位</text>
          <view class="filter-chips">
            <text
              v-for="filter in typeFilters"
              :key="filter"
              class="filter-chip"
              :class="{ active: activeTypeFilter === filter }"
              @click="activeTypeFilter = filter"
            >{{ filter }}</text>
          </view>
        </view>

        <view class="filter-row">
          <text class="filter-label">档次</text>
          <view class="filter-chips">
            <text
              v-for="filter in levelFilters"
              :key="filter"
              class="filter-chip"
              :class="{ active: activeLevelFilter === filter }"
              @click="activeLevelFilter = filter"
            >{{ filter }}</text>
          </view>
        </view>

        <view class="filter-row">
          <text class="filter-label">地域</text>
          <view class="filter-chips">
            <text
              v-for="filter in regionFilters"
              :key="filter"
              class="filter-chip"
              :class="{ active: activeProvinceFilter === filter }"
              @click="activeProvinceFilter = filter"
            >{{ filter }}</text>
          </view>
        </view>

        <text class="list-count">显示 {{ listSchools.length }} 所</text>

        <view class="zk-list-cards">
          <view
            v-for="school in visibleSchools"
            :key="school.id"
            class="school-card"
            @click="goSchoolDetail(school)"
          >
            <view class="school-card-row">
              <image class="school-logo" :src="school.logoUrl" mode="aspectFit" />
              <view class="school-card-body">
                <view class="school-card-head">
                  <text class="school-name">{{ school.name }}</text>
                  <text
                    class="tag"
                    :class="school.levelText === '985' ? 'tag-985' : school.levelText === '211' ? 'tag-211' : 'tag-normal'"
                  >{{ school.levelText === '985' ? '985' : school.levelText === '211' ? '211' : '普通' }}</text>
                </view>
                <view class="school-meta-row">
                  <text v-for="item in getSchoolMetaItems(school)" :key="item">{{ item }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view v-if="hasMore" class="btn-secondary load-more-btn" @click="loadMore">
          继续加载更多院校（还有 {{ listSchools.length - visibleCount }} 所）
        </view>
        <text v-else class="list-end-hint">已展示全部 {{ listSchools.length }} 所</text>
      </view>

      <view class="btn-primary cta-button" @click="goTab('test')">测一测，看看适合哪个院校</view>
    </view>

    <BottomTabBar />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { trackNavClick, trackPageView } from '@/api/tracking'
import BottomTabBar from '@/components/BottomTabBar.vue'
import { getAllSchools, getPartyDirections, type SchoolListItem } from '@/data/school-data'
import { usePageShare } from '@/utils/share'

usePageShare({
  title: '川渝在职研究生院校库｜研知道',
  path: '/pages/schools/index'
})

type PathType = 'A' | 'B' | null

type DimConfig = {
  key: string
  label: string
}

type SchoolSection = {
  title: string
  hint?: string
  items: SchoolListItem[]
}

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/index/index' })
}

const goTab = (tab: string) => {
  trackNavClick('schools', `tab-${tab}`)
  uni.switchTab({ url: '/pages/test/index' })
}

const selectedPath = ref<PathType>(null)
const selectedPartyRegion = ref('')
const selectedDimKey = ref('')
const trail = ref<Array<{ label: string; step: number }>>([])
const expandedDirs = reactive<Record<string, boolean>>({})

const searchText = ref('')
const activeTypeFilter = ref('全部')
const activeLevelFilter = ref('全部')
const activeProvinceFilter = ref('全部')

const allSchools = ref<SchoolListItem[]>([])

const typeFilters = ['全部', 'MBA', 'MPA', 'MEM']
const levelFilters = ['全部', '985', '211', '普通']
const regionFilters = ['全部', '四川', '重庆', '云南', '贵州']
const dims: DimConfig[] = [
  { key: 'mba', label: 'MBA' },
  { key: 'mpa', label: 'MPA' },
  { key: 'mem', label: 'MEM' },
  { key: 'tuition', label: '学费' },
  { key: 'score', label: '分数线' },
  { key: 'elite', label: '985/211' },
  { key: 'sichuan', label: '四川' },
  { key: 'chongqing', label: '重庆' },
  { key: 'yunnan', label: '云南' },
  { key: 'guizhou', label: '贵州' },
  { key: 'duration', label: '学制' }
]

const selectedDimLabel = computed(() => dims.find(dim => dim.key === selectedDimKey.value)?.label || '')

const l3Title = computed(() => {
  if (selectedPath.value === 'A') {
    return selectedPartyRegion.value === '川' ? '四川党校 · 方向 3 个' : '重庆党校 · 方向 5 个'
  }
  return selectedDimLabel.value ? `${selectedDimLabel.value} · 院校列表` : '院校列表'
})

const partyDirItems = computed(() => {
  if (selectedPath.value !== 'A' || !selectedPartyRegion.value) return []
  return getPartyDirections(selectedPartyRegion.value === '川' ? '四川' : '重庆')
})

const sortSchools = (list: SchoolListItem[]) =>
  [...list].sort((left, right) => {
    const leftScore = left.matchScore || 0
    const rightScore = right.matchScore || 0
    const leftTuition = left.tuitionValue ?? Number.MAX_SAFE_INTEGER
    const rightTuition = right.tuitionValue ?? Number.MAX_SAFE_INTEGER
    return rightScore - leftScore || leftTuition - rightTuition || left.name.localeCompare(right.name, 'zh-Hans-CN')
  })

const hasMeaningfulValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return false
  const text = String(value).trim()
  if (!text) return false
  return !['待定', '待确认', '无', '暂无', '——'].includes(text)
}

const getSchoolMetaItems = (school: SchoolListItem, includeDuration = false) => {
  const items: string[] = []
  if (hasMeaningfulValue(school.province)) items.push(String(school.province).trim())
  if (hasMeaningfulValue(school.type)) items.push(String(school.type).trim())
  if (hasMeaningfulValue(school.tuition)) items.push(`学费 ${String(school.tuition).trim()}`)
  if (hasMeaningfulValue(school.latestScore)) items.push(`${String(school.latestScore).trim()} 分`)
  if (includeDuration && hasMeaningfulValue(school.duration)) items.push(String(school.duration).trim())
  return items
}

const dimFilteredSchools = computed(() => {
  if (selectedPath.value !== 'B' || !selectedDimKey.value) return []
  switch (selectedDimKey.value) {
    case 'mba':
      return allSchools.value.filter(item => item.type === 'MBA')
    case 'mpa':
      return allSchools.value.filter(item => item.type === 'MPA')
    case 'mem':
      return allSchools.value.filter(item => item.type === 'MEM')
    case 'elite':
      return allSchools.value.filter(item => item.levelText === '985' || item.levelText === '211')
    case 'sichuan':
      return allSchools.value.filter(item => item.province === '四川')
    case 'chongqing':
      return allSchools.value.filter(item => item.province === '重庆')
    case 'yunnan':
      return allSchools.value.filter(item => item.province === '云南')
    case 'guizhou':
      return allSchools.value.filter(item => item.province === '贵州')
    default:
      return allSchools.value
  }
})

const limitSectionItems = (sections: SchoolSection[]) =>
  sections
    .map(section => ({ ...section, items: section.items.slice(0, 5) }))
    .filter(section => section.items.length)

const buildSections = (title: string, items: SchoolListItem[], hint?: string): SchoolSection[] =>
  items.length ? limitSectionItems([{ title, hint, items: sortSchools(items) }]) : []

const schoolSections = computed<SchoolSection[]>(() => {
  const list = dimFilteredSchools.value
  if (selectedPath.value !== 'B' || !selectedDimKey.value) return []

  if (selectedDimKey.value === 'tuition') {
    return limitSectionItems([
      { title: '3 万以内', hint: '低成本优先', items: sortSchools(allSchools.value.filter(item => (item.tuitionValue ?? 0) > 0 && (item.tuitionValue ?? 0) <= 3)) },
      { title: '3-5 万', hint: '主流预算带', items: sortSchools(allSchools.value.filter(item => (item.tuitionValue ?? 0) > 3 && (item.tuitionValue ?? 0) <= 5)) },
      { title: '5-8 万', hint: '适合中高预算', items: sortSchools(allSchools.value.filter(item => (item.tuitionValue ?? 0) > 5 && (item.tuitionValue ?? 0) <= 8)) },
      { title: '8 万以上', hint: '以 MBA / MEM 为主', items: sortSchools(allSchools.value.filter(item => (item.tuitionValue ?? 0) > 8)) }
    ].filter(section => section.items.length))
  }

  if (selectedDimKey.value === 'score') {
    return limitSectionItems([
      { title: '175 分以下', hint: '相对友好', items: sortSchools(allSchools.value.filter(item => (item.scoreValue ?? 0) > 0 && (item.scoreValue ?? 0) < 175)) },
      { title: '175-185 分', hint: '主流区间', items: sortSchools(allSchools.value.filter(item => (item.scoreValue ?? 0) >= 175 && (item.scoreValue ?? 0) <= 185)) },
      { title: '186-195 分', hint: '略有竞争', items: sortSchools(allSchools.value.filter(item => (item.scoreValue ?? 0) > 185 && (item.scoreValue ?? 0) <= 195)) },
      { title: '196 分以上', hint: '竞争更强', items: sortSchools(allSchools.value.filter(item => (item.scoreValue ?? 0) > 195)) }
    ].filter(section => section.items.length))
  }

  if (selectedDimKey.value === 'duration') {
    return limitSectionItems([
      { title: '2 年', hint: '更快毕业', items: sortSchools(allSchools.value.filter(item => item.durationValue === 2)) },
      { title: '2.5 年', hint: '兼顾节奏与成本', items: sortSchools(allSchools.value.filter(item => item.duration.includes('2.5'))) },
      { title: '3 年', hint: '最常见学制', items: sortSchools(allSchools.value.filter(item => item.durationValue === 3 || item.duration.includes('3 年'))) }
    ].filter(section => section.items.length))
  }

  if (selectedDimKey.value === 'elite') {
    return limitSectionItems([
      { title: '985 院校', hint: '品牌和认可度更强', items: sortSchools(list.filter(item => item.levelText === '985')) },
      { title: '211 院校', hint: '兼顾牌子与上岸概率', items: sortSchools(list.filter(item => item.levelText === '211')) }
    ].filter(section => section.items.length))
  }

  if (selectedDimKey.value === 'mba' || selectedDimKey.value === 'mpa' || selectedDimKey.value === 'mem') {
    return limitSectionItems([
      { title: selectedDimLabel.value, hint: '按匹配度和成本排序', items: sortSchools(list.filter(item => item.province === '四川')) },
      { title: `${selectedDimLabel.value} · 外省机会`, hint: '云南 / 贵州 / 重庆补充选项', items: sortSchools(list.filter(item => item.province !== '四川')) }
    ].filter(section => section.items.length))
  }

  return buildSections(selectedDimLabel.value || '院校列表', list, '点击院校卡查看详情')
})

const hasStep3Content = computed(() => partyDirItems.value.length > 0 || schoolSections.value.length > 0)

const PAGE_SIZE = 10
const visibleCount = ref(PAGE_SIZE)

const listSchools = computed(() => {
  let list = [...allSchools.value]

  if (searchText.value.trim()) {
    const query = searchText.value.trim().toLowerCase()
    list = list.filter(item => item.name.toLowerCase().includes(query) || item.city.toLowerCase().includes(query))
  }

  if (activeTypeFilter.value !== '全部') {
    list = list.filter(item => item.type === activeTypeFilter.value)
  }

  if (activeLevelFilter.value !== '全部') {
    if (activeLevelFilter.value === '普通') {
      list = list.filter(item => item.levelText !== '985' && item.levelText !== '211')
    } else {
      list = list.filter(item => item.levelText === activeLevelFilter.value)
    }
  }

  if (activeProvinceFilter.value !== '全部') {
    list = list.filter(item => item.province === activeProvinceFilter.value)
  }

  visibleCount.value = PAGE_SIZE
  return sortSchools(list)
})

const visibleSchools = computed(() => listSchools.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleCount.value < listSchools.value.length)
const loadMore = () => { visibleCount.value += PAGE_SIZE }

const toggleDir = (id: string) => {
  expandedDirs[id] = !expandedDirs[id]
}

const selectPath = (path: Exclude<PathType, null>) => {
  selectedPath.value = path
  selectedPartyRegion.value = ''
  selectedDimKey.value = ''
  trail.value = [{ label: path === 'A' ? '党校在职研究生' : '统考非全研究生', step: 1 }]
  Object.keys(expandedDirs).forEach(key => delete expandedDirs[key])
  trackNavClick('schools', `select-path-${path}`)
}

const selectPartyRegion = (region: string) => {
  selectedPartyRegion.value = region
  selectedDimKey.value = ''
  trail.value = [trail.value[0], { label: region === '川' ? '四川党校' : '重庆党校', step: 2 }]
  trackNavClick('schools', `select-region-${region}`)
}

const selectDim = (dimKey: string) => {
  selectedDimKey.value = dimKey
  selectedPartyRegion.value = ''
  const base = trail.value[0] || { label: '统考非全研究生', step: 1 }
  trail.value = [base, { label: dims.find(dim => dim.key === dimKey)?.label || dimKey, step: 2 }]
  trackNavClick('schools', `select-dim-${dimKey}`)
}

const selectPathAndDim = (dimKey: string) => {
  if (!selectedPath.value) {
    selectedPath.value = 'B'
    trail.value = [{ label: '统考非全研究生', step: 1 }]
  }
  selectDim(dimKey)
}

const resetAll = () => {
  selectedPath.value = null
  selectedPartyRegion.value = ''
  selectedDimKey.value = ''
  trail.value = []
  Object.keys(expandedDirs).forEach(key => delete expandedDirs[key])
}

const resetToStep = (targetStep: number) => {
  if (targetStep === 1) {
    resetAll()
    return
  }
  trail.value = trail.value.filter(item => item.step < targetStep)
  if (targetStep === 2) {
    selectedPartyRegion.value = ''
    selectedDimKey.value = ''
  }
}

const goSchoolDetail = (school: SchoolListItem) => {
  trackNavClick('schools', 'school-detail')
  uni.navigateTo({ url: `/pages/school-detail/index?id=${school.id}` })
}

const goPrep = () => {
  trackNavClick('schools', 'party-prep')
  uni.navigateTo({ url: '/pages/prep-dx/index' })
}

onMounted(() => {
  trackPageView('schools')
  try {
    allSchools.value = getAllSchools() || []
  } catch (error) {
    allSchools.value = []
  }
})
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";

.shell { background: #FAF7F2; min-height: 100vh; }

.page-title-row {
  padding: 0 0 4px;
  margin-bottom: 4px;
}

.page-title-h1 {
  @include serif;
  font-size: 21px;
  font-weight: 600;
  line-height: 1.35;
  color: $text-1;
}

.zk-path-trail {
  min-height: 20px;
  margin-bottom: 10px;
  padding: 9px 14px;
  background: #fff;
  border-radius: 14px;
  border: 0.5px solid $border;
}

.zk-crumb-placeholder,
.zk-reset {
  font-size: 12px;
  color: $text-3;
}

.trail-items {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.trail-inline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.trail-node {
  font-size: 12px;
  color: $accent;
  font-weight: 500;
  line-height: 1.45;
}

.trail-start {
  font-weight: 600;
}

.trail-sep {
  font-size: 12px;
  color: $text-2;
  line-height: 1;
}

.step-tree {
  position: relative;
}

.step-item {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 8px 0 0;
}

.step-item.last .sc-line { display: none; }

.step-left {
  width: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sc {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  @include serif;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: $accent;
  box-shadow: 0 2px 6px rgba(207, 113, 64, 0.25);
}

.sc-dark {
  background: $text-1;
  box-shadow: 0 2px 6px rgba(42, 37, 30, 0.3);
}

.sc-active {
  transform: scale(1.1);
  box-shadow: 0 3px 10px rgba(207, 113, 64, 0.42), 0 0 0 3px rgba(207, 113, 64, 0.16);
}

.sc-pending,
.sc-inactive {
  background: #BEB3A5;
  box-shadow: none;
}

.sc-line {
  width: 2px;
  flex: 1;
  background: rgba(207, 113, 64, 0.72);
  margin-top: 4px;
  border-radius: 999px;
}

.step-content {
  flex: 1;
  padding-bottom: 4px;
}

.root-card,
.branch-card,
.bucket-card {
  background: #fff;
  border: 0.5px solid $border;
  border-radius: 16px;
  padding: 9px 10px 10px;
  box-shadow: 0 2px 8px rgba(60, 50, 40, 0.04);
}

.step3-placeholder {
  min-height: 92px;
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

.root-card-text {
  @include serif;
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: 0.04em;
  line-height: 1.4;
  color: #fff;
}

.root-card {
  background: $text-1;
  border: none;
  padding: 10px 13px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(42, 37, 30, 0.18);
}

.zk-l1-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.zk-l1-card {
  min-height: 74px;
  border-radius: 16px;
  padding: 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 0;
  justify-content: center;
  align-items: center;
  text-align: center;
  border: 0.5px solid $border;
  overflow: hidden;

  background: #fff;
  border: 1px solid $accent;
  color: $accent;

  &.selected {
    background: $accent;
    color: #fff;
    box-shadow: 0 10px 26px rgba(207, 113, 64, 0.2);
  }

  &.dimmed {
    opacity: 0.45;
  }
}

.zk-l1-badge,
.zk-l1-badge-ring {
  position: static;
  width: auto;
  height: auto;
  border: none;
  border-radius: 0;
  background: transparent;
  display: block;
  font-size: 10px;
  letter-spacing: 0.25em;
  font-weight: 600;
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", serif;
  margin-bottom: 3px;
}

.zk-l1-badge,
.zk-l1-badge-ring {
  color: currentColor;
  opacity: 0.82;
}

.zk-l1-name {
  @include serif;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.24;
  color: inherit;
  margin-bottom: 3px;
}

.zk-l1-feat {
  font-size: 9.5px;
  line-height: 1.32;
  color: inherit;
  opacity: 0.88;
}

.branch-card.branch-dimmed {
  opacity: 0.5;
}

.dim-branch { margin-top: 8px; }

.branch-head {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 7px;
}

.branch-tag {
  font-size: 10px;
  letter-spacing: 0.15em;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 999px;
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", serif;
  background: $accent;
  color: #fff;
}

.branch-tag-b {
  background: transparent;
  border: 0.5px solid $accent;
  color: $accent;
}

.branch-tag-inactive {
  background: #D0C8BE;
  border-color: transparent;
  color: #fff;
}

.branch-title {
  @include serif;
  font-size: 11.5px;
  font-weight: 600;
  color: $text-1;
  flex: 1;
}

.branch-title-dim { color: $text-3; }

.city-row {
  display: flex;
  gap: 6px;
  margin-bottom: 5px;
}

.city-card {
  flex: 1;
  padding: 7px 6px;
  border-radius: 10px;
  background: $bg-tertiary;
  border: 0.5px solid transparent;
  text-align: center;
}

.city-selected {
  background: $accent-soft;
  border-color: $accent;
}

.city-inactive {
  opacity: 0.45;
}

.city-name {
  display: block;
  @include serif;
  font-size: 11px;
  font-weight: 600;
  color: $text-1;
  margin-bottom: 2px;
}

.city-count,
.branch-axis-hint,
.bucket-hint,
.dir-hint,
.step3-placeholder-hint,
.zk-list-sub,
.list-count {
  font-size: 12px;
  color: $text-3;
}

.branch-axis-hint {
  display: block;
  margin-top: 2px;
  text-align: center;
  letter-spacing: 0.06em;
  font-size: 9px;
}

.dim-chips,
.filter-chips,
.city-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 4px;
}

.chip {
  padding: 2px 8px;
  border-radius: 999px;
  border: 0.5px solid transparent;
  background: $accent-soft;
  color: $accent-deep;
  font-size: 9px;
  font-weight: 400;
  line-height: 1.4;
}

.filter-chip {
  padding: 5px 11px;
  border-radius: 999px;
  border: 0.5px solid $border;
  background: $card;
  color: $text-2;
  font-size: 11px;
}

.chip-active,
.filter-chip.active {
  background: $accent;
  border-color: $accent;
  color: #fff;
}

.zk-list-section .filter-chip.active {
  background: $accent;
  border-color: $accent;
  color: #fff;
  box-shadow: 0 4px 12px rgba(207, 113, 64, 0.16);
}

.chip-disabled {
  opacity: 0.45;
}

.step3-title {
  display: block;
  @include serif;
  font-size: 11.5px;
  font-weight: 600;
  color: $accent;
  margin-bottom: 6px;
  letter-spacing: 0.04em;
  padding-left: 2px;
}

.step3-placeholder-title {
  display: block;
  @include serif;
  font-size: 11.5px;
  font-weight: 600;
  color: $accent;
  margin-bottom: 4px;
  letter-spacing: 0.04em;
  padding-left: 2px;
}

.step3-placeholder-hint {
  display: block;
  padding-top: 6px;
  text-align: center;
  font-size: 10px;
  letter-spacing: 0.04em;
}

.dir-list,
.section-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.zk-list-cards {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.load-more-btn { margin-top: 8px; }
.list-end-hint {
  display: block;
  text-align: center;
  font-size: 12px;
  color: #8A8175;
  margin-top: 12px;
}

.zk-l3-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dir-card,
.school-card {
  background: #fff;
  border: 0.5px solid $border;
  border-radius: 14px;
  padding: 12px;
}

.dir-card-head,
.school-card-head,
.bucket-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.dir-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.dir-name,
.bucket-title {
  @include serif;
  font-size: 15px;
  font-weight: 600;
  color: $text-1;
}

.bucket-meta,
.dir-count {
  font-size: 11px;
  color: $accent;
  font-weight: 600;
}

.dir-fit,
.detail-mini-fit {
  font-size: 12px;
  color: $text-2;
  line-height: 1.75;
}

.dir-toggle {
  width: 29px;
  height: 29px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 29px;
  opacity: 0.49;
  transform: translateY(-10px);
  transform-origin: center;
  animation: arrowBreath 2.2s ease-in-out infinite;
  transition: transform 1.2s ease, opacity 0.8s ease;
}

.dir-toggle::before {
  content: '';
  width: 10px;
  height: 10px;
  border-right: 1.76px solid #CF7140;
  border-bottom: 1.76px solid #CF7140;
  transform: rotate(45deg) translateY(-1px);
  transform-origin: center;
}

.dir-toggle.open { transform: translateY(-10px) rotate(180deg); }

@keyframes arrowBreath {
  0%, 100% {
    opacity: 0.49;
    transform: translateY(-10px);
  }
  50% {
    opacity: 0.49;
    transform: translateY(-2px);
  }
}

.dir-detail {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 0.5px dashed $divider;
}

.collapse-panel {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 1s ease, opacity 1s ease;
}

.collapse-panel.open {
  max-height: 1200px;
  opacity: 1;
}

.dir-detail-block + .dir-detail-block {
  margin-top: 12px;
}

.dir-detail-label {
  display: block;
  color: $accent;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
}

.dir-detail-line {
  display: block;
  font-size: 12px;
  color: $text-2;
  line-height: 1.8;
}

.detail-mini-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}

.detail-mini-card {
  padding: 10px 12px;
  border-radius: 12px;
  background: $bg-warm;
}

.detail-mini-tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(207, 113, 64, 0.12);
  color: $accent;
  font-size: 10px;
  font-weight: 700;
  margin-bottom: 6px;
}

.detail-mini-dir {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: $text-1;
  margin-bottom: 4px;
}

.dir-cta { margin-top: 14px; }

.school-card-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.school-logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: $bg-warm;
  flex-shrink: 0;
}

.school-card-body {
  flex: 1;
  min-width: 0;
}

.school-name {
  flex: 1;
  min-width: 0;
  @include serif;
  font-size: 15px;
  color: $text-1;
}

.school-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
  font-size: 12px;
  color: $text-2;
  line-height: 1.7;
}

.school-meta-b { color: $accent; font-weight: 600; }

.zk-l3-list .school-card {
  padding: 4px 10px;
  border-radius: 12px;
}

.zk-l3-list .school-card + .school-card {
  margin-top: 0;
}

.zk-l3-list .school-card-row {
  gap: 10px;
  align-items: center;
}

.zk-l3-list .school-logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

.zk-l3-list .school-name {
  font-size: 14px;
}

.zk-l3-list .school-meta-row {
  margin-top: 2px;
  gap: 6px;
  font-size: 11px;
  line-height: 1.4;
}

.tag {
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}

.tag-985 {
  background: rgba(207, 113, 64, 0.14);
  color: $accent;
}

.tag-211 {
  background: rgba(95, 140, 110, 0.14);
  color: $success;
}

.tag-normal {
  background: rgba(138, 129, 117, 0.14);
  color: $text-2;
}

.divider-text {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 0 10px;
  color: $text-3;
  font-size: 12px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: $divider;
}

.zk-list-title-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 2px;
}

.zk-list-header {
  @include serif;
  font-size: 18px;
  font-weight: 600;
  color: $text-1;
  display: block;
  flex-shrink: 0;
}

.zk-list-growing {
  color: $text-3;
  font-size: 12px;
  display: block;
}

.zk-search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 0.5px solid $border;
  border-radius: 14px;
  padding: 9px 14px;
  margin: 10px 0;
}

.zk-search-icon { font-size: 14px; color: $text-3; }

.zk-search-input {
  flex: 1;
  font-size: 14px;
  color: $text-1;
}

.filter-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.filter-label {
  width: 28px;
  flex-shrink: 0;
  font-size: 12px;
  color: $text-3;
  line-height: 30px;
}

.zk-list-cards {
  gap: 6px;
}

.zk-list-cards .school-card {
  padding: 10px 14px;
  border-radius: 14px;
}

.zk-list-cards .school-card-row {
  gap: 10px;
  align-items: center;
}

.zk-list-cards .school-logo {
  width: 40px;
  height: 40px;
}

.zk-list-cards .school-name {
  font-size: 14px;
}

.zk-list-cards .school-meta-row {
  margin-top: 4px;
  gap: 6px;
  font-size: 11px;
  line-height: 1.55;
}

.cta-button { margin-top: 18px; }
</style>
