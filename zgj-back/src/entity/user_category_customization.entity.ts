import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ schema: 'firelifes', name: 'user_category_customizations', comment: '用户分类定制表' })
export class UserCategoryCustomization {
  @PrimaryGeneratedColumn('increment', { comment: '定制记录ID' })
  id: number;

  @Column({ name: 'user_id', comment: '用户ID' })
  userId: number;

  @Column({ name: 'category_id', length: 50, nullable: true, comment: '关联的全局分类ID，空表示用户自定义分类' })
  categoryId: string;

  @Column({ name: 'custom_name', length: 50, nullable: true, comment: '自定义名称' })
  customName: string;

  @Column({ name: 'custom_icon_id', nullable: true, comment: '自定义图标ID' })
  customIconId: number;

  @Column({ name: 'group_id', type: 'int', nullable: true, comment: '所属一级分类ID' })
  groupId: number;

  @Column({ name: 'sort_order', type: 'int', default: 0, comment: '用户自定义排序' })
  sortOrder: number;

  @Column({ name: 'is_enabled', type: 'boolean', default: true, comment: '是否启用，false表示用户隐藏了该分类' })
  isEnabled: boolean;

  @Column({ name: 'is_user_created', type: 'boolean', default: false, comment: '是否是用户自创分类，true表示用户新增的分类' })
  isUserCreated: boolean;

  @Column({ length: 10, comment: '类型：income-收入，expense-支出' })
  type: 'income' | 'expense';

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
