import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'budgets', comment: '预算表' })
@Index(['userId', 'year', 'month'])
@Index(['userId', 'typeId', 'year', 'month', 'periodType'], { unique: true })
export class Budget {
  @PrimaryGeneratedColumn('increment', { comment: '预算ID，主键自增' })
  id: number;

  @Column({ name: 'user_id', type: 'int', comment: '用户ID，关联users表' })
  userId: number;

  @Column({ name: 'budget_type', length: 20, default: 'normal', comment: '预算类型：normal-常规预算' })
  budgetType: 'normal' | 'reserve';

  @Column({ name: 'name', length: 100, comment: '预算名称' })
  name: string;

  @Column({ name: 'type_id', type: 'int', nullable: true, comment: '分类ID，关联 user_category_customizations 表（空表示总预算）' })
  typeId?: number;

  @Column({ name: 'category_group_id', type: 'int', nullable: true, comment: '分类组ID，关联 user_category_groups 表' })
  categoryGroupId?: number;

  @Column({ name: 'period_type', length: 20, default: 'monthly', comment: '周期类型' })
  periodType: 'monthly' | 'quarterly' | 'yearly';

  @Column({ type: 'int', comment: '年份' })
  year: number;

  @Column({ type: 'int', comment: '月份' })
  month: number;

  @Column({ name: 'start_date', type: 'date', nullable: true, comment: '自定义开始日期' })
  startDate?: string;

  @Column({ name: 'end_date', type: 'date', nullable: true, comment: '自定义结束日期' })
  endDate?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, comment: '预算金额' })
  amount: number;

  @Column({ name: 'is_base', type: 'boolean', default: true, comment: '是否为基础预算，用户临时调整的预算为false' })
  isBase: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '已用金额' })
  spent: number;

  @Column({ name: 'alert_threshold', type: 'int', default: 80, comment: '预警阈值百分比' })
  alertThreshold: number;

  @Column({ name: 'alert_enabled', type: 'boolean', default: true, comment: '是否启用预警' })
  alertEnabled: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true, comment: '是否生效' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
