
/**
 * 统一的导航工具函数
 */

/**
 * 页面路由映射 - 用于兜底返回
 */
const PAGE_BACKUP_MAP: Record<string, string> = {
  '/pages/my/category-setting/category-list': '/pages/my/category-setting/category-group-list',
  '/pages/my/category-setting/category-group-list': '/pages/my/index',
  '/pages/my/account-setting/account-edit': '/pages/my/account-setting/account-list',
  '/pages/my/account-setting/account-list': '/pages/my/index',
  '/pages/my/index': '/pages/detail/index',
  '/pages/analysis/account-records': '/pages/analysis/analysis'
};

/**
 * 统一返回上一页
 * 如果没有上一页，则根据页面映射返回兜底页面
 * @param backupUrl - 自定义兜底页面（可选）
 */
export function navigateBack(backupUrl?: string) {
  const pages = getCurrentPages();
  
  if (pages.length > 1) {
    // 有上一页，正常返回
    uni.navigateBack();
  } else {
    // 没有上一页，使用兜底页面
    const currentPage = pages[0];
    const currentRoute = currentPage?.route || '';
    let targetUrl = backupUrl || PAGE_BACKUP_MAP[`/${currentRoute}`] || '/pages/detail/index';
    
    uni.redirectTo({
      url: targetUrl
    });
  }
}

/**
 * 获取当前页面路径
 */
export function getCurrentPagePath() {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  return currentPage?.route || '';
}

/**
 * 获取上一页路径
 */
export function getPreviousPagePath() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    const previousPage = pages[pages.length - 2];
    return previousPage?.route || '';
  }
  return '';
}
