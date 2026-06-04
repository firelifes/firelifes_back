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
  /**
   * 找到 SFC 顶层 <template>...</template> 的范围。
   *
   * 难点：
   * 1. <script>/<style> 块里可能有 "<template>" 字符串（如 JSDoc 注释、TS 类型），
   *    需要先跳过这些块。
   * 2. 模板内部可能有嵌套的 <template v-for> / <template #header>，
   *    需要深度追踪，不能简单取「第一个 open + 第一个 close」。
   *
   * 算法：手写状态机扫描所有顶层标签，遇到 <script>/<style> 跳过整个块，
   * 遇到第一个 <template> 后开始深度追踪，匹配的 </template> 即为顶层结束。
   */
  const len = content.length
  let i = 0
  while (i < len) {
    const lt = content.indexOf('<', i)
    if (lt === -1) return null
    const gt = content.indexOf('>', lt)
    if (gt === -1) return null
    const tag = content.slice(lt, gt + 1)

    // 跳过 <script>...</script>
    if (/^<script\b/.test(tag)) {
      const close = content.indexOf('</script>', gt + 1)
      if (close === -1) return null
      i = close + '</script>'.length
      continue
    }
    // 跳过 <style>...</style>
    if (/^<style\b/.test(tag)) {
      const close = content.indexOf('</style>', gt + 1)
      if (close === -1) return null
      i = close + '</style>'.length
      continue
    }
    // 跳过 <!-- ... --> 注释（顶层和 script/style 之外的）
    if (tag.startsWith('<!--')) {
      const close = content.indexOf('-->', gt + 1)
      if (close === -1) return null
      i = close + 3
      continue
    }

    // 找到顶层 <template>，开始深度追踪
    if (/^<template\b/.test(tag)) {
      const openEnd = gt + 1
      let depth = 1
      let j = openEnd
      while (j < len && depth > 0) {
        const nextOpen = content.indexOf('<template', j)
        const nextClose = content.indexOf('</template', j)
        if (nextClose === -1) return null
        if (nextOpen !== -1 && nextOpen < nextClose) {
          // 确认是真正的 <template> 开标签（后面是空格/> /换行 等分隔符），
          // 避免误匹配 <template-literal> 这类带连字符的
          const after = content[nextOpen + '<template'.length]
          if (after === ' ' || after === '>' || after === '\t' || after === '\n' || after === '\r') {
            depth++
          }
          j = nextOpen + '<template'.length
        } else {
          depth--
          if (depth === 0) {
            const closeGt = content.indexOf('>', nextClose)
            return {
              body: content.slice(openEnd, nextClose),
              start: openEnd,
              end: nextClose,
            }
          }
          j = nextClose + '</template'.length
        }
      }
      return null
    }

    // 其他顶层标签（不太可能有），跳过
    i = gt + 1
  }
  return null
}

