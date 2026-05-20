<template>
  <view class="page-v3">
    <!-- 顶部 sticky 导航 -->
    <view class="topbar">
      <view class="topbar-row">
        <view class="tb-btn" @click="goBack">‹</view>
        <text class="tb-title">院校查询</text>
        <view class="tb-btn">≡</view>
      </view>
      <view class="search">
        <text class="search-icon">🔍</text>
        <input class="search-input" placeholder="搜索院校 / 专业 / 地区" v-model="searchKeyword" />
      </view>
    </view>

    <!-- 一级：项目 -->
    <view class="filter-row level-1">
      <view
        v-for="item in programTabs"
        :key="item"
        class="filter-chip"
        :class="{ active: selectedProgram === item }"
        @click="setProgram(item)"
      >{{ item }}</view>
    </view>

    <!-- 二级：省份 -->
    <view class="filter-row level-2">
      <view
        v-for="item in availableProvinceTabs"
        :key="item"
        class="filter-chip secondary"
        :class="{ active: selectedProvince === item }"
        @click="setProvince(item)"
      >{{ item }}</view>
    </view>

    <!-- 排序条 -->
    <view class="sort-row">
      <text class="sort-count">{{ selectedProgram }} · {{ selectedProvince }}：<text class="num">{{ uniqueSchoolCount }}</text> 所院校 · <text class="num">{{ filteredSchools.length }}</text> 个项目</text>
      <view class="sort-select">
        <text>综合排序</text>
        <text class="sort-arrow">⌄</text>
      </view>
    </view>

    <!-- 院校卡列表 -->
    <view class="school-list">
      <view
        v-for="school in filteredSchools"
        :key="school.id"
        class="school-card"
        @click="goToDetail(school.id)"
      >
        <view class="sc-row1">
          <view class="sc-avatar">
            <image class="sc-avatar-img" :src="school.logoUrl || defaultSchoolIcon" mode="aspectFit" />
          </view>
          <view class="sc-info">
            <text class="sc-name">{{ school.name }}</text>
            <text class="sc-loc">{{ school.city || '' }} · {{ school.levelText }}</text>
            <view class="sc-badges">
              <text class="sc-badge" v-if="school.type">{{ school.type }}</text>
              <text class="sc-badge" v-if="school.studyMode">{{ getStudyBadge(school.studyMode) }}</text>
              <text class="sc-badge green" v-if="school.latestScore">{{ school.latestScore }}</text>
              <text class="sc-badge green" v-if="school.hasInterview">提前面试</text>
            </view>
          </view>

        </view>
        <view class="sc-stats">
          <view class="sc-stat">
            <text class="stat-v">¥ {{ school.tuition }}</text>
            <text class="stat-l">学费</text>
          </view>
          <view class="sc-stat">
            <text class="stat-v">{{ school.latestScore || '待定' }}</text>
            <text class="stat-l">复试线</text>
          </view>
          <view class="sc-stat">
            <text class="stat-v">{{ school.enrollment ? school.enrollment + '人' : '待定' }}</text>
            <text class="stat-l">招生</text>
          </view>
        </view>
      </view>
    </view>

    <view class="empty-state" v-if="filteredSchools.length === 0">
      <text class="empty-title">{{ selectedProgram }} · {{ selectedProvince }} 数据整理中</text>
      <text class="empty-desc">当前按 MPA / MEM / MBA / 党校 -> 四川 / 重庆 / 云南 / 贵州 三级浏览。该层级暂无可发布院校数据。</text>
      <view class="empty-btn" @click="goTest">先测一测</view>
    </view>

    <!-- 加载更多 -->
    <view class="load-more" @click="loadMore" v-if="hasMore && filteredSchools.length > 0">
      ↓ 加载更多院校
    </view>
    <view class="load-more" v-else-if="filteredSchools.length > 0">
      已加载全部院校
    </view>

    <!-- Tab Bar -->
    <view class="tab-bar">
      <view class="tab-item" @click="goHome">
        <image class="tab-icon-img" src="/static/icons/tab-home.svg" mode="aspectFit" />
        <text class="tab-label">首页</text>
      </view>
      <view class="tab-item active" @click="goLearn">
        <image class="tab-icon-img" src="/static/icons/tab-learn-active.svg" mode="aspectFit" />
        <text class="tab-label">了解</text>
      </view>
      <view class="tab-item" @click="goTest">
        <image class="tab-icon-img" src="/static/icons/tab-test.svg" mode="aspectFit" />
        <text class="tab-label">测一测</text>
      </view>
      <view class="tab-item" @click="goContact">
        <image class="tab-icon-img" src="/static/icons/tab-contact.svg" mode="aspectFit" />
        <text class="tab-label">咨询</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getAllSchools, type SchoolListItem } from '@/data/school-data'
