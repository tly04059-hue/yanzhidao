/**
 * 院校数据服务
 *
 * 当前小程序一期先接入 L2 发布层：
 * miniapp/src/data/199exam-miniapp-school-publish-sc-cq.json
 *
 * L2 来源于 schoolData/publish/199exam_miniapp_school_publish_sc_cq.json，
 * 前台按“学校 + 项目类型”聚合展示，详情页保留该项目下的院系/方向记录。
 */
import l2PublishData from './199exam-miniapp-school-publish-sc-cq.json'
import partySchoolPublishData from './party-school-miniapp-publish.json'
import schoolDataRaw from './schooldata-data.json'
import memDataRaw from './mem.json'

interface L2PublishRecord {
  id: string
  school_id: string
  program_id: string
  school_name: string
  school_label?: string
  program_type: string
  degree_type?: string
  exam_type?: string
  province: string
  city: string
  school_level_display?: string
  department_label?: string
  major_category_label?: string
  major_label?: string
  direction?: string
  enrollment?: number | string | null
  tuition_min?: number | null
  tuition_max?: number | null
  duration?: number | string | null
  study_mode?: string
  class_time?: string
  class_location?: string
  exam_subjects?: string
  total_score?: number
  latest_score?: string
  score_year?: number | string
  adjustment?: string
  junior_college_allowed?: string
  retired_soldier_plan?: string
  minority_backbone_plan?: string
  notes?: string
  description?: string
  logo_url?: string
  admission_analysis?: string
  retest_info?: string
  tags?: string[]
  filter_tags?: string[]
  sort_signals?: {
    cost_score?: number
    difficulty_score?: number
    work_friendly_score?: number
    recognition_score?: number
  }
  publish?: {
    source_record_id?: string
  }
}

// 学校列表项（用于列表页）
export interface SchoolListItem {
  id: string
  code: string
  name: string
  type: string
  province: string
  city: string
  levelText: string
  tags: string[]
  tuition: string
  duration: string
  studyMode: string
  enrollment: number
  hasInterview: boolean
  logoUrl: string
  matchScore?: number
  latestScore?: string
  programCount?: number
  tuitionValue?: number | null
  scoreValue?: number | null
  durationValue?: number | null
}

// 学校详情
export interface SchoolDetail {
  id: string
  code: string
  name: string
  type: string
  province: string
  city: string
  levelText: string
  tags: string[]
  tuition: string
  duration: string
  studyMode: string
  enrollment: string
  programs: Program[]
  logoUrl: string
  latestScore?: string
  scoreYear?: string
  classLocation?: string
  adjustment?: string
  admissionAnalysis?: string
  retestInfo?: string
  description?: string
  examType?: string
  degreeType?: string
  matchScore?: number
  programCount?: number
  retiredSoldierPlan?: string
  minorityBackbonePlan?: string
  sourceRecordIds?: string[]
  sortSignals?: {
    costScore: number
    difficultyScore: number
    workFriendlyScore: number
    recognitionScore: number
  }
}

// 招生项目
export interface Program {
  department: string
  examType: string
  major: string
  studyMode: string
  tuition: string
  duration: string
  direction: string
  notes: string
  veteranPlan: string
  minorityPlan: string
  enrollment: string
  examSubjects: string
  lastYearScore: string
  thisYearScore: string
  admission: string
  admissionRate: string
  classTime: string
  adjustment: string
}

const publishRecords = ((l2PublishData as any).records || []) as L2PublishRecord[]
const partyPublishRecords = ((partySchoolPublishData as any).records || []) as L2PublishRecord[]
const allPublishRecords = [...publishRecords, ...partyPublishRecords]

const schoolLogoMap = (() => {
  const map = new Map<string, string>()
  const walk = (node: any) => {
    if (!node) return
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    if (typeof node !== 'object') return
    const code = typeof node.school_code === 'string' ? node.school_code.trim() : ''
    const logo = typeof node.logo_url === 'string' ? node.logo_url.trim() : ''
    if (code && logo) map.set(code, logo)
    Object.values(node).forEach(walk)
  }
  walk(schoolDataRaw as any)
  walk(memDataRaw as any)
  return map
})()

