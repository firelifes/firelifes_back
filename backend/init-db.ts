import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Record } from './src/entity/record.entity';
import { Category } from './src/entity/category.entity';
import { CategoryGroup } from './src/entity/category_group.entity';
import { Icon } from './src/entity/icon.entity';
import { UserConfig } from './src/entity/user_config.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '111.230.101.3',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'firelifes',
  password: process.env.DB_PASSWORD || '4pChWhGGbkYbbMSH',
  database: process.env.DB_NAME || 'firelifes',
  synchronize: true,
  logging: true,
  entities: [Record, Category, CategoryGroup, Icon, UserConfig],
});

const defaultIcons: Omit<Icon, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: '餐饮', url: 'category-icon-canyin', iconType: 'svg', sortOrder: 1 },
  { name: '购物', url: 'category-icon-gouwu', iconType: 'svg', sortOrder: 2 },
  { name: '日用', url: 'category-icon-riyong', iconType: 'svg', sortOrder: 3 },
  { name: '交通', url: 'category-icon-jiaotong', iconType: 'svg', sortOrder: 4 },
  { name: '零食', url: 'category-icon-lingshi', iconType: 'svg', sortOrder: 5 },
  { name: '运动', url: 'category-icon-yundong', iconType: 'svg', sortOrder: 6 },
  { name: '娱乐', url: 'category-icon-dianying', iconType: 'svg', sortOrder: 7 },
  { name: '通讯', url: 'category-icon-tongxun', iconType: 'svg', sortOrder: 8 },
  { name: '服饰', url: 'category-icon-fushi', iconType: 'svg', sortOrder: 9 },
  { name: '住房', url: 'category-icon-zhufang', iconType: 'svg', sortOrder: 10 },
  { name: '居家', url: 'category-icon-jujia', iconType: 'svg', sortOrder: 11 },
  { name: '孩子', url: 'category-icon-qinyou', iconType: 'svg', sortOrder: 12 },
  { name: '长辈', url: 'category-icon-qinyou', iconType: 'svg', sortOrder: 13 },
  { name: '社交', url: 'category-icon-juhui', iconType: 'svg', sortOrder: 14 },
  { name: '旅行', url: 'category-icon-lvxing', iconType: 'svg', sortOrder: 15 },
  { name: '数码', url: 'category-icon-shuma', iconType: 'svg', sortOrder: 16 },
  { name: '汽车', url: 'category-icon-qiche', iconType: 'svg', sortOrder: 17 },
  { name: '医疗', url: 'category-icon-yiliao', iconType: 'svg', sortOrder: 18 },
  { name: '书籍', url: 'category-icon-shuji', iconType: 'svg', sortOrder: 19 },
  { name: '学习', url: 'category-icon-xuexi', iconType: 'svg', sortOrder: 20 },
  { name: '礼金', url: 'category-icon-lijin', iconType: 'svg', sortOrder: 21 },
  { name: '礼物', url: 'category-icon-liwu', iconType: 'svg', sortOrder: 22 },
  { name: '办公', url: 'category-icon-bangong', iconType: 'svg', sortOrder: 23 },
  { name: '维修', url: 'category-icon-weixiu', iconType: 'svg', sortOrder: 24 },
  { name: '捐赠', url: 'category-icon-juanzeng', iconType: 'svg', sortOrder: 25 },
  { name: '彩票', url: 'category-icon-caipiao', iconType: 'svg', sortOrder: 26 },
  { name: '亲友', url: 'category-icon-qinyou', iconType: 'svg', sortOrder: 27 },
  { name: '快递', url: 'category-icon-kuaidi', iconType: 'svg', sortOrder: 28 },
  { name: '工资', url: 'category-icon-gongzi', iconType: 'svg', sortOrder: 29 },
  { name: '奖金', url: 'category-icon-jiangjin', iconType: 'svg', sortOrder: 30 },
  { name: '投资', url: 'category-icon-touzi', iconType: 'svg', sortOrder: 31 },
  { name: '兼职', url: 'category-icon-jianzhi', iconType: 'svg', sortOrder: 32 },
  { name: '理财', url: 'category-icon-licai', iconType: 'svg', sortOrder: 33 },
  { name: '报销', url: 'category-icon-baoxiao', iconType: 'svg', sortOrder: 34 },
  { name: '其他', url: 'category-icon-qita', iconType: 'svg', sortOrder: 35 },
  { name: '饮料', url: 'category-icon-yinliao', iconType: 'svg', sortOrder: 36 },
  { name: '水果', url: 'category-icon-shuiguo', iconType: 'svg', sortOrder: 37 },
  { name: '美发', url: 'category-icon-meifa', iconType: 'svg', sortOrder: 38 },
  { name: '美容', url: 'category-icon-meirong', iconType: 'svg', sortOrder: 39 },
  { name: '健身', url: 'category-icon-jianshen', iconType: 'svg', sortOrder: 40 },
  { name: '咖啡', url: 'category-icon-kafei', iconType: 'svg', sortOrder: 41 },
  { name: '电影', url: 'category-icon-dianying', iconType: 'svg', sortOrder: 42 },
  { name: '音乐', url: 'category-icon-yinyue', iconType: 'svg', sortOrder: 43 },
  { name: '游戏', url: 'category-icon-youxi', iconType: 'svg', sortOrder: 44 },
  { name: '宠物', url: 'category-icon-chongwu', iconType: 'svg', sortOrder: 45 },
  { name: '打车', url: 'category-icon-dache', iconType: 'svg', sortOrder: 46 },
  { name: '保险', url: 'category-icon-baoxian', iconType: 'svg', sortOrder: 47 },
];

