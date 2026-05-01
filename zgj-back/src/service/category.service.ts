import { Provide, Init } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entity/category.entity';
import { CategoryGroup } from '../entity/category_group.entity';
import { Icon } from '../entity/icon.entity';
import { UserCategoryCustomization } from '../entity/user_category_customization.entity';

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

  private defaultIcons: Omit<Icon, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { name: '餐饮', url: '🍜', iconType: 'emoji', sortOrder: 1 },
    { name: '购物', url: '🛍️', iconType: 'emoji', sortOrder: 2 },
    { name: '日用', url: '🧻', iconType: 'emoji', sortOrder: 3 },
    { name: '交通', url: '🚌', iconType: 'emoji', sortOrder: 4 },
    { name: '零食', url: '🍰', iconType: 'emoji', sortOrder: 5 },
    { name: '运动', url: '🚴', iconType: 'emoji', sortOrder: 6 },
    { name: '娱乐', url: '🎮', iconType: 'emoji', sortOrder: 7 },
    { name: '通讯', url: '📱', iconType: 'emoji', sortOrder: 8 },
    { name: '服饰', url: '👔', iconType: 'emoji', sortOrder: 9 },
    { name: '住房', url: '🏠', iconType: 'emoji', sortOrder: 10 },
    { name: '居家', url: '🛋️', iconType: 'emoji', sortOrder: 11 },
    { name: '孩子', url: '👶', iconType: 'emoji', sortOrder: 12 },
    { name: '长辈', url: '👴', iconType: 'emoji', sortOrder: 13 },
    { name: '社交', url: '💬', iconType: 'emoji', sortOrder: 14 },
    { name: '旅行', url: '✈️', iconType: 'emoji', sortOrder: 15 },
    { name: '数码', url: '💻', iconType: 'emoji', sortOrder: 16 },
    { name: '汽车', url: '🚗', iconType: 'emoji', sortOrder: 17 },
    { name: '医疗', url: '💊', iconType: 'emoji', sortOrder: 18 },
    { name: '书籍', url: '📚', iconType: 'emoji', sortOrder: 19 },
    { name: '学习', url: '🎓', iconType: 'emoji', sortOrder: 20 },
    { name: '礼金', url: '🧧', iconType: 'emoji', sortOrder: 21 },
    { name: '礼物', url: '🎁', iconType: 'emoji', sortOrder: 22 },
    { name: '办公', url: '💼', iconType: 'emoji', sortOrder: 23 },
    { name: '维修', url: '🔧', iconType: 'emoji', sortOrder: 24 },
    { name: '捐赠', url: '❤️', iconType: 'emoji', sortOrder: 25 },
    { name: '彩票', url: '🎰', iconType: 'emoji', sortOrder: 26 },
    { name: '亲友', url: '👨‍👩‍👧‍👦', iconType: 'emoji', sortOrder: 27 },
    { name: '快递', url: '📦', iconType: 'emoji', sortOrder: 28 },
    { name: '工资', url: '💼', iconType: 'emoji', sortOrder: 29 },
    { name: '奖金', url: '🎁', iconType: 'emoji', sortOrder: 30 },
    { name: '投资', url: '📈', iconType: 'emoji', sortOrder: 31 },
    { name: '兼职', url: '👔', iconType: 'emoji', sortOrder: 32 },
    { name: '理财', url: '💰', iconType: 'emoji', sortOrder: 33 },
    { name: '报销', url: '📋', iconType: 'emoji', sortOrder: 34 },
    { name: '其他', url: '📦', iconType: 'emoji', sortOrder: 35 },
    { name: '饮料', url: '🥤', iconType: 'emoji', sortOrder: 36 },
    { name: '水果', url: '🍎', iconType: 'emoji', sortOrder: 37 },
    { name: '美发', url: '💇', iconType: 'emoji', sortOrder: 38 },
    { name: '美容', url: '💄', iconType: 'emoji', sortOrder: 39 },
    { name: '健身', url: '🏋️', iconType: 'emoji', sortOrder: 40 },
    { name: '咖啡', url: '☕', iconType: 'emoji', sortOrder: 41 },
    { name: '电影', url: '🎬', iconType: 'emoji', sortOrder: 42 },
    { name: '音乐', url: '🎵', iconType: 'emoji', sortOrder: 43 },
    { name: '游戏', url: '🎮', iconType: 'emoji', sortOrder: 44 },
    { name: '宠物', url: '🐶', iconType: 'emoji', sortOrder: 45 },
  ];

  private defaultGroups: Omit<CategoryGroup, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { name: '饮食消费', iconId: 1, sortOrder: 1 },
    { name: '居家居住', iconId: 10, sortOrder: 2 },
    { name: '交通出行', iconId: 4, sortOrder: 3 },
    { name: '形象与消费', iconId: 9, sortOrder: 4 },
    { name: '兴趣与成长', iconId: 20, sortOrder: 5 },
    { name: '社交关系', iconId: 14, sortOrder: 6 },
    { name: '健康与医疗', iconId: 18, sortOrder: 7 },
    { name: '职场工作', iconId: 23, sortOrder: 8 },
    { name: '金融理财', iconId: 31, sortOrder: 9 },
    { name: '其他类型', iconId: 35, sortOrder: 10 },
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
    { id: 'expense_3_2', name: '汽车', groupId: 3, iconId: 17, sortOrder: 2, isDefault: true, type: 'expense' },
    { id: 'expense_4_1', name: '服饰', groupId: 4, iconId: 9, sortOrder: 1, isDefault: true, type: 'expense' },
    { id: 'expense_4_2', name: '美发', groupId: 4, iconId: 38, sortOrder: 2, isDefault: true, type: 'expense' },
    { id: 'expense_4_3', name: '美容', groupId: 4, iconId: 39, sortOrder: 3, isDefault: true, type: 'expense' },
    { id: 'expense_4_4', name: '购物', groupId: 4, iconId: 2, sortOrder: 4, isDefault: true, type: 'expense' },
    { id: 'expense_5_1', name: '运动', groupId: 5, iconId: 6, sortOrder: 1, isDefault: true, type: 'expense' },
    { id: 'expense_5_2', name: '健身', groupId: 5, iconId: 40, sortOrder: 2, isDefault: true, type: 'expense' },
    { id: 'expense_5_3', name: '旅行', groupId: 5, iconId: 15, sortOrder: 3, isDefault: true, type: 'expense' },
    { id: 'expense_5_4', name: '书籍', groupId: 5, iconId: 19, sortOrder: 4, isDefault: true, type: 'expense' },
    { id: 'expense_5_5', name: '学习', groupId: 5, iconId: 20, sortOrder: 5, isDefault: true, type: 'expense' },
    { id: 'expense_5_6', name: '娱乐', groupId: 5, iconId: 7, sortOrder: 6, isDefault: true, type: 'expense' },
    { id: 'expense_5_7', name: '电影', groupId: 5, iconId: 42, sortOrder: 7, isDefault: true, type: 'expense' },
    { id: 'expense_5_8', name: '音乐', groupId: 5, iconId: 43, sortOrder: 8, isDefault: true, type: 'expense' },
    { id: 'expense_5_9', name: '游戏', groupId: 5, iconId: 44, sortOrder: 9, isDefault: true, type: 'expense' },
    { id: 'expense_6_1', name: '社交', groupId: 6, iconId: 14, sortOrder: 1, isDefault: true, type: 'expense' },
    { id: 'expense_6_2', name: '礼物', groupId: 6, iconId: 22, sortOrder: 2, isDefault: true, type: 'expense' },
    { id: 'expense_6_3', name: '礼金', groupId: 6, iconId: 21, sortOrder: 3, isDefault: true, type: 'expense' },
    { id: 'expense_6_4', name: '亲友', groupId: 6, iconId: 27, sortOrder: 4, isDefault: true, type: 'expense' },
    { id: 'expense_6_5', name: '宠物', groupId: 6, iconId: 45, sortOrder: 5, isDefault: true, type: 'expense' },
    { id: 'expense_7_1', name: '医疗', groupId: 7, iconId: 18, sortOrder: 1, isDefault: true, type: 'expense' },
    { id: 'expense_8_1', name: '办公', groupId: 8, iconId: 23, sortOrder: 1, isDefault: true, type: 'expense' },
    { id: 'expense_8_2', name: '通讯', groupId: 8, iconId: 8, sortOrder: 2, isDefault: true, type: 'expense' },
    { id: 'expense_9_1', name: '投资', groupId: 9, iconId: 31, sortOrder: 1, isDefault: true, type: 'expense' },
    { id: 'expense_9_2', name: '彩票', groupId: 9, iconId: 26, sortOrder: 2, isDefault: true, type: 'expense' },
    { id: 'expense_10_1', name: '其他', groupId: 10, iconId: 35, sortOrder: 1, isDefault: true, type: 'expense' },
    { id: 'expense_10_2', name: '日用', groupId: 10, iconId: 3, sortOrder: 2, isDefault: true, type: 'expense' },
    { id: 'expense_10_3', name: '捐赠', groupId: 10, iconId: 25, sortOrder: 3, isDefault: true, type: 'expense' },
    { id: 'income_8_1', name: '工资', groupId: 8, iconId: 29, sortOrder: 1, isDefault: true, type: 'income' },
    { id: 'income_8_2', name: '奖金', groupId: 8, iconId: 30, sortOrder: 2, isDefault: true, type: 'income' },
    { id: 'income_9_1', name: '投资收入', groupId: 9, iconId: 31, sortOrder: 3, isDefault: true, type: 'income' },
    { id: 'income_8_3', name: '兼职', groupId: 8, iconId: 32, sortOrder: 4, isDefault: true, type: 'income' },
    { id: 'income_9_2', name: '理财', groupId: 9, iconId: 33, sortOrder: 5, isDefault: true, type: 'income' },
    { id: 'income_8_4', name: '报销', groupId: 8, iconId: 34, sortOrder: 6, isDefault: true, type: 'income' },
    { id: 'income_6_1', name: '礼金收入', groupId: 6, iconId: 21, sortOrder: 7, isDefault: true, type: 'income' },
    { id: 'income_10_1', name: '其他收入', groupId: 10, iconId: 35, sortOrder: 8, isDefault: true, type: 'income' },
  ];

  @Init()
  async init() {
    // 1. 初始化图标数据
    const iconCount = await this.iconModel.count();
    if (iconCount === 0) {
      await this.iconModel.save(this.defaultIcons as any);
    }

    // 2. 初始化一级分类
    const groupCount = await this.categoryGroupModel.count();
    if (groupCount === 0) {
      await this.categoryGroupModel.save(this.defaultGroups as any);
    }

    // 3. 初始化二级分类
    const categoryCount = await this.categoryModel.count();
    if (categoryCount === 0) {
      await this.categoryModel.save(this.defaultCategories as any);
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
      icon: iconMap.get(group.iconId),
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
        icon: iconMap.get(group.iconId),
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
    const groups = await this.categoryGroupModel.find({
      order: { sortOrder: 'ASC' },
    });
    const globalCategories = await this.categoryModel.find({
      where: { type },
      order: { sortOrder: 'ASC' },
    });
    const icons = await this.iconModel.find();
    const customizations = await this.customizationModel.find({
      where: { userId, type },
    });

    const iconMap = new Map(icons.map(i => [i.id, i]));
    const customizationMap = new Map(customizations.map(c => [c.categoryId, c]));

    const result = groups
      .map(group => {
        const groupCategories = globalCategories.filter(c => c.groupId === group.id);
        if (groupCategories.length === 0) return null;

        const children = groupCategories.map(cat => {
          const customization = customizationMap.get(cat.id);
          const isHidden = customization && customization.isEnabled === false;

          return {
            id: cat.id,
            name: customization?.customName || cat.name,
            iconId: customization?.customIconId || cat.iconId,
            icon: iconMap.get(customization?.customIconId || cat.iconId),
            sortOrder: customization?.sortOrder ?? cat.sortOrder,
            isHidden,
            isUserCreated: false,
            groupId: cat.groupId,
            type: cat.type,
          };
        });

        const visibleChildren = children.filter(c => !c.isHidden);

        return {
          id: group.id,
          name: group.name,
          icon: iconMap.get(group.iconId),
          children: visibleChildren.sort((a, b) => a.sortOrder - b.sortOrder),
        };
      })
      .filter(g => g && g.children.length > 0);

    const userCreatedCategories = customizations
      .filter(c => c.isUserCreated && c.isEnabled)
      .map(c => ({
        id: c.id,
        name: c.customName,
        iconId: c.customIconId,
        icon: iconMap.get(c.customIconId),
        sortOrder: c.sortOrder,
        isHidden: false,
        isUserCreated: true,
        groupId: c.groupId,
        type: c.type,
      }));

    if (userCreatedCategories.length > 0) {
      result.push({
        id: -1,
        name: '我的分类',
        icon: { id: 0, name: '自定义', url: '✨', iconType: 'emoji', sortOrder: 0 } as any,
        children: userCreatedCategories.sort((a, b) => a.sortOrder - b.sortOrder) as any,
      });
    }

    return result;
  }

  async getAllIcons() {
    return this.iconModel.find({
      order: { sortOrder: 'ASC' },
    });
  }
}
