import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entity/category.entity';
import { CategoryGroup } from '../entity/category_group.entity';
import { Icon } from '../entity/icon.entity';
import { UserCategoryCustomization } from '../entity/user_category_customization.entity';
import { UserCategoryGroup } from '../entity/user_category_group.entity';
import { UserIcon } from '../entity/user_icon.entity';

@Provide()
export class CategoryService {
  @InjectEntityModel(Category)
  categoryModel: Repository<Category>;

  @InjectEntityModel(CategoryGroup)
  categoryGroupModel: Repository<CategoryGroup>;

  @InjectEntityModel(Icon)
  iconModel: Repository<Icon>;

  @InjectEntityModel(UserCategoryCustomization)
  customizationModel: Repository<UserCategoryCustomization>;

  @InjectEntityModel(UserCategoryGroup)
  userCategoryGroupModel: Repository<UserCategoryGroup>;

  @InjectEntityModel(UserIcon)
  userIconModel: Repository<UserIcon>;

  private defaultIcons: Omit<Icon, 'id' | 'createdAt' | 'updatedAt'>[] = [
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
    { name: '转账', url: 'category-icon-transfer', iconType: 'svg', sortOrder: 48 },
    { name: '还信用卡', url: 'category-icon-repay-credit', iconType: 'svg', sortOrder: 49 },
    { name: '还贷款', url: 'category-icon-repay-loan', iconType: 'svg', sortOrder: 50 },
    { name: '借出', url: 'category-icon-lend', iconType: 'svg', sortOrder: 51 },
    { name: '借入', url: 'category-icon-borrow', iconType: 'svg', sortOrder: 52 },
    { name: '利息', url: 'category-icon-lixi', iconType: 'svg', sortOrder: 53 },
  ];

