export const validatePhone = (phone: string): boolean => {
  return /^1[3-9]\d{9}$/.test(phone)
}

export const validatePassword = (password: string): boolean => {
  return password.length >= 6 && password.length <= 20
}

export const validateCode = (code: string): boolean => {
  return /^\d{6}$/.test(code)
}