const defaultGroups: Omit<CategoryGroup, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: '饮食消费', sortOrder: 1, type: 'expense' },
  { name: '居家居住', sortOrder: 2, type: 'expense' },
  { name: '交通出行', sortOrder: 3, type: 'expense' },
  { name: '服饰美容', sortOrder: 4, type: 'expense' },
  { name: '学习成长', sortOrder: 5, type: 'expense' },
  { name: '休闲娱乐', sortOrder: 6, type: 'expense' },
  { name: '社交关系', sortOrder: 7, type: 'expense' },
  { name: '健康医疗', sortOrder: 8, type: 'expense' },
  { name: '金融理财', sortOrder: 9, type: 'expense' },
  { name: '其他支出', sortOrder: 10, type: 'expense' },
  { name: '薪资报酬', sortOrder: 11, type: 'income' },
  { name: '投资理财', sortOrder: 12, type: 'income' },
  { name: '其他收入', sortOrder: 13, type: 'income' },
];

const defaultCategories: (Omit<Category, 'id'> & { id: string })[] = [
  { id: 'expense_1_1', name: '餐饮', groupId: 1, iconId: 1, sortOrder: 1, isDefault: true, type: 'expense' },
  { id: 'expense_1_2', name: '饮料', groupId: 1, iconId: 36, sortOrder: 2, isDefault: true, type: 'expense' },
  { id: 'expense_1_3', name: '水果', groupId: 1, iconId: 37, sortOrder: 3, isDefault: true, type: 'expense' },
  { id: 'expense_1_4', name: '零食', groupId: 1, iconId: 5, sortOrder: 4, isDefault: true, type: 'expense' },
  { id: 'expense_1_5', name: '咖啡', groupId: 1, iconId: 41, sortOrder: 5, isDefault: true, type: 'expense' },
  { id: 'expense_2_1', name: '住房', groupId: 2, iconId: 10, sortOrder: 1, isDefault: true, type: 'expense' },
  { id: 'expense_2_2', name: '居家', groupId: 2, iconId: 11, sortOrder: 2, isDefault: true, type: 'expense' },
  { id: 'expense_2_3', name: '维修', groupId: 2, iconId: 24, sortOrder: 3, isDefault: true, type: 'expense' },
  { id: 'expense_2_4', name: '快递', groupId: 2, iconId: 28, sortOrder: 4, isDefault: true, type: 'expense' },
  { id: 'expense_3_1', name: '交通', groupId: 3, iconId: 4, sortOrder: 1, isDefault: true, type: 'expense' },
  { id: 'expense_3_2', name: '打车', groupId: 3, iconId: 46, sortOrder: 2, isDefault: true, type: 'expense' },
  { id: 'expense_3_3', name: '汽车', groupId: 3, iconId: 17, sortOrder: 3, isDefault: true, type: 'expense' },
  { id: 'expense_4_1', name: '服饰', groupId: 4, iconId: 9, sortOrder: 1, isDefault: true, type: 'expense' },
  { id: 'expense_4_2', name: '美发', groupId: 4, iconId: 38, sortOrder: 2, isDefault: true, type: 'expense' },
  { id: 'expense_4_3', name: '美容', groupId: 4, iconId: 39, sortOrder: 3, isDefault: true, type: 'expense' },
  { id: 'expense_5_1', name: '书籍', groupId: 5, iconId: 19, sortOrder: 1, isDefault: true, type: 'expense' },
  { id: 'expense_5_2', name: '学习', groupId: 5, iconId: 20, sortOrder: 2, isDefault: true, type: 'expense' },
  { id: 'expense_6_1', name: '电影', groupId: 6, iconId: 42, sortOrder: 1, isDefault: true, type: 'expense' },
  { id: 'expense_6_2', name: '音乐', groupId: 6, iconId: 43, sortOrder: 2, isDefault: true, type: 'expense' },
  { id: 'expense_6_3', name: '游戏', groupId: 6, iconId: 44, sortOrder: 3, isDefault: true, type: 'expense' },
  { id: 'expense_6_4', name: '旅行', groupId: 6, iconId: 15, sortOrder: 4, isDefault: true, type: 'expense' },
  { id: 'expense_7_1', name: '聚会聚餐', groupId: 7, iconId: 14, sortOrder: 1, isDefault: true, type: 'expense' },
  { id: 'expense_7_2', name: '礼物', groupId: 7, iconId: 22, sortOrder: 2, isDefault: true, type: 'expense' },
  { id: 'expense_7_3', name: '礼金', groupId: 7, iconId: 21, sortOrder: 3, isDefault: true, type: 'expense' },
  { id: 'expense_7_4', name: '亲友', groupId: 7, iconId: 27, sortOrder: 4, isDefault: true, type: 'expense' },
  { id: 'expense_7_5', name: '宠物', groupId: 7, iconId: 45, sortOrder: 5, isDefault: true, type: 'expense' },
  { id: 'expense_8_1', name: '医疗', groupId: 8, iconId: 18, sortOrder: 1, isDefault: true, type: 'expense' },
  { id: 'expense_8_2', name: '运动', groupId: 8, iconId: 6, sortOrder: 2, isDefault: true, type: 'expense' },
  { id: 'expense_8_3', name: '健身', groupId: 8, iconId: 40, sortOrder: 3, isDefault: true, type: 'expense' },
  { id: 'expense_9_1', name: '投资', groupId: 9, iconId: 31, sortOrder: 1, isDefault: true, type: 'expense' },
  { id: 'expense_9_2', name: '彩票', groupId: 9, iconId: 26, sortOrder: 2, isDefault: true, type: 'expense' },
  { id: 'expense_10_1', name: '其他', groupId: 10, iconId: 35, sortOrder: 1, isDefault: true, type: 'expense' },
  { id: 'expense_10_2', name: '日用', groupId: 10, iconId: 3, sortOrder: 2, isDefault: true, type: 'expense' },
  { id: 'expense_10_3', name: '捐赠', groupId: 10, iconId: 25, sortOrder: 3, isDefault: true, type: 'expense' },
  { id: 'expense_10_4', name: '办公', groupId: 10, iconId: 23, sortOrder: 4, isDefault: true, type: 'expense' },
  { id: 'expense_10_5', name: '通讯', groupId: 10, iconId: 8, sortOrder: 5, isDefault: true, type: 'expense' },
  { id: 'expense_10_6', name: '购物', groupId: 10, iconId: 2, sortOrder: 6, isDefault: true, type: 'expense' },
  { id: 'expense_10_7', name: '数码', groupId: 10, iconId: 16, sortOrder: 7, isDefault: true, type: 'expense' },
  { id: 'expense_10_8', name: '保险', groupId: 10, iconId: 47, sortOrder: 8, isDefault: true, type: 'expense' },
  { id: 'income_11_1', name: '工资', groupId: 11, iconId: 29, sortOrder: 1, isDefault: true, type: 'income' },
  { id: 'income_11_2', name: '奖金', groupId: 11, iconId: 30, sortOrder: 2, isDefault: true, type: 'income' },
  { id: 'income_11_3', name: '兼职', groupId: 11, iconId: 32, sortOrder: 3, isDefault: true, type: 'income' },
  { id: 'income_12_1', name: '投资收入', groupId: 12, iconId: 31, sortOrder: 1, isDefault: true, type: 'income' },
  { id: 'income_12_2', name: '理财', groupId: 12, iconId: 33, sortOrder: 2, isDefault: true, type: 'income' },
  { id: 'income_13_1', name: '礼金收入', groupId: 13, iconId: 21, sortOrder: 1, isDefault: true, type: 'income' },
  { id: 'income_13_2', name: '其他收入', groupId: 13, iconId: 35, sortOrder: 2, isDefault: true, type: 'income' },
  { id: 'income_13_3', name: '报销', groupId: 13, iconId: 34, sortOrder: 3, isDefault: true, type: 'income' },
];

