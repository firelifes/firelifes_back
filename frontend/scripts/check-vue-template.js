#!/usr/bin/env node
/**
 * Vue 模板轻量级静态检查器（v2 - 基于状态机）
 *
 * 目的：在本地开发/构建前，拦截 vite 才会报的低级模板错误，
 *      避免推到远程后 SIT 部署才发现（参考 TransferForm 多余 </view> 事件）。
 *
 * 检查项：
 * 1. <template> 配对
 * 2. <view> / <text> / <scroll-view> 配对
 * 3. 多余的闭合标签
 *
 * 写法：手写状态机，正确处理：
 * - 双引号字符串内的 < > 不计为标签
 * - 单引号字符串内的 < > 不计为标签
 * - HTML 注释 <!-- ... --> 内的标签不计
 * - {{ ... }} 表达式内的 < > 不计
 *
 * 这是兜底轻量检查，完整检查还是要靠 vite:vue 编译器。
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'src')

// 需要配对闭合的标签（UniApp 核心容器）
const PAIR_TAGS = new Set(['view', 'text', 'scroll-view', 'template'])

const errors = []

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
      walk(p)
    } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.vue') {
      checkFile(p)
    }
  }
}

/**
 * 状态机扫描：识别 template 内容里所有真实的开始标签、结束标签、自闭合标签。
 * 过滤掉：
 * - 注释 <!-- ... -->
 * - 字符串 "..."  '...'  模板字符串 `...`
 * - 表达式 {{ ... }}
 */
function scanTags(templateBody) {
  const tags = []
  let i = 0
  const len = templateBody.length

  while (i < len) {
    const ch = templateBody[i]

    // 跳过 HTML 注释
    if (ch === '<' && templateBody.slice(i, i + 4) === '<!--') {
      const end = templateBody.indexOf('-->', i + 4)
      i = end === -1 ? len : end + 3
      continue
    }

    // 跳过 {{ ... }} 表达式
    if (ch === '{' && templateBody[i + 1] === '{') {
      let depth = 2
      i += 2
      while (i < len && depth > 0) {
        if (templateBody[i] === '{' && templateBody[i + 1] === '{') { depth += 2; i += 2; continue }
        if (templateBody[i] === '}' && templateBody[i + 1] === '}') { depth -= 2; i += 2; continue }
        i++
      }
      continue
    }

    // 跳过字符串
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch
      i++
      while (i < len && templateBody[i] !== quote) {
        if (templateBody[i] === '\\') i += 2
        else i++
      }
      i++ // 跳过右引号
      continue
    }

    // 找到标签开始
    if (ch === '<') {
      const startIdx = i
      // 判断是结束标签 </tag> 还是开始标签 <tag ...> 或 <tag/>
      let j = i + 1
      const isClose = templateBody[j] === '/'
      if (isClose) j++

      // 读取标签名
      const nameStart = j
      while (j < len && /[a-zA-Z0-9-]/.test(templateBody[j])) j++
      const tagName = templateBody.slice(nameStart, j)
      if (!tagName) { i++; continue } // 不是有效标签，跳过

      // 跳过属性，直到找到 > 或 />
      // 在属性区里遇到 " ' ` { 都要进入对应字符串
      let selfClosing = false
      while (j < len) {
        const c = templateBody[j]
        if (c === '"' || c === "'" || c === '`') {
          const q = c; j++
          while (j < len && templateBody[j] !== q) {
            if (templateBody[j] === '\\') j += 2
            else j++
          }
          j++; continue
        }
        if (c === '{') {
          // 表达式
          let depth = 1
          j++
          while (j < len && depth > 0) {
            if (templateBody[j] === '{') depth++
            else if (templateBody[j] === '}') depth--
            j++
          }
          continue
        }
        if (c === '/' && templateBody[j + 1] === '>') { selfClosing = true; j += 2; break }
        if (c === '>') { j++; break }
        j++
      }

      tags.push({
        name: tagName,
        isClose,
        selfClosing,
        start: startIdx,
        end: j,
        line: templateBody.slice(0, startIdx).split('\n').length,
      })
      i = j
      continue
    }

    i++
  }
  return tags
}

