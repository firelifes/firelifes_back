const CATEGORY_ICON_MAP: Record<string, string> = {
  '餐饮': 'category-icon-canyin',
  '饮料': 'category-icon-yinliao',
  '水果': 'category-icon-shuiguo',
  '零食': 'category-icon-lingshi',
  '咖啡': 'category-icon-kafei',
  '住房': 'category-icon-zhufang',
  '居家': 'category-icon-jujia',
  '维修': 'category-icon-weixiu',
  '快递': 'category-icon-kuaidi',
  '交通': 'category-icon-jiaotong',
  '打车': 'category-icon-dache',
  '汽车': 'category-icon-qiche',
  '服饰': 'category-icon-fushi',
  '美发': 'category-icon-meifa',
  '美容': 'category-icon-meirong',
  '书籍': 'category-icon-shuji',
  '学习': 'category-icon-xuexi',
  '电影': 'category-icon-dianying',
  '音乐': 'category-icon-yinyue',
  '游戏': 'category-icon-youxi',
  '旅行': 'category-icon-lvxing',
  '聚会聚餐': 'category-icon-juhui',
  '礼物': 'category-icon-liwu',
  '礼金': 'category-icon-lijin',
  '亲友': 'category-icon-qinyou',
  '宠物': 'category-icon-chongwu',
  '医疗': 'category-icon-yiliao',
  '运动': 'category-icon-yundong',
  '健身': 'category-icon-jianshen',
  '投资': 'category-icon-touzi',
  '彩票': 'category-icon-caipiao',
  '其他': 'category-icon-qita',
  '日用': 'category-icon-riyong',
  '捐赠': 'category-icon-juanzeng',
  '办公': 'category-icon-bangong',
  '通讯': 'category-icon-tongxun',
  '购物': 'category-icon-gouwu',
  '数码': 'category-icon-shuma',
  '保险': 'category-icon-baoxian',
  '还信用卡': 'category-icon-repay-credit',
  '还贷款': 'category-icon-repay-loan',
  '借出': 'category-icon-lend',
  '利息支出': 'category-icon-lixi-zhichu',
  '工资': 'category-icon-gongzi',
  '奖金': 'category-icon-jiangjin',
  '兼职': 'category-icon-jianzhi',
  '投资收入': 'category-icon-touzishouru',
  '理财': 'category-icon-licai',
  '利息收入': 'category-icon-lixi-shouru',
  '礼金收入': 'category-icon-lijinshouru',
  '其他收入': 'category-icon-qitashouru',
  '报销': 'category-icon-baoxiao',
  '教育': 'category-icon-xuexi',
  '居住': 'category-icon-jujia',
  '日用品': 'category-icon-riyong',
  '烟酒': 'category-icon-yinliao',
  '数码家电': 'category-icon-shuma',
  '娱乐': 'category-icon-dianying',
  '社交': 'category-icon-juhui',
  '工资条': 'category-icon-gongzi',
  '理财收益': 'category-icon-licai',
  '红包': 'category-icon-lijinshouru',
  '退款': 'category-icon-baoxiao',
  '闲置': 'category-icon-qitashouru',
}

const SYSTEM_ICON_MAP: Record<string, string> = {
  '统计': 'category-icon-tongji',
  '记账': 'category-icon-jizhang',
  '分析': 'category-icon-fenxi',
  '我的': 'category-icon-wode',
  '日期': 'category-icon-riqi',
  '资产': 'category-icon-zichan',
  '返回': 'category-icon-fanhui',
  '搜索': 'category-icon-sousuo',
  '设置': 'category-icon-shezhi',
  '账单': 'category-icon-zhangdan',
  '通讯录': 'category-icon-tongxunlu',
  '分类设置': 'category-icon-fenleishezhi',
  '账户设置': 'category-icon-zhanghushezhi',
  '预算设置': 'category-icon-yusuan',
  '主题设置': 'category-icon-zhutishezhi',
}

export function getCategoryIconClass(name: string): string {
  return CATEGORY_ICON_MAP[name] || 'category-icon-qita'
}

export function getSystemIconClass(name: string): string {
  return SYSTEM_ICON_MAP[name] || 'category-icon-qita'
}

const FUNCTION_ICON_MAP: Record<string, string> = {
  bill: 'category-icon-zhangdan',
  asset: 'category-icon-zichan',
  fire: 'category-icon-huoyan',
  cashback: 'category-icon-fanxian',
}

export function getFunctionIconClass(key: string): string {
  return FUNCTION_ICON_MAP[key] || 'category-icon-zhangdan'
}

export { CATEGORY_ICON_MAP, SYSTEM_ICON_MAP, FUNCTION_ICON_MAP }
