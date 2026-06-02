import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { UserCategoryCustomization } from '../entity/user_category_customization.entity';
import { UserCategoryGroup } from '../entity/user_category_group.entity';
import { UserIcon } from '../entity/user_icon.entity';
import { UserConfig } from '../entity/user_config.entity';

@Provide()
export class UserService {
  @InjectEntityModel(User)
  userModel: Repository<User>;

  @InjectEntityModel(UserCategoryCustomization)
  customizationModel: Repository<UserCategoryCustomization>;

  @InjectEntityModel(UserCategoryGroup)
  userGroupModel: Repository<UserCategoryGroup>;

  @InjectEntityModel(UserIcon)
  userIconModel: Repository<UserIcon>;

  @InjectEntityModel(UserConfig)
  userConfigModel: Repository<UserConfig>;

  async getUserProfile(userId: number): Promise<Partial<User>> {
    const user = await this.userModel.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('用户不存在');
    }
    return {
      id: user.id,
      username: user.username,
      phone: user.phone,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      wechatUnionid: user.wechatUnionid,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  async updateProfile(userId: number, data: {
    nickname?: string;
    avatarUrl?: string;
  }): Promise<User> {
    const user = await this.userModel.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('用户不存在');
    }

    if (data.nickname !== undefined) {
      user.nickname = data.nickname;
    }
    if (data.avatarUrl !== undefined) {
      user.avatarUrl = data.avatarUrl;
    }

    return this.userModel.save(user);
  }

  async getUserCustomizations(userId: number): Promise<UserCategoryCustomization[]> {
    return this.customizationModel.find({
      where: { userId },
      relations: ['icon'],
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async updateUserCategory(
    userId: number,
    categoryId: number,
    data: {
      name?: string;
      iconId?: number;
      isEnabled?: boolean;
      sortOrder?: number;
    }
  ): Promise<UserCategoryCustomization> {
    let category = await this.customizationModel.findOne({
      where: { id: categoryId, userId },
    });

    if (!category) {
      throw new Error('分类不存在');
    }

    if (data.name !== undefined) {
      category.name = data.name;
    }
    if (data.iconId !== undefined) {
      category.iconId = data.iconId;
    }
    if (data.isEnabled !== undefined) {
      category.isEnabled = data.isEnabled;
    }
    if (data.sortOrder !== undefined) {
      category.sortOrder = data.sortOrder;
    }

    return this.customizationModel.save(category);
  }

  async addUserCategory(
    userId: number,
    data: {
      name: string;
      iconId: number;
      groupId: number;
      type: 'income' | 'expense';
      sortOrder?: number;
    }
  ): Promise<UserCategoryCustomization> {
    const category = this.customizationModel.create({
      userId,
      name: data.name,
      iconId: data.iconId,
      groupId: data.groupId,
      type: data.type,
      sortOrder: data.sortOrder || 0,
      isEnabled: true,
      isUserCreated: true,
    });

    return this.customizationModel.save(category);
  }

  async deleteUserCategory(userId: number, categoryId: number): Promise<boolean> {
    const category = await this.customizationModel.findOne({
      where: { id: categoryId, userId },
    });

    if (!category) {
      return false;
    }

    if (!category.isUserCreated) {
      throw new Error('默认分类不能删除，只能禁用');
    }

    await this.customizationModel.delete(categoryId);
    return true;
  }

  async enableCategory(userId: number, categoryId: number): Promise<UserCategoryCustomization> {
    return this.updateUserCategory(userId, categoryId, { isEnabled: true });
  }

  async disableCategory(userId: number, categoryId: number): Promise<UserCategoryCustomization> {
    return this.updateUserCategory(userId, categoryId, { isEnabled: false });
  }

  private defaultGroupNames = ['饮食消费', '居家居住', '交通出行', '服饰美容', '学习成长', '休闲娱乐', '社交关系', '健康医疗', '金融理财', '其他支出', '薪资报酬', '投资理财', '其他收入'];

  private markGroupIsUserCreated(groups: UserCategoryGroup[]) {
    for (const group of groups) {
      group.isUserCreated = !this.defaultGroupNames.includes(group.name);
    }
  }

  async getUserGroups(userId: number): Promise<UserCategoryGroup[]> {
    const groups = await this.userGroupModel.find({
      where: { userId, isEnabled: true },
      order: { sortOrder: 'ASC' },
    });
    this.markGroupIsUserCreated(groups);
    return groups;
  }

  async addUserGroup(
    userId: number,
    data: {
      name: string;
      sortOrder?: number;
    }
  ): Promise<UserCategoryGroup> {
    const group = this.userGroupModel.create({
      userId,
      name: data.name,
      sortOrder: data.sortOrder || 0,
      isEnabled: true,
      isUserCreated: true,
    });

    return this.userGroupModel.save(group);
  }

  async deleteUserGroup(userId: number, groupId: number): Promise<boolean> {
    const group = await this.userGroupModel.findOne({
      where: { id: groupId, userId },
    });

    if (!group) {
      return false;
    }

    await this.userGroupModel.delete(groupId);
    return true;
  }

  async getUserIcons(userId: number): Promise<UserIcon[]> {
    return this.userIconModel.find({
      where: { userId, isEnabled: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async addUserIcon(
    userId: number,
    data: {
      name: string;
      url: string;
      iconType?: 'emoji' | 'image';
      sortOrder?: number;
    }
  ): Promise<UserIcon> {
    const icon = this.userIconModel.create({
      userId,
      name: data.name,
      url: data.url,
      iconType: data.iconType || 'emoji',
      sortOrder: data.sortOrder || 0,
      isEnabled: true,
    });

    return this.userIconModel.save(icon);
  }

  async getUserConfig(userId: number): Promise<Record<string, any>> {
    const configs = await this.userConfigModel.find({
      where: { userId },
    });

    const result: Record<string, any> = {};
    for (const config of configs) {
      try {
        result[config.configKey] = JSON.parse(config.configValue);
      } catch {
        result[config.configKey] = config.configValue;
      }
    }
    return result;
  }

  async updateUserConfig(
    userId: number,
    configs: Record<string, any>
  ): Promise<void> {
    const keys = Object.keys(configs);
    const existingConfigs = await this.userConfigModel.find({
      where: keys.map((key) => ({ userId, configKey: key })),
    });

    const existingMap = new Map(existingConfigs.map((c) => [c.configKey, c]));

    for (const [key, value] of Object.entries(configs)) {
      const configValue = typeof value === 'string' ? value : JSON.stringify(value);
      const existing = existingMap.get(key);

      if (existing) {
        existing.configValue = configValue;
        await this.userConfigModel.save(existing);
      } else {
        const newConfig = this.userConfigModel.create({
          userId,
          configKey: key,
          configValue,
        });
        await this.userConfigModel.save(newConfig);
      }
    }
  }

  async initUserConfig(userId: number): Promise<void> {
    const existing = await this.userConfigModel.findOne({
      where: { userId, configKey: 'theme' },
    });
    if (existing) return;

    const config = this.userConfigModel.create({
      userId,
      configKey: 'theme',
      configValue: JSON.stringify({
        mode: 'preset',
        presetName: 'teal',
        customColors: {},
      }),
    });
    await this.userConfigModel.save(config);
  }
}
