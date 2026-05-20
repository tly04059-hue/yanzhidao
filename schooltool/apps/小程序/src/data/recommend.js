// 推荐引擎（前端 MVP 版，后续迁移到后端）
import { cases } from './cases.js'

// 四川党校专业匹配表
const sichuanMajorMap = {
  org_propaganda: { major: '政治学', direction: '党建' },
  police: { major: '政治学', direction: '社会治理' },
  court: { major: '法学', direction: '法治社会' },
  procuratorate: { major: '法学', direction: '法治社会' },
  discipline: { major: '政治学', direction: '社会治理' },
  emergency: { major: '政治学', direction: '应急管理' },
  civil: { major: '政治学', direction: '公共管理' },
  finance: { major: '经济学', direction: '区域经济' },
  legal: { major: '法学', direction: '法治社会' },
  party: { major: '政治学', direction: '党建' },
  general: { major: '政治学', direction: '公共管理' },
  teacher_admin: { major: '政治学', direction: '公共管理' },
  medical_admin: { major: '政治学', direction: '公共管理' },
  management: { major: '政治学', direction: '公共管理' },
  other: { major: '政治学', direction: '公共管理' }
}

// 重庆党校专业匹配表
const chongqingMajorMap = {
  org_propaganda: '党政管理',
  police: '公共管理',
  court: '法律',
  procuratorate: '法律',
  discipline: '党政管理',
  emergency: '公共管理',
  civil: '公共管理',
  finance: '经济管理',
  legal: '法律',
  party: '党政管理',
  general: '公共管理',
  teacher_admin: '公共管理',
  medical_admin: '公共管理',
  management: '公共管理',
  finance_bank: '经济管理',
  other: '公共管理'
}

// MPA 院校匹配
const mpaSchoolMap = {
  sichuan: {
    finance: '西南财经大学MPA',
    finance_bank: '西南财经大学MPA',
    default: '四川大学MPA'
  },
  chongqing: {
    default: '重庆大学MPA'
  }
}

// MBA 院校匹配
const mbaSchoolMap = {
  sichuan: '电子科技大学MBA',
  chongqing: '重庆大学MBA'
}