async function initDb() {
  try {
    console.log('正在连接数据库...');
    await dataSource.initialize();
    console.log('✅ 数据库连接成功！');

    const iconRepo = dataSource.getRepository(Icon);
    const iconCount = await iconRepo.count();
    if (iconCount === 0) {
      console.log('正在初始化默认图标...');
      await iconRepo.save(defaultIcons as Icon[]);
      console.log(`✅ 默认图标初始化成功！共 ${defaultIcons.length} 个`);
    } else {
      console.log('ℹ️ 图标表已有数据，跳过初始化');
    }

    const groupRepo = dataSource.getRepository(CategoryGroup);
    const groupCount = await groupRepo.count();
    if (groupCount === 0) {
      console.log('正在初始化默认大类（13个：10支出 + 3收入）...');
      await groupRepo.save(defaultGroups as CategoryGroup[]);
      console.log(`✅ 默认大类初始化成功！共 ${defaultGroups.length} 个`);
    } else {
      console.log('ℹ️ 大类表已有数据，跳过初始化');
    }

    const categoryRepo = dataSource.getRepository(Category);
    const categoryCount = await categoryRepo.count();
    if (categoryCount === 0) {
      console.log('正在初始化默认分类...');
      await categoryRepo.save(defaultCategories as Category[]);
      console.log(`✅ 默认分类初始化成功！共 ${defaultCategories.length} 个（39 支出 + 8 收入）`);
    } else {
      console.log('ℹ️ 分类表已有数据，跳过初始化');
    }

    const recordCount = await dataSource.getRepository(Record).count();
    console.log(`ℹ️ 记账记录表记录数: ${recordCount}`);

    await dataSource.destroy();
    console.log('✅ 数据库初始化完成！');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

initDb();