const programOrder: Record<string, number> = {
  MPA: 1,
  MEM: 2,
  MBA: 3,
  党校: 4
}

const provinceOrder: Record<string, number> = {
  四川: 1,
  重庆: 2,
  云南: 3,
  贵州: 4
}

const toWan = (value?: number | null): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '待定'
  const wan = value / 10000
  return Number.isInteger(wan) ? `${wan}万` : `${wan.toFixed(1)}万`
}

const formatTuition = (min?: number | null, max?: number | null): string => {
  if (typeof min !== 'number' && typeof max !== 'number') return '待定'
  if (typeof min === 'number' && typeof max === 'number' && min !== max) {
    return `${toWan(min)}-${toWan(max)}`
  }
  return toWan(typeof min === 'number' ? min : max)
}

const formatDuration = (value?: number | string | null): string => {
  if (typeof value === 'number') return `${value} 年`
  if (typeof value === 'string' && value.trim()) return value.includes('年') ? value.replace(/(\d)(年)/, '$1 $2') : `${value} 年`
  return '待定'
}

const normalizeLevel = (value?: string): string => {
  if (value === '党校') return value
  if (value === '985' || value === '211' || value === '双非') return value
  return '双非'
}

const resolveSchoolLogo = (record: L2PublishRecord): string => {
  const remoteLogo = (record.logo_url || schoolLogoMap.get(record.school_id || '') || '').trim()
  if (remoteLogo) return remoteLogo
  if (record.school_id) return `/static/icons/schools/${record.school_id}.svg`
  const name = record.school_name || ''
  if (record.program_type === '党校') {
    if (name.includes('重庆')) return '/static/icons/school-party-cq.svg'
    return '/static/icons/school-party-sc.svg'
  }
  if (record.program_type === 'MEM') return '/static/icons/school-mem.svg'
  if (record.program_type === 'MBA') return '/static/icons/school-mba.svg'
  return '/static/icons/school-mpa.svg'
}

const numberValue = (value?: number | string | null): number | null => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d.]/g, ''))
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

const groupId = (record: L2PublishRecord): string => `${record.school_id}-${record.program_type}`.toLowerCase()

const buildTags = (records: L2PublishRecord[]): string[] => {
  const tags = new Set<string>()
  records.forEach(record => {
    ;(record.filter_tags || record.tags || []).forEach(tag => {
      if (tag) tags.add(tag)
    })
  })
  return Array.from(tags)
}

const groupRecords = (): L2PublishRecord[][] => {
  const groups = new Map<string, L2PublishRecord[]>()
  allPublishRecords.forEach(record => {
    const key = groupId(record)
    const current = groups.get(key) || []
    current.push(record)
    groups.set(key, current)
  })

  return Array.from(groups.values()).sort((a, b) => {
    const firstA = a[0]
    const firstB = b[0]
    return (
      (programOrder[firstA.program_type] || 99) - (programOrder[firstB.program_type] || 99) ||
      (provinceOrder[firstA.province] || 99) - (provinceOrder[firstB.province] || 99) ||
      firstA.city.localeCompare(firstB.city, 'zh-Hans-CN') ||
      firstA.school_name.localeCompare(firstB.school_name, 'zh-Hans-CN')
    )
  })
}

const pickRepresentative = (records: L2PublishRecord[]): L2PublishRecord => {
  const hasDisplayValue = (record: L2PublishRecord) =>
    typeof record.tuition_min === 'number' ||
    Boolean(record.latest_score) ||
    Boolean(record.enrollment)
  const hasTuition = (record: L2PublishRecord) => typeof record.tuition_min === 'number'
  const nonFullWithTuition = records.find(record => record.study_mode === '非全日制' && hasTuition(record))
  const nonFullWithValue = records.find(record => record.study_mode === '非全日制' && hasDisplayValue(record))
  const nonFull = records.find(record => record.study_mode === '非全日制')
  const anyWithTuition = records.find(hasTuition)
  const anyWithValue = records.find(hasDisplayValue)
  return nonFullWithTuition || nonFullWithValue || nonFull || anyWithTuition || anyWithValue || records[0]
}