export function getRecommendation(answers) {
  const { system, party_member, region, education, age, goal, position, budget } = answers
  const warnings = []
  let primaryPath = 'dangxiao' // dangxiao or mpa
  let primary = {}
  let alternative = {}

  // === 第一层：硬阻断 ===
  if (education === 'college') {
    return {
      blocked: true,
      message: '大专学历暂不满足在职研究生报考条件。建议先通过成人本科提升学历后再报考。',
      warnings: ['大专学历暂不符合报考条件']
    }
  }

  // === 第二层：目标分流 ===
  if (['transfer', 'switch', 'title'].includes(goal)) {
    primaryPath = 'mpa'
  }

  // === 第三层：排除规则 ===
  // 非党员+四川 → 排除四川党校
  if (party_member === 'no' && region === 'sichuan' && primaryPath === 'dangxiao') {
    warnings.push('四川党校要求中共党员身份。已为你调整为重庆党校（不要求党员）或MPA方案。')
    // 改推重庆党校或MPA
    if (budget === 'low') {
      // 预算低，推重庆党校
      primary = {
        school: '重庆市委党校',
        major: chongqingMajorMap[position] || '公共管理',
        fee: '2.4万/3年',
        duration: '3年（周末集中+寒暑假）',
        reason: generateReason(education, 'dangxiao', '重庆党校不要求党员身份，学费低，是非党员的最佳选择。')
      }
    } else {
      primaryPath = 'mpa'
    }
  }

  // 教师医护专技岗 → 强制MPA
  if (['teacher_tech', 'medical_tech'].includes(position)) {
    primaryPath = 'mpa'
    warnings.push('专技岗位职称评定通常不认可党校学历，建议选择MPA/MBA双证。')
  }

  // 乡镇+25-30 → 提醒服务期
  if (system === 'township' && age === '25-30') {
    warnings.push('乡镇岗位可能有5年最低服务期限制，建议确认服务期是否已满。')
  }

  // 重庆+遴选+36岁+ → 年龄提醒
  if (region === 'chongqing' && goal === 'transfer' && ['36-40', '41+'].includes(age)) {
    warnings.push('重庆遴选一般要求35岁以下，建议确认目标岗位的年龄限制。')
  }

  // 四川+遴选+41岁+ → 年龄提醒
  if (region === 'sichuan' && goal === 'transfer' && age === '41+') {
    warnings.push('四川遴选一般要求40岁以下，建议确认目标岗位的年龄限制。')
  }

  // 预算兜底：预算低+MPA首选 → 转党校
  if (budget === 'low' && primaryPath === 'mpa') {
    if (party_member === 'yes' || region === 'chongqing') {
      warnings.push('MPA学费通常在5-8万，你的预算更适合党校方案（2-3万）。已优先推荐党校。')
      primaryPath = 'dangxiao'
    }
  }

  // === 第四层：具体匹配 ===
  if (!primary.school) {
    if (primaryPath === 'dangxiao') {
      if (region === 'sichuan') {
        const majorInfo = sichuanMajorMap[position] || sichuanMajorMap.other
        primary = {
          school: '四川省委党校',
          major: `${majorInfo.major}（${majorInfo.direction}）`,
          fee: '2.16万/3年',
          duration: '3年（周末集中+寒暑假）',
          reason: generateReason(education, 'dangxiao', `你在${getSystemLabel(system)}工作，${majorInfo.major}专业与你的日常业务高度对口。`)
        }
      } else {
        const major = chongqingMajorMap[position] || '公共管理'
        primary = {
          school: '重庆市委党校',
          major: major,
          fee: '2.4万/3年',
          duration: '3年（周末集中+寒暑假）',
          reason: generateReason(education, 'dangxiao', `你在${getSystemLabel(system)}工作，${major}专业与你的岗位方向匹配。`)
        }
      }
    } else {
      // MPA路径
      const schoolMap = mpaSchoolMap[region] || mpaSchoolMap.sichuan
      const school = schoolMap[position] || schoolMap.default
      primary = {
        school: school,
        major: 'MPA（公共管理硕士）',
        fee: region === 'sichuan' ? '约5.4-8.4万/3年' : '约6万/3年',
        duration: '3年（周末+集中授课）',
        reason: generateReason(education, 'mpa', getMpaReasonExtra(goal, system))
      }
    }
  }

  // === 备选方案 ===
  if (primaryPath === 'dangxiao') {
    const schoolMap = mpaSchoolMap[region] || mpaSchoolMap.sichuan
    const altSchool = schoolMap[position] || schoolMap.default
    alternative = {
      school: altSchool,
      major: 'MPA（公共管理硕士）',
      fee: region === 'sichuan' ? '约5.4-8.4万/3年' : '约6万/3年',
      reason: getMpaAltReason(goal, system)
    }
  } else {
    // MPA首选时，备选给党校
    if (region === 'sichuan' && party_member === 'yes') {
      const majorInfo = sichuanMajorMap[position] || sichuanMajorMap.other
      alternative = {
        school: '四川省委党校',
        major: `${majorInfo.major}（${majorInfo.direction}）`,
        fee: '2.16万/3年',
        reason: '如果预算有限或更看重党校系统内的人脉资源，党校也是不错的选择。'
      }
    } else {
      const major = chongqingMajorMap[position] || '公共管理'
      alternative = {
        school: '重庆市委党校',
        major: major,
        fee: '2.4万/3年',
        reason: '如果预算有限，党校学费仅2万多，性价比很高。'
      }
    }
  }

  // 国企MBA特殊处理
  if (system === 'soe' && ['management', 'finance_bank'].includes(position) && goal !== 'switch') {
    const mbaSchool = mbaSchoolMap[region]
    alternative = {
      school: mbaSchool,
      major: 'MBA（工商管理硕士）',
      fee: region === 'sichuan' ? '约9.6万/3年' : '约13万/3年',
      reason: 'MBA在国企和金融系统的认可度最高，如果预算允许可以考虑。'
    }
  }

  // === 案例匹配 ===
  const matchedCase = matchCase(answers)

  // === 匹配度计算 ===
  const fitScore = calculateFitScore(answers, primaryPath)

  // === 同行数据 ===
  const peerData = getPeerData(answers)

  return {
    blocked: false,
    primary,
    alternative,
    matchedCase,
    fitScore,
    peerData,
    warnings,
    answers // 传递用于结果页显示
  }
}

