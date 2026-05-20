#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = '/Users/march/yanzhidao'
const dataFiles = [
  path.join(root, 'miniapp/src/data/199exam-miniapp-school-publish-sc-cq.json'),
  path.join(root, 'miniapp/src/data/party-school-miniapp-publish.json')
]

const outCsv = path.join(root, 'miniapp/src/static/icons/schools/logo_manifest.template.csv')
const outJson = path.join(root, 'miniapp/src/static/icons/schools/logo_manifest.template.json')
const outMd = path.join(root, 'project_docs/27-院校官方校徽替换清单.md')

const rows = []
for (const file of dataFiles) {
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  for (const r of json.records || []) {
    rows.push(r)
  }
}

const schoolMap = new Map()
for (const r of rows) {
  if (!schoolMap.has(r.school_id)) {
    schoolMap.set(r.school_id, {
      school_id: r.school_id,
      school_name: r.school_name,
      province: r.province,
      city: r.city,
      program_types: new Set([r.program_type])
    })
  } else {
    schoolMap.get(r.school_id).program_types.add(r.program_type)
  }
}

const items = Array.from(schoolMap.values())
  .map(s => ({
    school_id: String(s.school_id),
    school_name: s.school_name,
    province: s.province,
    city: s.city,
    program_types: Array.from(s.program_types).sort().join('/'),
    current_icon: `/static/icons/schools/${s.school_id}.svg`,
    official_logo_file: `${s.school_id}.svg`,
    official_logo_source: '',
    source_url: '',
    license_or_permission: '',
    status: 'todo',
    notes: ''
  }))
  .sort((a, b) => a.school_id.localeCompare(b.school_id, 'zh-Hans-CN'))

const csvHeader = [
  'school_id',
  'school_name',
  'province',
  'city',
  'program_types',
  'current_icon',
  'official_logo_file',
  'official_logo_source',
  'source_url',
  'license_or_permission',
  'status',
  'notes'
]
const csvLines = [csvHeader.join(',')]
for (const item of items) {
  const line = csvHeader
    .map(k => {
      const v = String(item[k] ?? '').replaceAll('"', '""')
      return `"${v}"`
    })
    .join(',')
  csvLines.push(line)
}

fs.writeFileSync(outCsv, `${csvLines.join('\n')}\n`, 'utf8')
fs.writeFileSync(outJson, `${JSON.stringify({ generated_at: new Date().toISOString(), count: items.length, items }, null, 2)}\n`, 'utf8')

const md = `# 院校官方校徽替换清单

> 生成时间：${new Date().toISOString()}  
> 学校数量：${items.length}

## 使用规则

1. 保持文件名与学校代码一致：\`${'${school_id}'}.svg\`（例如 \`10610.svg\`）。  
2. 把官方校徽文件放到目录：\`miniapp/src/static/icons/schools/\`。  
3. 替换同名文件即可生效，不需要改前端代码。  
4. 若暂时没有官方校徽，保留当前占位图，\`status\` 填 \`todo\`。  
5. 素材来源和授权务必填写到模板里，避免版权风险。

## 清单文件

- CSV 模板：\`miniapp/src/static/icons/schools/logo_manifest.template.csv\`
- JSON 模板：\`miniapp/src/static/icons/schools/logo_manifest.template.json\`
`
fs.writeFileSync(outMd, `${md}\n`, 'utf8')

console.log(JSON.stringify({ ok: true, count: items.length, outCsv, outJson, outMd }, null, 2))
