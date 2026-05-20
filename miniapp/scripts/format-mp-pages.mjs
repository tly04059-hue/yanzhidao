import fs from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve('dist/dev/mp-weixin/pages')
const extensions = new Set(['.js', '.json', '.wxml', '.wxss'])

const formatJson = (source) => `${JSON.stringify(JSON.parse(source), null, 2)}\n`

const formatWxml = (source) => {
  const tokens = source
    .replace(/>\s*</g, '><')
    .split(/(?=<)|(?<=>)/g)
    .filter(Boolean)

  let level = 0
  const lines = []
  let index = 0

  while (index < tokens.length) {
    const token = tokens[index].trim()
    if (!token) {
      index += 1
      continue
    }

    if (/^<text(\s|>|$)/.test(token)) {
      const raw = [token]
      let textDepth = /\/>$/.test(token) ? 0 : 1
      index += 1

      while (index < tokens.length && textDepth > 0) {
        const current = tokens[index].trim()
        raw.push(current)
        if (/^<text(\s|>|$)/.test(current) && !/\/>$/.test(current)) textDepth += 1
        if (/^<\/text>/.test(current)) textDepth -= 1
        index += 1
      }

      lines.push(`${'  '.repeat(level)}${raw.join('')}`)
      continue
    }

    const isClosing = /^<\//.test(token)
    const isDeclaration = /^<\?/.test(token) || /^<!--/.test(token)
    const isSelfClosing = /\/>$/.test(token) || /^<input\b/.test(token) || /^<image\b/.test(token)
    const isOpening = /^<[^/!][^>]*>$/.test(token) && !isSelfClosing

    if (isClosing) level = Math.max(level - 1, 0)
    lines.push(`${'  '.repeat(level)}${token}`)
    if (isOpening && !isDeclaration) level += 1
    index += 1
  }

  return `${lines.join('\n')}\n`
}

const normalizeTextFile = (source) => `${source.trimEnd()}\n`

const formatFile = async (filePath) => {
  const ext = path.extname(filePath)
  const source = await fs.readFile(filePath, 'utf8')
  let formatted = source

  if (ext === '.json') formatted = formatJson(source)
  if (ext === '.wxml') formatted = formatWxml(source)
  if (ext === '.js' || ext === '.wxss') formatted = normalizeTextFile(source)

  if (formatted !== source) {
    await fs.writeFile(filePath, formatted, 'utf8')
  }
}

const walk = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(fullPath)
      continue
    }
    if (extensions.has(path.extname(entry.name))) {
      await formatFile(fullPath)
    }
  }
}

await walk(root)
console.log(`Formatted mp-weixin page files under ${root}`)
