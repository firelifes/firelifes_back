import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type AccountType = 'cash' | 'investment' | 'fixed_asset' | 'depreciable_asset' | 'liability' | 'credit_card' | 'receivable' | 'payable';

export type ImplicitAccountType = 'receivable' | 'payable';

export type RepaymentMethod = 'equal_principal_interest' | 'equal_principal' | 'interest_first' | 'flexible';

export type CreditCardPaymentType = 'full' | 'minimum' | 'custom';

@Entity({ name: 'accounts', comment: '账户表' })
@Index(['userId', 'isDeleted'])
export class Account {
  @PrimaryGeneratedColumn('increment', { comment: '账户ID' })
  id: number;

  @Column({ name: 'user_id', type: 'int', comment: '用户ID' })
  @Index()
  userId: number;

  @Column({ name: 'name', type: 'varchar', length: 100, comment: '账户名称' })
  name: string;

  @Column({ name: 'icon', type: 'varchar', length: 20, comment: '图标' })
  icon: string;

  @Column({ name: 'type', type: 'varchar', length: 30, comment: '账户类型' })
  type: AccountType;

  @Column({ name: 'balance', type: 'decimal', precision: 14, scale: 2, default: 0, comment: '余额' })
  balance: number;

  @Column({ name: 'description', type: 'varchar', length: 500, nullable: true, comment: '说明' })
  description?: string;

  @Column({ name: 'is_default_expense', type: 'boolean', default: false, comment: '是否默认支出账户' })
  isDefaultExpense: boolean;

  @Column({ name: 'is_default_income', type: 'boolean', default: false, comment: '是否默认收入账户' })
  isDefaultIncome: boolean;

  // ===== 负债类（贷款）账户专用字段 =====
  @Column({ name: 'original_principal', type: 'decimal', precision: 14, scale: 2, nullable: true, comment: '原始贷款总本金' })
  originalPrincipal?: number;

  @Column({ name: 'annual_interest_rate', type: 'decimal', precision: 5, scale: 2, nullable: true, comment: '贷款年利率' })
  annualInterestRate?: number;

  @Column({ name: 'repayment_method', type: 'varchar', length: 30, nullable: true, comment: '还款方式' })
  repaymentMethod?: RepaymentMethod;

  @Column({ name: 'total_months', type: 'int', nullable: true, comment: '总还款期数' })
  totalMonths?: number;

  @Column({ name: 'remaining_months', type: 'int', nullable: true, comment: '剩余还款期数' })
  remainingMonths?: number;

  @Column({ name: 'repayment_day', type: 'int', nullable: true, comment: '每月还款日' })
  repaymentDay?: number;

  @Column({ name: 'linked_asset_account_id', type: 'int', nullable: true, comment: '关联资产账户ID' })
  linkedAssetAccountId?: number;

  @Column({ name: 'last_repayment_date', type: 'timestamp', nullable: true, comment: '上次还款日期（灵活还款用）' })
  lastRepaymentDate?: Date;

  // ===== 信用卡账户专用字段 =====
  @Column({ name: 'billing_day', type: 'int', nullable: true, comment: '账单日 1-28' })
  billingDay?: number;

  @Column({ name: 'due_day', type: 'int', nullable: true, comment: '还款日 1-28' })
  dueDay?: number;

  @Column({ name: 'credit_limit', type: 'decimal', precision: 14, scale: 2, nullable: true, comment: '信用额度' })
  creditLimit?: number;

  @Column({ name: 'min_payment_rate', type: 'decimal', precision: 5, scale: 2, nullable: true, default: 10, comment: '最低还款比例' })
  minPaymentRate?: number;

  @Column({ name: 'daily_interest_rate', type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0.05, comment: '逾期日利率' })
  dailyInterestRate?: number;

  @Column({ name: 'order', type: 'int', default: 0, comment: '排序' })
  order: number;

  @Column({ name: 'is_visible', type: 'boolean', default: true, comment: '是否显示' })
  isVisible: boolean;

  @Column({ name: 'is_deleted', type: 'boolean', default: false, comment: '软删除标记' })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: '更新时间' })
  updatedAt: Date;
}