const getEnrollmentSummary = (records: L2PublishRecord[]): number => {
  const values = records.map(record => numberValue(record.enrollment)).filter((value): value is number => value !== null)
  if (!values.length) return 0
  return Math.max(...values)
}

const summarizeFlag = (records: L2PublishRecord[], key: 'retired_soldier_plan' | 'minority_backbone_plan'): string => {
  const values = Array.from(new Set(records.map(record => record[key]).filter(Boolean))) as string[]
  if (!values.length) return '待确认'
  if (values.includes('是')) return '是'
  if (values.includes('否')) return '否'
  return values.join(' / ')
}

const averageSignal = (records: L2PublishRecord[], key: keyof NonNullable<L2PublishRecord['sort_signals']>, fallback = 7): number => {
  const values = records
    .map(record => record.sort_signals?.[key])
    .filter((value): value is number => typeof value === 'number')
  if (!values.length) return fallback
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

const calculateMatchScore = (records: L2PublishRecord[]): number => {
  const recognition = averageSignal(records, 'recognition_score', 6)
  const workFriendly = averageSignal(records, 'work_friendly_score', 7)
  const cost = averageSignal(records, 'cost_score', 6)
  const difficulty = averageSignal(records, 'difficulty_score', 6)
  return Math.max(72, Math.min(96, Math.round(60 + recognition * 1.5 + workFriendly + cost * 0.8 - difficulty * 0.4)))
}

const transformListGroup = (records: L2PublishRecord[]): SchoolListItem => {
  const first = pickRepresentative(records)
  const tuitionValue = typeof first.tuition_min === 'number' ? first.tuition_min / 10000 : null
  const scoreValue = numberValue(first.total_score || first.latest_score || null)
  const durationValue = numberValue(first.duration)
  return {
    id: groupId(first),
    code: first.school_id,
    name: first.school_name,
    type: first.program_type,
    province: first.province,
    city: first.city,
    levelText: normalizeLevel(first.school_level_display),
    tags: buildTags(records),
    tuition: formatTuition(first.tuition_min, first.tuition_max),
    duration: formatDuration(first.duration),
    studyMode: first.class_time || first.study_mode || '待定',
    enrollment: getEnrollmentSummary(records),
    hasInterview: buildTags(records).includes('提前面试'),
    logoUrl: resolveSchoolLogo(first),
    matchScore: calculateMatchScore(records),
    latestScore: first.total_score ? String(first.total_score) : (first.latest_score?.split('/')[0] || ''),
    programCount: records.length,
    tuitionValue,
    scoreValue,
    durationValue
  }
}

const transformProgram = (record: L2PublishRecord): Program => ({
  department: record.department_label || '',
  examType: record.exam_type || '全国联考',
  major: record.major_label || record.major_category_label || record.program_type,
  studyMode: record.study_mode || '',
  tuition: formatTuition(record.tuition_min, record.tuition_max),
  duration: formatDuration(record.duration),
  direction: record.direction || '不区分研究方向',
  notes: record.notes || record.description || '',
  veteranPlan: record.retired_soldier_plan || '',
  minorityPlan: record.minority_backbone_plan || '',
  enrollment: record.enrollment ? `${record.enrollment}人` : '待定',
  examSubjects: record.exam_subjects || record.exam_type || '全国联考',
  lastYearScore: '——',
  thisYearScore: record.latest_score || '——',
  admission: record.admission_analysis || '',
  admissionRate: '',
  classTime: record.class_time || '',
  adjustment: record.adjustment || ''
})

const transformDetailGroup = (records: L2PublishRecord[]): SchoolDetail => {
  const first = pickRepresentative(records)
  const tags = buildTags(records)
  return {
    id: groupId(first),
    code: first.school_id,
    name: first.school_name,
    type: first.program_type,
    province: first.province,
    city: first.city,
    levelText: normalizeLevel(first.school_level_display),
    tags,
    tuition: formatTuition(first.tuition_min, first.tuition_max),
    duration: formatDuration(first.duration),
    studyMode: first.class_time || first.study_mode || '待定',
    enrollment: getEnrollmentSummary(records) ? `约${getEnrollmentSummary(records)}人` : '待定',
    programs: records.map(transformProgram),
    logoUrl: resolveSchoolLogo(first),
    latestScore: first.latest_score || '',
    scoreYear: first.score_year ? String(first.score_year) : '',
    classLocation: first.class_location || '',
    adjustment: first.adjustment || '',
    admissionAnalysis: first.admission_analysis || '',
    retestInfo: first.retest_info || '',
    description: first.description || '',
    examType: first.exam_type || '全国联考',
    degreeType: first.degree_type || '双证',
    matchScore: calculateMatchScore(records),
    programCount: records.length,
    retiredSoldierPlan: summarizeFlag(records, 'retired_soldier_plan'),
    minorityBackbonePlan: summarizeFlag(records, 'minority_backbone_plan'),
    sourceRecordIds: records.map(record => record.publish?.source_record_id || record.id),
    sortSignals: {
      costScore: averageSignal(records, 'cost_score', 6),
      difficultyScore: averageSignal(records, 'difficulty_score', 6),
      workFriendlyScore: averageSignal(records, 'work_friendly_score', 7),
      recognitionScore: averageSignal(records, 'recognition_score', 6)
    }
  }
}

export const getAllSchools = (): SchoolListItem[] => {
  return groupRecords().map(transformListGroup).filter(s => s.type !== '党校')
}

export const getSchoolsByType = (type: string): SchoolListItem[] => {
  return getAllSchools().filter(school => school.type === type)
}

export interface PartyDirection {
  id: string
  province: string
  major: string
  enrollment: number
  fit: string
  examSubjects: string
  notes: string
  direction: string
  detailSections: Array<{
    label: string
    text?: string
    items?: Array<{
      tag: string
      dir: string
      fit: string
    }>
  }>
}

const PARTY_FIT_MAP: Record<string, string> = {
  '经济学': '财政 / 金融 / 产业经济 / 招商',
  '政治学': '党政 / 公管 / 政策研究 · 覆盖最广',
  '法学': '纪检 / 法务 / 合规 · 最难考',
  '经济管理': '财政 / 金融 / 产业经济',
  '法律': '纪检 / 法务 / 合规',
  '公共管理': '民政 / 人社 / 应急 / 街道 · 覆盖最广',
  '党政管理': '组织 / 宣传 / 纪委 / 统战',
  '战略管理': '发改 / 政研 / 外事 / 国企战略'
}

const PARTY_DETAIL_MAP: Record<
  string,
  Array<{
    label: string
    text?: string
    items?: Array<{
      tag: string
      dir: string
      fit: string
    }>
  }>
> = {
  '四川-经济学': [
    {
      label: '班级细分',
      items: [
        { tag: '1·2 班', dir: '政治经济学', fit: '财政局 / 经信局 / 发改委 / 城投公司' },
        { tag: '3 班', dir: '产业经济学', fit: '产业规划 / 园区 / 招商' },
        { tag: '4 班', dir: '区域经济学', fit: '招商办 / 开发区 / 外事办' },
        { tag: '5 班', dir: '财政学 / 金融学', fit: '财政 / 金融 / 综合经济岗' }
      ]
    },
    {
      label: '招生备注',
      text: '150 普通 / 50 民族专项（三州 + 三县 +15 分）'
    }
  ],
  '四川-政治学': [
    {
      label: '班级细分',
      items: [
        { tag: '1 班', dir: '党史党建', fit: '党委办 / 宣传部 / 组织部 / 国企党委 / 群团办' },
        { tag: '2 班', dir: '政治科学', fit: '外事 / 涉外 / 政策研究' },
        { tag: '3 班', dir: '公共管理', fit: '公共管理 / 政务管理岗' },
        { tag: '4 班', dir: '应急管理', fit: '街道办 / 应急局 / 政务大厅 / 医院行政 / 学校保卫' },
        { tag: '5 班', dir: '马克思主义理论与哲学实践', fit: '理论研究 / 党校 / 政策研究' },
        { tag: '6 班', dir: '社会治理', fit: '文化馆 / 妇联 / 群团 / 融媒体 / 社区治理 / 信访 / 民宗' }
      ]
    },
    {
      label: '招生备注',
      text: '225 普通 / 75 民族专项 · 6 个班级方向最丰富'
    }
  ],
  '四川-法学': [
    {
      label: '班级细分',
      items: [
        { tag: '1 班', dir: '法理学 + 党内法规', fit: '综合办 / 纪检 / 法务 / 信访 / 执法辅助' },
        { tag: '2 班', dir: '行政法学 + 法治政府建设', fit: '公共政策 / 法规研究 / 政策起草 / 制度评估' },
        { tag: '3 班', dir: '民商法学 + 法治社会', fit: '产业园区 / 开发区 / 企业合规 / 合同管理 / 风控' }
      ]
    },
    {
      label: '招生备注',
      text: '75 普通 / 25 民族专项 · 招生最少 · 最难考'
    }
  ],
  '重庆-经济管理': [
    { label: '考试科目', text: '政治理论 + 专业综合（政治经济学、管理学）' },
    { label: '对口岗位', text: '财政 / 金融 / 产业经济（需要一定管理学基础）' },
    { label: '注意', text: '需要管理学基础，零基础慎选。' }
  ],
  '重庆-法律': [
    { label: '考试科目', text: '政治理论 + 专业综合（法理学、行政法与行政诉讼法）' },
    { label: '对口岗位', text: '纪检 / 法务 / 合规' },
    { label: '注意', text: '无法学基础不建议首选。' }
  ],
  '重庆-公共管理': [
    { label: '考试科目', text: '政治理论 + 专业综合（政治学、公共管理学）' },
    { label: '对口岗位', text: '民政 / 人社 / 应急 / 街道社区' },
    { label: '特征', text: '覆盖最广 · 横向协调岗位首选。' }
  ],
  '重庆-党政管理': [
    { label: '考试科目', text: '政治理论 + 专业综合（政治学、马克思主义党的学说史）' },
    { label: '对口岗位', text: '组织 / 宣传 / 纪委 / 统战 / 党校' },
    { label: '特征', text: '纵向管理 · 培训对象优先。' }
  ],
  '重庆-战略管理': [
    { label: '考试科目', text: '政治理论 + 专业综合（领导科学、战略思维）' },
    { label: '对口岗位', text: '发改 / 政研 / 外事 / 国企战略' },
    { label: '特征', text: '前瞻布局 · 领导职位优先 · 招生最少。' }
  ]
}

export const getPartyDirectionCounts = () => ({
  sichuan: partyPublishRecords.filter(r => r.province === '四川').length,
  chongqing: partyPublishRecords.filter(r => r.province === '重庆').length
})

export const getPartyDirections = (province: string): PartyDirection[] =>
  partyPublishRecords
    .filter(r => r.province === province)
    .map(r => ({
      id: r.id,
      province: r.province,
      major: r.major_label || '',
      enrollment: typeof r.enrollment === 'number' ? r.enrollment : 0,
      fit: PARTY_FIT_MAP[r.major_label || ''] || r.description || '',
      examSubjects: r.exam_subjects || '政治理论 + 政治学 / 公共管理学',
      notes: r.notes || r.description || '',
      direction: r.direction || '不区分研究方向',
      detailSections: PARTY_DETAIL_MAP[`${r.province}-${r.major_label || ''}`] || []
    }))

export const getSchoolById = (id: string): SchoolDetail | null => {
  const records = groupRecords().find(group => groupId(group[0]) === id)
  return records ? transformDetailGroup(records) : null
}

export const searchSchools = (keyword: string): SchoolListItem[] => {
  const kw = keyword.toLowerCase().trim()
  if (!kw) return getAllSchools()
  return getAllSchools().filter(school =>
    school.name.toLowerCase().includes(kw) ||
    school.city.toLowerCase().includes(kw) ||
    school.type.toLowerCase().includes(kw) ||
    school.province.toLowerCase().includes(kw) ||
    school.tags.some(tag => tag.toLowerCase().includes(kw))
  )
}
