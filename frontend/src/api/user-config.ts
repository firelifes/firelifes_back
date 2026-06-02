import request from './request'

export interface ThemeConfig {
  mode: 'preset' | 'custom'
  presetName: string
  customColors: Record<string, string>
}

export const getUserConfig = () => {
  return request({
    url: '/api/user/config',
    method: 'GET'
  })
}

export const updateUserConfig = (configs: Record<string, any>) => {
  return request({
    url: '/api/user/config',
    method: 'PUT',
    data: { configs }
  })
}
