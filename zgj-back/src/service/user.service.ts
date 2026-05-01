import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { UserCategoryCustomization } from '../entity/user_category_customization.entity';

@Provide()
export class UserService {
  @InjectEntityModel(User)
  userModel: Repository<User>;

  @InjectEntityModel(UserCategoryCustomization)
  customizationModel: Repository<UserCategoryCustomization>;

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
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async updateCategoryCustomization(
    userId: number,
    categoryId: string,
    data: {
      customName?: string;
      customIconId?: number;
      isEnabled?: boolean;
      sortOrder?: number;
    }
  ): Promise<UserCategoryCustomization> {
    let customization = await this.customizationModel.findOne({
      where: { userId, categoryId },
    });

    if (!customization) {
      customization = this.customizationModel.create({
        userId,
        categoryId,
        type: 'expense',
        isEnabled: true,
      });
    }

    if (data.customName !== undefined) {
      customization.customName = data.customName;
    }
    if (data.customIconId !== undefined) {
      customization.customIconId = data.customIconId;
    }
    if (data.isEnabled !== undefined) {
      customization.isEnabled = data.isEnabled;
    }
    if (data.sortOrder !== undefined) {
      customization.sortOrder = data.sortOrder;
    }

    return this.customizationModel.save(customization);
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
    const customization = this.customizationModel.create({
      userId,
      customName: data.name,
      customIconId: data.iconId,
      groupId: data.groupId,
      type: data.type,
      sortOrder: data.sortOrder || 0,
      isEnabled: true,
      isUserCreated: true,
    });

    return this.customizationModel.save(customization);
  }

  async deleteUserCategory(userId: number, customizationId: number): Promise<boolean> {
    const customization = await this.customizationModel.findOne({
      where: { id: customizationId, userId },
    });

    if (!customization) {
      return false;
    }

    if (!customization.isUserCreated) {
      throw new Error('默认分类不能删除，只能禁用');
    }

    await this.customizationModel.delete(customizationId);
    return true;
  }

  async enableCategory(userId: number, categoryId: string): Promise<UserCategoryCustomization> {
    return this.updateCategoryCustomization(userId, categoryId, { isEnabled: true });
  }

  async disableCategory(userId: number, categoryId: string): Promise<UserCategoryCustomization> {
    return this.updateCategoryCustomization(userId, categoryId, { isEnabled: false });
  }
}
