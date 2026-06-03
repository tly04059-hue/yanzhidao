export type MapFilterKey = 'all' | 'sichuan' | 'minority' | 'chongqing'

export type MapCityRecord = {
  name: string
  count: number
  x: number
  y: number
  tag: 'normal' | 'minority' | 'chongqing'
  region: 'sichuan' | 'chongqing'
  systems: string
}

export const v6MapContent = {
  title: '研知道服务同学分布',
  brandLine: '已服务 1,000+ 川渝同学 · 不骗人 · 真服务',
  header: {
    eyebrow: 'FROM 1,000+',
    title: '在川渝的研知道同学',
    subtitle: '数据来自辅导班报名表 · 25 个地市覆盖'
  },
  mapCard: {
    title: '分布概览',
    total: '1,000+',
    totalUnit: '位同学'
  },
  highlight: {
    eyebrow: '真实分布观察',
    text: "民族地区合计 300+ 位（甘孜 · 凉山 · 阿坝）—— 是研知道除成都外较集中的服务区域。"
  },
  filters: [
    { key: 'all', label: '全部' },
    { key: 'sichuan', label: '四川' },
    { key: 'minority', label: '民族地区' },
    { key: 'chongqing', label: '重庆' }
  ] as const,
  chipsHeader: {
    title: '按城市查看',
    hint: '点击查看分布'
  },
  stats: [
    { label: '覆盖地市', value: '25', suffix: '/ 川 21·渝 4' },
    { label: '川 / 渝', value: '1397', suffix: '/ 185' },
    { label: '民族地区', value: '20.3', suffix: '%' }
  ],
  note: {
    title: '数据说明',
    intro: '数据来自研知道辅导班报名表，研知道已服务超过 1,000 名同学。',
    rules: [
      '所有数据严格脱敏到地级市层级，不显示区县 / 单位 / 个人',
      '四川按 21 个地级市统计（含 3 个民族州）',
      '重庆按 5 个地理片区合并（重庆主城 / 万州 / 涪陵 / 永川 / 黔江）',
      '样本量较小的城市按地级市层级合并展示',
      '数据更新于 2026-05；每届录取结束后更新'
    ]
  },
  footer: {
    name: '研 知 道',
    desc: '川渝在职考研 · 不骗人 · 真服务'
  }
} as const