function generateReason(education, path, extra) {
  const prefix = education === 'fulltime_bachelor'
    ? '让你的优势更明显——'
    : '不让学历成为你唯一的短板——'

  if (path === 'dangxiao') {
    return prefix + extra + '在组织考察和竞争上岗中更有底气。'
  } else {
    return prefix + extra
  }
}

function getMpaReasonExtra(goal, system) {
  if (goal === 'transfer') return 'MPA双证是遴选的硬性条件，也是最受体制内认可的管理类学位。'
  if (goal === 'switch') return 'MPA双证考公务员完全认可，是从国企转体制的最佳学历路径。'
  if (goal === 'title') return '职称评定需要国民教育系列学历，MPA双证完全符合要求。'
  return 'MPA双证在体制内认可度最高，无论是晋升还是遴选都是加分项。'
}

function getMpaAltReason(goal) {
  if (goal === 'transfer') return '如果未来考虑遴选到上级单位，MPA双证是硬性要求。校友网络也是重要资源。'
  return '如果预算允许，MPA双证在体制内的认可度更广，可作为备选考虑。'
}

function getSystemLabel(system) {
  const map = {
    gov: '党政机关', law: '公检法', township: '乡镇街道',
    public: '教育医疗', soe: '国企', ethnic: '民族地区'
  }
  return map[system] || '体制内'
}

function matchCase(answers) {
  // 5维度加权匹配
  let bestMatch = null
  let bestScore = -1

  cases.forEach(c => {
    let score = 0
    if (c.system === answers.system) score += 30
    if (c.goal === answers.goal) score += 25
    if (c.education === answers.education) score += 20
    if (answers.region === 'chongqing' && c.city === '重庆') score += 15
    if (answers.region === 'sichuan' && c.city !== '重庆') score += 15
    // 年龄段粗匹配
    const ageNum = parseInt(answers.age)
    if (Math.abs(c.age - ageNum) <= 5) score += 10

    if (score > bestScore) {
      bestScore = score
      bestMatch = c
    }
  })

  return bestMatch
}

function calculateFitScore(answers, path) {
  // 简化版匹配度（60-98范围）
  let base = 75
  if (answers.party_member === 'yes' && path === 'dangxiao') base += 8
  if (answers.education === 'fulltime_bachelor') base += 5
  if (['promotion', 'defense'].includes(answers.goal) && path === 'dangxiao') base += 5
  if (['transfer', 'title'].includes(answers.goal) && path === 'mpa') base += 5
  if (answers.budget === 'low' && path === 'dangxiao') base += 3
  if (answers.budget === 'mid' && path === 'mpa') base += 3
  return Math.min(base, 98)
}

function getPeerData(answers) {
  // MVP 模拟同行数据（后续接真实数据库）
  const isGov = ['gov', 'law', 'township'].includes(answers.system)
  const dangxiaoPercent = isGov ? 78 : 45
  return {
    total: 186,
    dangxiao: dangxiaoPercent,
    mpa: 100 - dangxiaoPercent,
    dangxiaoPassRate: '40.4%',
    mpaPassRate: '87.5%'
  }
}
