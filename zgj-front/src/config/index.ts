const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:7001',
  appEnv: import.meta.env.VITE_APP_ENV || 'development',
  tokenKey: 'auth_token',
  userKey: 'auth_user'
}

export default config