function checkFile(file) {
  const content = fs.readFileSync(file, 'utf8')
  const tpl = extractTemplate(content)
  if (tpl) checkTemplate(file, tpl.body)
  checkImports(file, content)
  checkScriptApiImports(file, content)
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

/**
 * 检查 <script setup> 中是否用了 Vue/UniApp 顶层 API 但忘了 import。
 * 这是 v3 新增项，参考 watch() 漏 import 致整个页面 setup 阶段崩溃的事件。
 *
 * 思路：
 * 1. 抽出 <script setup> ... </script> 块
 * 2. 解析 import { ... } from 'vue' / from '@dcloudio/uni-app' 的具名导入
 * 3. 状态机剥掉字符串/注释后，扫描 `\b<apiName>\s*\(` 形式的使用
 * 4. 用了但没导入 → 报错
 *
 * 注意：编译器宏（defineProps/defineEmits/defineExpose/defineModel/defineOptions/defineSlots）
 * 不需要 import，列入白名单跳过。
 */
const VUE_RUNTIME_APIS = new Set([
  'ref', 'reactive', 'computed', 'watch', 'watchEffect',
  'onMounted', 'onUnmounted', 'onBeforeMount', 'onBeforeUnmount',
  'onUpdated', 'onBeforeUpdate', 'onActivated', 'onDeactivated',
  'onErrorCaptured', 'nextTick',
  'toRef', 'toRefs', 'unref', 'isRef',
  'provide', 'inject',
  'shallowRef', 'shallowReactive', 'triggerRef', 'customRef',
  'readonly', 'shallowReadonly', 'markRaw', 'toRaw',
  'createApp', 'defineAsyncComponent', 'h', 'render',
  'useAttrs', 'useSlots',
])
const UNIAPP_RUNTIME_APIS = new Set([
  'onShow', 'onHide',
  'onPullDownRefresh', 'onReachBottom',
  'onShareAppMessage', 'onShareTimeline', 'onAddToFavorites',
  'onPageScroll', 'onTabItemTap',
  'onResize', 'onLaunch', 'onError', 'onThemeChange',
  'onPageNotFound', 'onUnhandledRejection',
])
// 编译器宏，<script setup> 自带，不需要 import
const COMPILER_MACROS = new Set([
  'defineProps', 'defineEmits', 'defineExpose',
  'defineModel', 'defineOptions', 'defineSlots',
])

function extractScriptSetup(content) {
  const re = /<script\s+setup[^>]*>([\s\S]*?)<\/script>/
  const m = re.exec(content)
  if (!m) return null
  return { body: m[1], start: m.index + m[0].indexOf('>') + 1 }
}

/**
 * 状态机：把字符串字面量（"..." '...' `...`）和注释（// ... /* ... *\/）
 * 替换成等长的空白字符，保留行号信息。
 */
function maskStringsAndComments(code) {
  let out = ''
  let i = 0
  const len = code.length
  while (i < len) {
    const c = code[i]
    const n = code[i + 1]
    // 单行注释
    if (c === '/' && n === '/') {
      while (i < len && code[i] !== '\n') { out += ' '; i++ }
      continue
    }
    // 多行注释
    if (c === '/' && n === '*') {
      out += '  '
      i += 2
      while (i < len && !(code[i] === '*' && code[i + 1] === '/')) {
        out += code[i] === '\n' ? '\n' : ' '
        i++
      }
      if (i < len) { out += '  '; i += 2 }
      continue
    }
    // 字符串
    if (c === '"' || c === "'" || c === '`') {
      const q = c
      out += ' '
      i++
      while (i < len && code[i] !== q) {
        if (code[i] === '\\') { out += '  '; i += 2; continue }
        out += code[i] === '\n' ? '\n' : ' '
        i++
      }
      if (i < len) { out += ' '; i++ }
      continue
    }
    out += c
    i++
  }
  return out
}

function checkScriptApiImports(file, content) {
  const sc = extractScriptSetup(content)
  if (!sc) return

  // 1) 解析 import { ... } from 'vue' / '@dcloudio/uni-app'
  const vueImported = new Set()
  const uniImported = new Set()
  const importRe = /import\s*(?:type\s*)?\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g
  let m
  while ((m = importRe.exec(sc.body))) {
    const names = m[1].split(',').map(s => s.trim().split(/\s+as\s+/).pop().trim()).filter(Boolean)
    if (m[2] === 'vue') names.forEach(n => vueImported.add(n))
    else if (m[2] === '@dcloudio/uni-app') names.forEach(n => uniImported.add(n))
  }

  // 2) 状态机屏蔽字符串/注释，避免 "ref" 出现在字符串里时被误报
  const masked = maskStringsAndComments(sc.body)

  // 3) 对每个已知 API，检查是否在源码里以 `\bapiName\s*\(` 形式被调用，且没导入
  //    行号算法：先算 <script setup> 起始位置的行号，再加上脚本体内的相对行号
  const scriptStartLine = content.slice(0, sc.start).split('\n').length
  const check = (apiName, imported, sourceModule) => {
    if (imported.has(apiName)) return
    if (COMPILER_MACROS.has(apiName)) return
    const re = new RegExp('\\b' + apiName + '\\s*\\(', 'g')
    let hit
    while ((hit = re.exec(masked))) {
      const hitLineInScript = sc.body.slice(0, hit.index).split('\n').length
      const absoluteLine = scriptStartLine + hitLineInScript - 1
      errors.push({
        file,
        line: absoluteLine,
        msg: `<script setup> 中使用了 ${sourceModule} API "${apiName}()" 但未从 '${sourceModule === 'Vue' ? 'vue' : '@dcloudio/uni-app'}' 导入`,
      })
      break // 同一 API 只报一次
    }
  }
  for (const api of VUE_RUNTIME_APIS) check(api, vueImported, 'Vue')
  for (const api of UNIAPP_RUNTIME_APIS) check(api, uniImported, 'UniApp')
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