  private defaultGroups: (Omit<CategoryGroup, 'id' | 'createdAt' | 'updatedAt'> & { type: 'expense' | 'income' })[] = [
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

  private defaultCategories: (Omit<Category, 'id'> & { id: string })[] = [
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
    { id: 'expense_9_3', name: '还信用卡', groupId: 9, iconId: 49, sortOrder: 3, isDefault: true, type: 'expense' },
    { id: 'expense_9_4', name: '还贷款', groupId: 9, iconId: 50, sortOrder: 4, isDefault: true, type: 'expense' },
    { id: 'expense_9_5', name: '借出', groupId: 9, iconId: 51, sortOrder: 5, isDefault: true, type: 'expense' },
    { id: 'expense_9_6', name: '利息支出', groupId: 9, iconId: 53, sortOrder: 6, isDefault: true, type: 'expense' },
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
    { id: 'income_13_4', name: '借入', groupId: 13, iconId: 52, sortOrder: 4, isDefault: true, type: 'income' },
  ];

  async seedGlobalData() {
    const existingIcon = await this.iconModel.findOne({ where: { name: '餐饮' } });
    if (!existingIcon) {
      await this.iconModel.save(this.defaultIcons as any);
      console.log(`✅ 全局图标初始化完成，共 ${this.defaultIcons.length} 个`);
    } else {
      console.log(`[启动] 全局图标已有数据，跳过`);
    }

    const existingGroup = await this.categoryGroupModel.findOne({ where: { name: '饮食消费' } });
    if (!existingGroup) {
      await this.categoryGroupModel.save(this.defaultGroups as any);
      console.log(`✅ 全局大类初始化完成，共 ${this.defaultGroups.length} 个`);
    } else {
      console.log(`[启动] 全局大类已有数据，跳过`);
    }

    const existingCategory = await this.categoryModel.findOne({ where: { id: 'expense_1_1' } });
    if (!existingCategory) {
      await this.categoryModel.save(this.defaultCategories as any);
      console.log(`✅ 全局分类初始化完成，共 ${this.defaultCategories.length} 个`);
    } else {
      console.log(`[启动] 全局分类已有数据，跳过`);
    }
  }

  async getAllCategories() {
    const groups = await this.categoryGroupModel.find({
      order: { sortOrder: 'ASC' },
    });
    const categories = await this.categoryModel.find({
      order: { sortOrder: 'ASC' },
    });
    const icons = await this.iconModel.find();

    const iconMap = new Map(icons.map(i => [i.id, i]));

    const result = groups.map(group => ({
      ...group,
      children: categories
        .filter(c => c.groupId === group.id)
        .map(c => ({
          ...c,
          icon: iconMap.get(c.iconId),
        })),
    }));

    return {
      expense: result.filter(g => g.children.some((c: any) => c.type === 'expense')),
      income: result.filter(g => g.children.some((c: any) => c.type === 'income')),
    };
  }

  async getCategoriesByType(type: 'income' | 'expense') {
    const groups = await this.categoryGroupModel.find({
      order: { sortOrder: 'ASC' },
    });
    const categories = await this.categoryModel.find({
      where: { type },
      order: { sortOrder: 'ASC' },
    });
    const icons = await this.iconModel.find();
    const iconMap = new Map(icons.map(i => [i.id, i]));

    return groups
      .map(group => ({
        ...group,
        children: categories
          .filter(c => c.groupId === group.id)
          .map(c => ({
            ...c,
            icon: iconMap.get(c.iconId),
          })),
      }))
      .filter(g => g.children.length > 0);
  }

  async getCategoryById(id: string) {
    return this.categoryModel.findOne({ where: { id } });
  }

  async getUserCategories(userId: number, type: 'income' | 'expense') {
    const userGroups = await this.userCategoryGroupModel.find({
      where: { userId, isEnabled: true },
      order: { sortOrder: 'ASC' },
    });
    this.markGroupIsUserCreated(userGroups);
    const userCategories = await this.customizationModel.find({
      where: { userId, type, isEnabled: true },
      relations: ['icon'],
      order: { sortOrder: 'ASC' },
    });
    this.markCategoryIsUserCreated(userCategories);

    const result = userGroups
      .map(userGroup => {
        const children = userCategories.filter(c => c.groupId === userGroup.id);

        return {
          id: userGroup.id,
          name: userGroup.name,
          sortOrder: userGroup.sortOrder,
          children: children.map(cat => ({
            id: cat.id,
            name: cat.name,
            iconUrl: cat.icon?.url || '📦',
            iconId: cat.iconId,
            sortOrder: cat.sortOrder,
            isUserCreated: cat.isUserCreated,
            groupId: cat.groupId,
            type: cat.type,
          })),
        };
      })
      .filter(g => g.children.length > 0);

    return result;
  }

  async getAllIcons() {
    return this.iconModel.find({
      order: { sortOrder: 'ASC' },
    });
  }

  async initUserCategories(userId: number) {
    console.log(`[分类初始化] 开始为用户 ${userId} 初始化数据`);
    
    try {
      const existingGroups = await this.userCategoryGroupModel.count({ where: { userId } });
      if (existingGroups > 0) {
        console.log(`[分类初始化] 用户 ${userId} 已有分类数据，跳过`);
        return;
      }

      const globalGroups = await this.categoryGroupModel.find({ order: { sortOrder: 'ASC' } });
      console.log(`[分类初始化] 找到 ${globalGroups.length} 个全局大类`);
      
      const globalCategories = await this.categoryModel.find({ order: { sortOrder: 'ASC' } });
      console.log(`[分类初始化] 找到 ${globalCategories.length} 个全局分类`);

      const userGroupEntities: UserCategoryGroup[] = [];
      for (const group of globalGroups) {
        const userGroup = this.userCategoryGroupModel.create({
          userId,
          name: group.name,
          type: group.type,
          sortOrder: group.sortOrder,
          isEnabled: true,
          isUserCreated: false,
        });
        userGroupEntities.push(userGroup);
      }
      await this.userCategoryGroupModel.save(userGroupEntities);
      console.log(`[分类初始化] 已保存 ${userGroupEntities.length} 个用户大类`);

      await this.initUserIcons(userId);

      const userIcons = await this.userIconModel.find({ where: { userId } });
      console.log(`[分类初始化] 用户 ${userId} 有 ${userIcons.length} 个图标`);
      
      const globalIcons = await this.iconModel.find();
      console.log(`[分类初始化] 全局有 ${globalIcons.length} 个图标`);
      
      const iconIdToUserIconIdMap = new Map<number, number>();
      for (let i = 0; i < globalIcons.length; i++) {
        iconIdToUserIconIdMap.set(globalIcons[i].id, userIcons[i]?.id);
      }

      const userCategoryEntities: UserCategoryCustomization[] = [];
      for (const category of globalCategories) {
        const globalGroupIndex = globalGroups.findIndex(g => g.id === category.groupId);
        const userGroup = userGroupEntities[globalGroupIndex];

        const userIconId = iconIdToUserIconIdMap.get(category.iconId);

        const userCategory = this.customizationModel.create({
          userId,
          name: category.name,
          iconId: userIconId || userIcons[0]?.id,
          type: category.type,
          groupId: userGroup.id,
          sortOrder: category.sortOrder,
          isEnabled: true,
          isUserCreated: false,
        });
        userCategoryEntities.push(userCategory);
      }
      await this.customizationModel.save(userCategoryEntities);
      console.log(`[分类初始化] 用户 ${userId} 分类和大类已初始化完成，共 ${userCategoryEntities.length} 个分类`);
    } catch (error) {
      console.error(`[分类初始化] 用户 ${userId} 初始化失败:`, error);
      throw error;
    }
  }

  async initUserIcons(userId: number) {
    console.log(`[图标初始化] 开始为用户 ${userId} 初始化图标`);
    
    try {
      const existingIcons = await this.userIconModel.count({ where: { userId } });
      if (existingIcons > 0) {
        console.log(`[图标初始化] 用户 ${userId} 已有图标数据，跳过`);
        return;
      }

      const globalIcons = await this.iconModel.find({ order: { sortOrder: 'ASC' } });
      console.log(`[图标初始化] 找到 ${globalIcons.length} 个全局图标`);

      const userIconEntities: UserIcon[] = [];
      for (const icon of globalIcons) {
        const userIcon = this.userIconModel.create({
          userId,
          name: icon.name,
          url: icon.url,
          iconType: icon.iconType,
          sortOrder: icon.sortOrder,
          isEnabled: true,
        });
        userIconEntities.push(userIcon);
      }
      await this.userIconModel.save(userIconEntities);
      console.log(`[图标初始化] 用户 ${userId} 图标已初始化完成，共 ${userIconEntities.length} 个`);
    } catch (error) {
      console.error(`[图标初始化] 用户 ${userId} 初始化失败:`, error);
      throw error;
    }
  }

  private defaultGroupNames = ['饮食消费', '居家居住', '交通出行', '服饰美容', '学习成长', '休闲娱乐', '社交关系', '健康医疗', '金融理财', '其他支出', '薪资报酬', '投资理财', '其他收入'];

  private defaultCategoryNames = ['餐饮', '饮料', '水果', '零食', '咖啡', '住房', '居家', '维修', '快递', '交通', '打车', '汽车', '服饰', '美发', '美容', '书籍', '学习', '电影', '音乐', '游戏', '旅行', '聚会聚餐', '礼物', '礼金', '亲友', '宠物', '医疗', '运动', '健身', '投资', '彩票', '其他', '日用', '捐赠', '办公', '通讯', '购物', '数码', '保险', '还信用卡', '还贷款', '借出', '利息支出', '工资', '奖金', '兼职', '投资收入', '理财', '礼金收入', '其他收入', '报销'];

  private markGroupIsUserCreated(groups: UserCategoryGroup[]) {
    for (const group of groups) {
      group.isUserCreated = !this.defaultGroupNames.includes(group.name);
    }
  }

  private markCategoryIsUserCreated(categories: UserCategoryCustomization[]) {
    for (const category of categories) {
      category.isUserCreated = !this.defaultCategoryNames.includes(category.name);
    }
  }

  async getUserGroups(userId: number) {
    const groups = await this.userCategoryGroupModel.find({
      where: { userId, isEnabled: true },
      order: { sortOrder: 'ASC' },
    });
    this.markGroupIsUserCreated(groups);
    return groups;
  }

  async createUserGroup(userId: number, data: { name: string }) {
    // 检查分类组名称是否重复
    const existingGroup = await this.userCategoryGroupModel.findOne({
      where: { userId, name: data.name, isEnabled: true },
    });
    if (existingGroup) {
      throw new Error('分类组名称已存在');
    }

    const maxGroup = await this.userCategoryGroupModel.findOne({
      where: { userId },
      order: { sortOrder: 'DESC' },
    });
    const sortOrder = maxGroup ? maxGroup.sortOrder + 1 : 0;

    const group = this.userCategoryGroupModel.create({
      userId,
      name: data.name,
      sortOrder,
      isEnabled: true,
      isUserCreated: true,
    });
    return this.userCategoryGroupModel.save(group);
  }

  async toggleUserGroup(userId: number, id: number) {
    const group = await this.userCategoryGroupModel.findOne({
      where: { id, userId },
    });
    if (!group) {
      throw new Error('分类不存在');
    }
    group.isEnabled = !group.isEnabled;
    return this.userCategoryGroupModel.save(group);
  }

  async updateUserGroup(userId: number, id: number, data: { name: string }) {
    const group = await this.userCategoryGroupModel.findOne({
      where: { id, userId },
    });
    if (!group) {
      throw new Error('分类不存在');
    }

    // 检查分类组名称是否重复（排除当前分类组）
    const existingGroup = await this.userCategoryGroupModel.findOne({
      where: { userId, name: data.name, isEnabled: true },
    });
    if (existingGroup && existingGroup.id !== id) {
      throw new Error('分类组名称已存在');
    }

    group.name = data.name;
    return this.userCategoryGroupModel.save(group);
  }

  async deleteUserGroup(userId: number, id: number) {
    const group = await this.userCategoryGroupModel.findOne({
      where: { id, userId },
    });
    if (!group) {
      throw new Error('分类不存在');
    }

    if (this.defaultGroupNames.includes(group.name)) {
      throw new Error('默认分类不允许删除，只能禁用');
    }

    const childCategories = await this.customizationModel.count({
      where: { groupId: id, userId, isEnabled: true },
    });
    if (childCategories > 0) {
      throw new Error('请先删除该分类下的子分类');
    }

    group.isEnabled = false;
    await this.userCategoryGroupModel.save(group);
  }

  /**
   * 获取指定大类下的子分类列表
   */
  async getCategoriesByGroup(userId: number, groupId: number) {
    const categories = await this.customizationModel.find({
      where: { userId, groupId, isEnabled: true },
      relations: ['icon'],
      order: { sortOrder: 'ASC' },
    });
    this.markCategoryIsUserCreated(categories);
    return categories;
  }

  /**
   * 创建子分类
   */
  async createCategory(userId: number, data: { name: string; groupId: number; iconId: number; type: 'income' | 'expense' }) {
    // 检查子分类名称是否重复（在同一个分类组下）
    const existingCategory = await this.customizationModel.findOne({
      where: { userId, groupId: data.groupId, name: data.name, isEnabled: true },
    });
    if (existingCategory) {
      throw new Error('子分类名称已存在');
    }

    const maxCategory = await this.customizationModel.findOne({
      where: { userId, groupId: data.groupId },
      order: { sortOrder: 'DESC' },
    });
    const sortOrder = maxCategory ? maxCategory.sortOrder + 1 : 0;

    const category = this.customizationModel.create({
      userId,
      name: data.name,
      groupId: data.groupId,
      iconId: data.iconId,
      type: data.type,
      sortOrder,
      isEnabled: true,
      isUserCreated: true,
    });
    return this.customizationModel.save(category);
  }

  /**
   * 更新子分类
   */
  async updateCategory(userId: number, id: number, data: { name: string; iconId: number }) {
    const category = await this.customizationModel.findOne({
      where: { id, userId },
    });
    if (!category) {
      throw new Error('子分类不存在');
    }

    // 检查子分类名称是否重复（在同一个分类组下，排除当前子分类）
    const existingCategory = await this.customizationModel.findOne({
      where: { userId, groupId: category.groupId, name: data.name, isEnabled: true },
    });
    if (existingCategory && existingCategory.id !== id) {
      throw new Error('子分类名称已存在');
    }

    category.name = data.name;
    category.iconId = data.iconId;
    return this.customizationModel.save(category);
  }

  async toggleCategory(userId: number, id: number) {
    const category = await this.customizationModel.findOne({
      where: { id, userId },
    });
    if (!category) {
      throw new Error('子分类不存在');
    }
    category.isEnabled = !category.isEnabled;
    return this.customizationModel.save(category);
  }

  /**
   * 删除子分类
   */
  async deleteCategory(userId: number, id: number) {
    const category = await this.customizationModel.findOne({
      where: { id, userId },
    });
    if (!category) {
      throw new Error('子分类不存在');
    }

    // 检查是否是默认子分类
    if (this.defaultCategoryNames.includes(category.name)) {
      throw new Error('默认分类不允许删除，只能禁用');
    }

    category.isEnabled = false;
    await this.customizationModel.save(category);
  }
}