import { trackEvent } from '@/api/request'

const searchKeyword = ref('')
const selectedProgram = ref<'MPA' | 'MEM' | 'MBA' | '党校'>('MPA')
const selectedProvince = ref<'四川' | '重庆' | '云南' | '贵州'>('四川')
const hasMore = ref(false)
const defaultSchoolIcon = '/static/icons/school-mpa.svg'

const programTabs: Array<'MPA' | 'MEM' | 'MBA' | '党校'> = ['MPA', 'MEM', 'MBA', '党校']
const provinceTabs: Array<'四川' | '重庆' | '云南' | '贵州'> = ['四川', '重庆', '云南', '贵州']

// 从本地数据源加载院校
const schools = ref<SchoolListItem[]>([])

const loadSchools = () => {
  schools.value = getAllSchools()
}

onMounted(() => {
  loadSchools()
  if (!availableProvinceTabs.value.includes(selectedProvince.value)) {
    selectedProvince.value = availableProvinceTabs.value[0] || '四川'
  }
  trackEvent('view_school_list', {
    target_type: 'school',
    source: 'schools_page'
  })
})

const setProgram = (program: 'MPA' | 'MEM' | 'MBA' | '党校') => {
  selectedProgram.value = program
  if (!availableProvinceTabs.value.includes(selectedProvince.value)) {
    selectedProvince.value = availableProvinceTabs.value[0] || '四川'
  }
  trackEvent('filter_school_list', {
    target_type: 'school',
    level: 'program',
    filter: program
  })
}

const setProvince = (province: '四川' | '重庆' | '云南' | '贵州') => {
  selectedProvince.value = province
  trackEvent('filter_school_list', {
    target_type: 'school',
    level: 'province',
    filter: province
  })
}

onLoad((options: any) => {
  const filter = options?.filter || ''
  let normalized = filter
  for (let i = 0; i < 2; i += 1) {
    try {
      normalized = decodeURIComponent(normalized)
    } catch {
      break
    }
  }
  if (programTabs.includes(normalized as any)) selectedProgram.value = normalized as any
  const queryProvince = String(options?.province || '')
  if (provinceTabs.includes(queryProvince as any)) {
    selectedProvince.value = queryProvince as any
  }
})

const getMatch = (school: any) => {
  if (typeof school.matchScore === 'number') return school.matchScore
  if (school.name.includes('四川大学')) return 92
  if (school.name.includes('电子科技')) return 88
  if (school.name.includes('重庆大学')) return 85
  if (school.name.includes('党校')) return 78
  return 78
}

const getStudyBadge = (studyMode: string) => {
  if (studyMode.includes('非全')) return '非全'
  if (studyMode.includes('全日制')) return '全日制'
  return studyMode.length > 6 ? studyMode.slice(0, 6) : studyMode
}

const availableProvinceTabs = computed(() => {
  const set = new Set(
    schools.value
      .filter(school => school.type === selectedProgram.value)
      .map(school => school.province)
  )
  return provinceTabs.filter(item => set.has(item))
})

const filteredSchools = computed(() => {
  let list = schools.value

  // 搜索过滤
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(s =>
      s.name.toLowerCase().includes(kw) ||
      (s.city || '').toLowerCase().includes(kw) ||
      (s.type || '').toLowerCase().includes(kw) ||
      (s.province || '').toLowerCase().includes(kw)
    )
  }

  // 层级过滤：一级项目 -> 二级省份
  list = list.filter(s => s.type === selectedProgram.value)
  list = list.filter(s => s.province === selectedProvince.value)

  return list
})

const uniqueSchoolCount = computed(() => new Set(filteredSchools.value.map(school => school.code)).size)

const loadMore = () => {
  uni.showToast({ title: '更多院校加载中...', icon: 'none' })
}

const goBack = () => uni.navigateBack()
const goHome = () => uni.redirectTo({ url: '/pages/index/index' })
const goLearn = () => uni.redirectTo({ url: '/pages/learn/index' })
const goTest = () => uni.redirectTo({ url: '/pages/test/index' })
const goContact = () => uni.redirectTo({ url: '/pages/contact/index' })
const goToDetail = (id: string | number) => {
  const school = schools.value.find(item => item.id === id)
  trackEvent('click_school_card', {
    target_type: 'school',
    target_id: id,
    target_name: school?.name,
    school_name: school?.name,
    program_type: school?.type
  })
  uni.navigateTo({ url: `/pages/school-detail/index?id=${id}` })
}
</script>