export const mapCityRecords: MapCityRecord[] = [
  {
    "name": "成都",
    "count": 344,
    "x": 409.4,
    "y": 266.1,
    "tag": 'normal',
    "region": 'sichuan',
    "systems": "党政机关、教育医疗、国企银行、公检法"
  },
  {
    "name": "甘孜",
    "count": 142,
    "x": 173.6,
    "y": 243.8,
    "tag": 'minority',
    "region": 'sichuan',
    "systems": "民族地区专项、党政机关、乡镇"
  },
  {
    "name": "宜宾",
    "count": 118,
    "x": 451.6,
    "y": 408.0,
    "tag": 'normal',
    "region": 'sichuan',
    "systems": "党政机关、国企（化工）、教育医疗"
  },
  {
    "name": "凉山",
    "count": 117,
    "x": 298.7,
    "y": 454.5,
    "tag": 'minority',
    "region": 'sichuan',
    "systems": "民族地区专项、党政机关、乡镇"
  },
  {
    "name": "重庆主城",
    "count": 92,
    "x": 571.7,
    "y": 338.1,
    "tag": 'chongqing',
    "region": 'chongqing',
    "systems": "党政机关、国企、公检法、教育医疗"
  },
  {
    "name": "泸州",
    "count": 79,
    "x": 499.7,
    "y": 386.4,
    "tag": 'normal',
    "region": 'sichuan',
    "systems": "党政机关、教育医疗、国企（化工）"
  },
  {
    "name": "阿坝",
    "count": 62,
    "x": 330.5,
    "y": 146.3,
    "tag": 'minority',
    "region": 'sichuan',
    "systems": "民族地区专项、党政机关"
  },
  {
    "name": "南充",
    "count": 51,
    "x": 545.4,
    "y": 229.1,
    "tag": 'normal',
    "region": 'sichuan',
    "systems": "党政机关、乡镇街道"
  },
  {
    "name": "达州",
    "count": 51,
    "x": 631.6,
    "y": 217.4,
    "tag": 'normal',
    "region": 'sichuan',
    "systems": "党政机关、乡镇街道"
  },
  {
    "name": "乐山",
    "count": 43,
    "x": 387.9,
    "y": 364.2,
    "tag": 'normal',
    "region": 'sichuan',
    "systems": "党政机关、教育医疗"
  },
  {
    "name": "攀枝花",
    "count": 41,
    "x": 271.5,
    "y": 531.9,
    "tag": 'normal',
    "region": 'sichuan',
    "systems": "国企（钢铁）、党政机关"
  },
  {
    "name": "内江",
    "count": 40,
    "x": 468.1,
    "y": 335.3,
    "tag": 'normal',
    "region": 'sichuan',
    "systems": "党政机关、教育医疗"
  },
  {
    "name": "德阳",
    "count": 38,
    "x": 439.6,
    "y": 233.6,
    "tag": 'normal',
    "region": 'sichuan',
    "systems": "党政机关、教育医疗"
  },
  {
    "name": "巴中",
    "count": 37,
    "x": 595.3,
    "y": 173.1,
    "tag": 'normal',
    "region": 'sichuan',
    "systems": "党政机关、乡镇街道"
  },
  {
    "name": "广元",
    "count": 36,
    "x": 520.2,
    "y": 156.4,
    "tag": 'normal',
    "region": 'sichuan',
    "systems": "党政机关、乡镇街道"
  },
  {
    "name": "绵阳",
    "count": 35,
    "x": 455.5,
    "y": 184.4,
    "tag": 'normal',
    "region": 'sichuan',
    "systems": "党政机关、国企（科研院所）"
  },
  {
    "name": "资阳",
    "count": 35,
    "x": 480.3,
    "y": 303.9,
    "tag": 'normal',
    "region": 'sichuan',
    "systems": "党政机关、乡镇街道"
  },
  {
    "name": "雅安",
    "count": 34,
    "x": 333.7,
    "y": 316.5,
    "tag": 'normal',
    "region": 'sichuan',
    "systems": "党政机关、教育医疗"
  },
  {
    "name": "万州片区",
    "count": 33,
    "x": 693.2,
    "y": 244.7,
    "tag": 'chongqing',
    "region": 'chongqing',
    "systems": "党政机关、乡镇街道"
  },
  {
    "name": "眉山",
    "count": 31,
    "x": 398.8,
    "y": 315.7,
    "tag": 'normal',
    "region": 'sichuan',
    "systems": "党政机关、乡镇街道"
  },
  {
    "name": "永川片区",
    "count": 31,
    "x": 534.8,
    "y": 338.3,
    "tag": 'chongqing',
    "region": 'chongqing',
    "systems": "党政机关、教育医疗"
  },
  {
    "name": "广安",
    "count": 25,
    "x": 572.8,
    "y": 281.7,
    "tag": 'normal',
    "region": 'sichuan',
    "systems": "党政机关、乡镇街道"
  },
  {
    "name": "遂宁",
    "count": 23,
    "x": 501.6,
    "y": 267.6,
    "tag": 'normal',
    "region": 'sichuan',
    "systems": "党政机关、乡镇街道"
  },
  {
    "name": "黔江片区",
    "count": 18,
    "x": 680.9,
    "y": 361.5,
    "tag": 'chongqing',
    "region": 'chongqing',
    "systems": "党政机关、民族地区延伸"
  },
  {
    "name": "自贡",
    "count": 15,
    "x": 454.4,
    "y": 359.4,
    "tag": 'normal',
    "region": 'sichuan',
    "systems": "党政机关、乡镇街道"
  },
  {
    "name": "涪陵片区",
    "count": 11,
    "x": 598.1,
    "y": 355.6,
    "tag": 'chongqing',
    "region": 'chongqing',
    "systems": "党政机关、国企（化工）"
  }
]
