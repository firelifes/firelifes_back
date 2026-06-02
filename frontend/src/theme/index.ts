import { themePresets, type ThemePreset } from './presets'

export { themePresets, themeColorLabels } from './presets'
export type { ThemePreset }

export interface ThemeState {
  mode: 'preset' | 'custom'
  presetName: string
  customColors: Record<string, string>
}

const STORAGE_KEY_MODE = 'fire_theme_mode'
const STORAGE_KEY_PRESET = 'fire_theme_preset'
const STORAGE_KEY_CUSTOM = 'fire_theme_custom'

function getDefaultPreset(): ThemePreset {
  return themePresets[0]
}

function getPresetByName(name: string): ThemePreset | undefined {
  return themePresets.find((p) => p.name === name)
}

function readThemeState(): ThemeState {
  const mode = uni.getStorageSync(STORAGE_KEY_MODE) || 'preset'
  const presetName = uni.getStorageSync(STORAGE_KEY_PRESET) || getDefaultPreset().name
  const customColors: Record<string, string> = {}

  if (mode === 'custom') {
    try {
      const raw = uni.getStorageSync(STORAGE_KEY_CUSTOM)
      if (raw) {
        Object.assign(customColors, JSON.parse(raw))
      }
    } catch {
      // ignore
    }
  }

  return { mode, presetName, customColors }
}

export function getCurrentColors(): Record<string, string> {
  const state = readThemeState()
  const preset = getPresetByName(state.presetName) || getDefaultPreset()
  const colors = { ...preset.colors }

  if (state.mode === 'custom') {
    Object.assign(colors, state.customColors)
  }

  return colors
}

export function applyTheme(colors: Record<string, string>) {
  const root = document.documentElement
  for (const [key, value] of Object.entries(colors)) {
    root.style.setProperty(key, value)
  }
}

export function initTheme() {
  const colors = getCurrentColors()
  applyTheme(colors)
}

export function setPresetTheme(presetName: string) {
  const preset = getPresetByName(presetName)
  if (!preset) return

  uni.setStorageSync(STORAGE_KEY_MODE, 'preset')
  uni.setStorageSync(STORAGE_KEY_PRESET, presetName)
  uni.removeStorageSync(STORAGE_KEY_CUSTOM)

  applyTheme(preset.colors)
}

export function setCustomColor(token: string, value: string) {
  const state = readThemeState()

  const colors = { ...state.customColors, [token]: value }

  uni.setStorageSync(STORAGE_KEY_MODE, 'custom')
  uni.setStorageSync(STORAGE_KEY_CUSTOM, JSON.stringify(colors))

  const current = getCurrentColors()
  applyTheme(current)
}

export function resetToDefault() {
  const preset = getDefaultPreset()
  uni.setStorageSync(STORAGE_KEY_MODE, 'preset')
  uni.setStorageSync(STORAGE_KEY_PRESET, preset.name)
  uni.removeStorageSync(STORAGE_KEY_CUSTOM)

  applyTheme(preset.colors)
}

export function getThemeState(): ThemeState {
  return readThemeState()
}

export function getThemeSnapshot(): { theme: ThemeState } {
  return { theme: readThemeState() }
}

export function applyConfigTheme(config: Record<string, any>) {
  if (!config || !config.theme) return

  const theme = config.theme as ThemeState
  if (theme.mode === 'preset') {
    setPresetTheme(theme.presetName)
  } else if (theme.mode === 'custom') {
    if (theme.presetName) {
      uni.setStorageSync(STORAGE_KEY_PRESET, theme.presetName)
    }
    uni.setStorageSync(STORAGE_KEY_MODE, 'custom')
    uni.setStorageSync(STORAGE_KEY_CUSTOM, JSON.stringify(theme.customColors || {}))
    const colors = getCurrentColors()
    applyTheme(colors)
  }
}