<style lang="scss" scoped>
/* 按 UI 样本 05_院校列表页.html 规范编写 */
.page-v3 {
  background: #F5EFE7;
  min-height: 100vh;
  padding: 0 0 140px;
  box-sizing: border-box;
  max-width: 1248px;
  margin: 0 auto;
  overflow-x: hidden;
}

/* 顶部 sticky 导航 */
.topbar {
  background: #FFFFFF;
  padding: 12px 16px 8px;
  border-bottom: 0.5px solid #ECE5D8;
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.tb-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #2A251E;
}

.tb-title {
  font-family: "Songti SC", serif;
  font-weight: 500;
  font-size: 28px;
  color: #2A251E;
}

.search {
  background: #F5EFE7;
  border-radius: 999px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-icon {
  font-size: 14px;
}

.search-input {
  flex: 1;
  font-family: "Songti SC", serif;
  font-size: 14px;
  color: #2A251E;
  border: none;
  outline: none;
  background: transparent;

  &::placeholder {
    color: #8A8175;
  }
}

/* 筛选 chip 横向滚动 */
.filter-row {
  display: flex;
  gap: 12px;
  padding: 12px 16px 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.filter-row.level-2 {
  padding-top: 10px;
}

.filter-chip {
  flex-shrink: 0;
  padding: 10px 18px;
  border-radius: 999px;
  font-family: "Songti SC", serif;
  font-weight: 500;
  font-size: 16px;
  background: #FFFFFF;
  color: #6B6258;
  border: 0.5px solid #ECE5D8;
  letter-spacing: 0;
}

.filter-chip.secondary {
  font-size: 14px;
  padding: 8px 14px;
}

.filter-chip.active {
  background: #CF7140;
  color: white;
  border-color: #CF7140;
  box-shadow: 0 4px 12px rgba(207, 113, 64, 0.2);
}

/* 排序条 */
.sort-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px 12px;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
}

.sort-count {
  font-family: "Songti SC", serif;
  font-size: 17px;
  color: #6B6258;
  min-width: 0;
}

.num {
  color: #CF7140;
  font-weight: 600;
}

.sort-select {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: "Songti SC", serif;
  font-size: 17px;
  color: #2A251E;
  flex-shrink: 0;
}

.sort-arrow {
  color: #6B6258;
  font-size: 14px;
}

/* 院校卡列表 */
.school-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px;
  box-sizing: border-box;
}

.tab-bar {
  max-width: 1248px;
  left: 50%;
  transform: translateX(-50%);
  box-sizing: border-box;
}

.school-card {
  background: #FFFFFF;
  border-radius: 16px;
  border: 0.5px solid #ECE5D8;
  box-shadow: 0 2px 8px rgba(60, 50, 40, 0.04);
  padding: 16px;
  position: relative;
  overflow: hidden;
}

.sc-row1 {
  display: flex;
  align-items: start;
  gap: 12px;
  margin-bottom: 12px;
}

.sc-avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #F0E9DD;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sc-avatar-img {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: block;
}

.sc-info {
  flex: 1;
  min-width: 0;
}

.sc-name {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 16px;
  color: #2A251E;
  margin-bottom: 4px;
}

.sc-loc {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 12px;
  color: #8A8175;
  margin-bottom: 4px;
}

.sc-badges {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.sc-badge {
  font-family: "Songti SC", serif;
  font-size: 12px;
  color: #CF7140;
  background: #F1E0D3;
  padding: 2px 6px;
  border-radius: 999px;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.sc-badge.green {
  color: #5F8C6E;
  background: #DAE5DC;
}

.sc-stats {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 0.5px solid #E8E1D5;
}

.empty-state {
  margin: 0 32px;
  background: #FFFFFF;
  border-radius: 18px;
  border: 0.5px solid #ECE5D8;
  box-shadow: 0 2px 8px rgba(60, 50, 40, 0.04);
  padding: 40px 32px;
  text-align: center;
}

.empty-title {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 26px;
  color: #2A251E;
  margin-bottom: 10px;
}

.empty-desc {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 17px;
  line-height: 1.7;
  color: #6B6258;
  margin-bottom: 20px;
}

.empty-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  padding: 0 32px;
  border-radius: 999px;
  background: #CF7140;
  color: white;
  font-family: "Songti SC", serif;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.06em;
}

.sc-stat {
  flex: 1;
}

.stat-v {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 700;
  font-size: 12px;
  color: #2A251E;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-l {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 12px;
  color: #8A8175;
  letter-spacing: 0.04em;
  margin-top: 2px;
}

/* 加载更多 */
.load-more {
  text-align: center;
  color: #8A8175;
  font-size: 12px;
  margin-top: 8px;
  padding: 6px;
  font-family: "Songti SC", serif;
}

</style>