function checkTemplate(file, templateBody) {
  const tags = scanTags(templateBody)
  const stack = []
  for (const t of tags) {
    if (!PAIR_TAGS.has(t.name)) continue
    if (t.selfClosing) continue
    if (t.isClose) {
      const top = stack[stack.length - 1]
      if (!top) {
        errors.push({ file, line: t.line, msg: `多余的闭合标签 </${t.name}>` })
        continue
      }
      if (top.name !== t.name) {
        errors.push({ file, line: t.line, msg: `标签不匹配：开 <${top.name}> (第 ${top.line} 行) 与 </${t.name}> 配对错乱` })
        continue
      }
      stack.pop()
    } else {
      stack.push({ name: t.name, line: t.line })
    }
  }
  for (const left of stack) {
    errors.push({ file, line: left.line, msg: `<${left.name}> 未闭合` })
  }
}

function extractTemplate(content) {
  // 找第一对匹配的 <template>...</template>
  const openRe = /<template\b[^>]*>/g
  const closeRe = /<\/template\s*>/g
  const opens = []
  const closes = []
  let m
  while ((m = openRe.exec(content))) opens.push(m.index + m[0].length)
  while ((m = closeRe.exec(content))) closes.push(m.index)
  if (opens.length === 0 || closes.length === 0) return null
  // 简单取第一个 open 和最后一个 close（单文件通常就一对）
  const start = opens[0]
  const end = closes[closes.length - 1]
  if (end <= start) return null
  return { body: content.slice(start, end), start, end }
}

function checkFile(file) {
  const content = fs.readFileSync(file, 'utf8')
  const tpl = extractTemplate(content)
  if (!tpl) return
  checkTemplate(file, tpl.body)
  checkImports(file, content)
}

/**
 * 检查相对 import 路径能否解析到真实文件。
 * 这是为了拦截 "import path 写错导致 vite 构建失败" 这类错误
 * （参考 InterestCategorySelectorPopup 的 ../../api 写错事件）。
 */
function checkImports(file, content) {
  // 匹配 import / export 的 from 路径
  // 跳过 import type { ... }（TypeScript 编译时擦除，无需真实解析）
  const importRe = /^\s*(?:import|export)\s+(?!type\s)(?:[^'"]*?\s+from\s+)?['"](\.\.?\/[^'"]+)['"]/gm
  let m
  const fileDir = path.dirname(file)
  while ((m = importRe.exec(content))) {
    const rel = m[1]
    // 跳过 import type 这种以 "type" 开头的（已经通过 (?!type\s) 排除，但兜底再判断一次）
    // 通过检查 m.index 之前的源码片段判断是否是 import type
    const lineStart = content.lastIndexOf('\n', m.index) + 1
    const linePrefix = content.slice(lineStart, m.index)
    if (/\bimport\s+type\b/.test(linePrefix) || /\bexport\s+type\b/.test(linePrefix)) {
      continue
    }
    const candidates = [
      rel,
      rel + '.ts',
      rel + '.js',
      rel + '.vue',
      rel + '/index.ts',
      rel + '/index.js',
    ]
    const resolved = candidates.find(c => {
      try {
        return fs.existsSync(path.resolve(fileDir, c))
      } catch (_) {
        return false
      }
    })
    if (!resolved) {
      errors.push({
        file,
        line: content.slice(0, m.index).split('\n').length,
        msg: `无法解析相对路径 "${rel}"（尝试了 ${rel}, ${rel}.ts, ${rel}/index.ts 等）`,
      })
    }
  }
}

walk(SRC)

if (errors.length === 0) {
  console.log('✅ Vue 模板检查通过（' + path.relative(ROOT, SRC) + '）')
  process.exit(0)
}

console.error('❌ Vue 模板检查发现 ' + errors.length + ' 个问题：\n')
for (const e of errors) {
  const rel = path.relative(ROOT, e.file)
  console.error(`  [${rel}:${e.line}] ${e.msg}`)
}
console.error('\n请修复后再构建/部署。')
process.exit(1)
