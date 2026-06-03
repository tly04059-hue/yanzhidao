import type { V5EntryCard, V5NavigationTarget, V5RouteKey, V5SectionHeader } from './types'

export type V5TextCard = {
  no?: string
  title: string
  text?: string
  items?: string[]
  mutedTitle?: boolean
}

export type V5RuleGroup = {
  title: string
  description: string
  rules: Array<{
    tag: string
    text: string
    highlight?: boolean
  }>
}

export type V5CompareColumn = {
  key: string
  label: string
}

export type V5CompareRow = {
  dimension: string
  values: Record<string, string>
  bold?: string
}

export const v5UnderstandContent = {
  route: 'understand',
  prd: '§4.2 了解 Tab 长文',
  dataSources: ['understand_long_form.json'],
  title: '在职考研学历了解',
  brandLine: '已服务 1,000+ 川渝同学 · 不骗人 · 真服务',
  hero: {
    kicker: '学历了解',
    title: '学历这件事，是这样的',
    copy: '考研，是工作上少有的依靠个人努力就有结果，且一次付出长期有价值的投资。'
  },
  policySection: {
    header: {
      title: '政策大背景',
      meta: '3-5 年窗口期'
    } satisfies V5SectionHeader,
    cards: [
      {
        no: '01',
        title: '党校学历体制内认可',
        text: '中发〔2000〕10 号文，党政机关 / 事业单位 / 国有企业内部认可，用于晋升、职称等。'
      },
      {
        no: '02',
        title: '职级并行 学历优势',
        text: '2019中办职级并行规定，研究生学历在定级、晋升中是重要加分项。'
      },
      {
        no: '03',
        title: '末等退出常态化',
        text: '2024年9月国资委提出，2025年国有企业普遍推行管理人员末等调整和不胜任退出制度。'
      },
      {
        no: '04',
        title: '限研岗占比12.95%',
        text: '2025国家公务员考试近60个岗位要求从\'本科可报考\'变为\'仅限研究生可报考\'，趋势明显。'
      }
    ] satisfies V5TextCard[],
    summary: {
      title: '总结 · 3-5 年窗口期',
      text: '延迟退休是长期影响，与以上几条政策叠加——学历发挥价值的时间和场景增多。不是焦虑营销，是基于事实的判断。具体执行视个人情况。'
    }
  },
  valueSection: {
    header: {
      title: '学历到底有什么用',
      meta: '3 类作用'
    } satisfies V5SectionHeader,
    cards: [
      {
        title: '发展',
        items: [
          '单位内竞争和发展的学历优势',
          '增加可以报考的遴选岗位',
          '调任资格审核更有竞争力，提升晋升概率',
          '职称评审年限优势（硕士比本科快 2-3 年到中级 / 3-5 年到副高）'
        ]
      },
      {
        title: '防御',
        items: [
          '国央企末等退出、新进人员平均学历提升、延迟退休让在岗时间增长需加大竞争 — 学历是少数能依靠自己、不被替代、长期有效的资产；延迟退休也让学历投资回收期对应延长。'
        ]
      },
      {
        title: '拓展',
        items: [
          '校友网络 = 体制内职业发展的隐性资产；理论和实践方法论的积累；学历提升带来的信心和提升抓住机会的能力。'
        ]
      }
    ] satisfies V5TextCard[]
  },
  dimensionSection: {
    header: {
      title: '不同情况下的路径选择',
      meta: '4 维度横扫 · 19 条规则'
    } satisfies V5SectionHeader,
    intro: '按系统、目标、学历、年龄四个维度先扫一遍，比上来就纠结学校更有效。',
    groups: [
      {
        title: '按系统看',
        description: '你在哪个系统，对口学校就大概率确定了。',
        rules: [
          { tag: '财政税务', text: '业务岗位选财经类院校综合类院校的 MPA 较多（业务对口 + 校友圈层），其他岗位考虑党校经济类专业的较多' },
          { tag: '党政机关', text: '党校在职研究生为主线，政治 / 经济 / 公管 / 战略类专业优先，选择 MPA 专业的占比相对较少' },
          { tag: '公检法', text: '党校在职研究生法学专业为主，MPA 双证为辅' },
          { tag: '教育医疗', text: '评副高的 MPA 优先，其他的党校单证优先，可提高发展下限，部分情况评中级职称有用' },
          { tag: '乡镇', text: '5 年服务期内是黄金窗口，优先考虑读研预算和拿证概率，选择党校在职研究生与统考非全双证的各占一半' },
          { tag: '国企', text: '受岗位类型和发展方向的影响较多，择校上统考非全偏向增强发展机会和专业能力提升，党校抬高下限' },
          { tag: '民族地区', text: '党校优先（四川民族专项 +15 分 + 单独录取批次，不是少数民族班）', highlight: true }
        ]
      },
      {
        title: '按目标看',
        description: '先想清楚为什么，再决定走哪条。',
        rules: [
          { tag: '本单位晋升', text: '党校在职为主（性价比 + 体制内认可双锁定）' },
          { tag: '遴选', text: '优先双证（MPA / MBA / MEM），党校单证次选' },
          { tag: '事转公', text: '优先双证 + 副处 / 副高级别满 2 年，党校单证次选' },
          { tag: '职称评审', text: '国民教育序列双证；硕士比本科快 2-3 / 3-5 年到中级 / 副高' },
          { tag: '防御性占位', text: '党校优先（成本低 + 同事敏感度低 + 不掉队）', highlight: true }
        ]
      },
      {
        title: '按学历看',
        description: '起点学历决定可选路径范围。',
        rules: [
          { tag: '全日制本科', text: '两条路径都可选（路径 A 党校 / 路径 B 统考非全含 MPA / MBA / MEM），按目标和资源选' },
          { tag: '非全本科', text: '两条路径基本全开，部分统考非全院校 MPA 需要检查是否限制非全日制本科' },
          { tag: '大专', text: '党校全部不收。约30%选择统考非全研究生，统考非全可接受大专毕业满5年' }
        ]
      },
      {
        title: '按年龄看',
        description: '时间窗口和政策红线视年龄段而定。',
        rules: [
          { tag: '25-30', text: '条件够先冲含金量高的双证，服务期内是黄金窗口，无论如何先搞定研究生学历' },
          { tag: '31-35', text: '根据目标和在职实际情况，选择统考非全双证 或 党校在职研究生单证' },
          { tag: '36-40', text: '晋升、调岗和防御一并考虑：政策上 2026 国考放宽至38，但实操部分单位仍卡35', highlight: true },
          { tag: '41+', text: '党校在职为主选择（防御性占位 + 延迟退休政策下回报期延长），双证提升为辅' }
        ]
      }
    ] satisfies V5RuleGroup[]
  },
  pathSection: {
    header: {
      title: '两条路径 + 学位类型对比',
      meta: 'A 党校 vs B 统考'
    } satisfies V5SectionHeader,
    intro: '路径A：党校在职研究生，体制内认可的独立路径；路径B：统考非全研究生，学信网可查，有MPA / MBA / MEM 3种招生人数较多的专业选择',
    columns: [
      { key: 'party', label: 'A 党校' },
      { key: 'mpa', label: 'B · MPA' },
      { key: 'mba', label: 'B · MBA' },
      { key: 'mem', label: 'B · MEM' }
    ] satisfies V5CompareColumn[],
    rows: [
      { dimension: '证书', values: { party: '单证', mpa: '双证', mba: '双证', mem: '双证' }, bold: 'party' },
      { dimension: '学信网', values: { party: '❌ 不可查', mpa: '✅ 可查', mba: '✅ 可查', mem: '✅ 可查' } },
      { dimension: '学费', values: { party: '2.16-2.4 万', mpa: '2.4-10.5 万', mba: '6-22 万', mem: '8-13 万' } },
      { dimension: '学制', values: { party: '3 年', mpa: '2-3 年', mba: '2-3 年', mem: '2-3 年' } },
      { dimension: '考试', values: { party: '政治+专业课', mpa: '管综+英二', mba: '管综+英二', mem: '管综+英二' } },
      { dimension: '党员', values: { party: '四川必须 / 重庆不限', mpa: '不要求', mba: '不要求', mem: '不要求' } },
      { dimension: '大专', values: { party: '❌ 无资格', mpa: '满 5 年可报', mba: '满 5 年可报', mem: '满 5 年可报' } }
    ] satisfies V5CompareRow[],
    action: {
      label: '看完整 11 维对比 + 目标场景适配 →',
      route: 'path'
    } satisfies V5NavigationTarget
  },
  peerSection: {
    header: {
      title: '同学们实际怎么选',
      meta: '1,000+ 全样本'
    } satisfies V5SectionHeader,
    stats: [
      { value: '62%', label: '党校在职研究生', subLabel: '', tone: 'A' },
      { value: '31%', label: '统考非全研究生', subLabel: 'MPA / MBA / MEM', tone: 'B' }
    ],
    case: {
      title: '王同学 · 市直机关 34 岁 · 党员',
      text: '想到了"先把学历这件事做了，不掉队"——最终选了川委党校经济学，3 年学制内已经在单位拿到副科。',
      quote: '"我没想着这一张文凭能带我升多远，但少了它，我可能连竞争资格都没有。"'
    },
    action: {
      label: '看更多同学案例 →',
      route: 'cases'
    } satisfies V5NavigationTarget
  },
  actionSection: {
    header: {
      title: '你可以做的事',
      meta: '3 个入口 · 平铺无主次'
    } satisfies V5SectionHeader,
    items: [
      {
        title: '看适合自己的参考方案',
        description: '测一测：8 道题 · 3 分钟 · 得到属于你的诊断书。',
        action: '开始测一测 →',
        route: 'test-entry'
      },
      {
        title: '进一步了解不同路径',
        description: '党校在职研究生 vs 统考非全研究生，分路径详细指南。',
        action: '看备考时间安排，选适合的路径 →',
        route: 'prep'
      },
      {
        title: '咨询了解 / 一对一聊',
        description: '加企微，把具体情况发我们，不骗人真服务，可以放心聊。',
        action: '加企微顾问 →',
        route: 'wechat'
      }
    ] satisfies V5EntryCard[]
  },
  footer: {
    title: '不骗人 · 真服务',
    subtitle: '研知道 · 成立于 2021 年'
  }
} as const

export type V5UnderstandContent = typeof v5UnderstandContent
