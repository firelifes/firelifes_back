import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Account, AccountType, RepaymentMethod } from '../entity/account.entity';
import { Record as RecordEntity } from '../entity/record.entity';

export interface CreditCardFields {
  billingDay: number;
  dueDay: number;
  creditLimit?: number;
  minPaymentRate?: number;
  dailyInterestRate?: number;
}

export interface AccountRequest {
  name: string;
  icon: string;
  type: AccountType;
  balance: number;
  description?: string;
  isDefaultExpense: boolean;
  isDefaultIncome: boolean;
  // 负债类字段
  originalPrincipal?: number;
  annualInterestRate?: number;
  repaymentMethod?: RepaymentMethod;
  totalMonths?: number;
  remainingMonths?: number;
  repaymentDay?: number;
  linkedAssetAccountId?: string;
  lastRepaymentDate?: string;
  // 信用卡字段
  creditCardFields?: CreditCardFields;
}

export interface DefaultAccountConfig {
  name: string;
  icon: string;
  type: AccountType;
  balance: number;
  description?: string;
  order: number;
  isDefaultExpense: boolean;
  isDefaultIncome: boolean;
  isVisible: boolean;
  isDeleted: boolean;
}

const DEFAULT_ACCOUNTS: Omit<DefaultAccountConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '现金',
    icon: 'account-icon-wallet',
    type: 'cash',
    balance: 0,
    description: '日常现金备用',
    order: 1,
    isDefaultExpense: true,
    isDefaultIncome: true,
    isVisible: true,
    isDeleted: false
  },
  {
    name: '折旧资产',
    icon: 'account-icon-mobile',
    type: 'depreciable_asset',
    balance: 0,
    description: '手机、电脑等折旧物品',
    order: 2,
    isDefaultExpense: false,
    isDefaultIncome: false,
    isVisible: true,
    isDeleted: false
  },
  {
    name: '固定资产',
    icon: 'account-icon-house',
    type: 'fixed_asset',
    balance: 0,
    description: '房产、车位等高价值物品',
    order: 3,
    isDefaultExpense: false,
    isDefaultIncome: false,
    isVisible: true,
    isDeleted: false
  }
];

/**
 * 转换账户数据格式，确保符合前端期望
 * 信用卡字段打包为 creditCardFields 对象
 */
const transformAccount = (account: Account) => {
  const base = {
    ...account,
    id: String(account.id),
    userId: String(account.userId),
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
    lastRepaymentDate: account.lastRepaymentDate ? account.lastRepaymentDate.toISOString() : undefined,
  };

  if (account.type === 'credit_card') {
    (base as any).creditCardFields = {
      billingDay: account.billingDay,
      dueDay: account.dueDay,
      creditLimit: account.creditLimit,
      minPaymentRate: account.minPaymentRate,
      dailyInterestRate: account.dailyInterestRate,
    };
    delete (base as any).billingDay;
    delete (base as any).dueDay;
    delete (base as any).creditLimit;
    delete (base as any).minPaymentRate;
    delete (base as any).dailyInterestRate;
  }

  return base;
};

const transformAccounts = (accounts: Account[]) => {
  return accounts.map(transformAccount);
};

/**
 * Emoji → SVG图标类名映射表
 * 用于将旧用户accounts表中icon字段的emoji值迁移为SVG类名
 */
const EMOJI_TO_SVG_MAP: Record<string, string> = {
  '💵': 'account-icon-wallet',
  '💰': 'account-icon-wallet',
  '🏦': 'account-icon-bank',
  '💚': 'account-icon-piggy',
  '📈': 'account-icon-trending',
  '🏠': 'account-icon-house',
  '🚗': 'account-icon-car',
  '💳': 'account-icon-credit-card',
  '📱': 'account-icon-mobile',
  '💻': 'account-icon-laptop',
  '🎮': 'account-icon-game',
  '📷': 'account-icon-camera',
  '🎵': 'account-icon-music',
  '📚': 'account-icon-book',
  '🎁': 'account-icon-gift',
  '💼': 'account-icon-briefcase',
  '🔧': 'account-icon-wrench',
  '✈️': 'account-icon-plane',
  '🏖️': 'account-icon-umbrella',
  '🎓': 'account-icon-graduation',
  '🏥': 'account-icon-hospital',
};

/**
 * 判断icon字段是否为emoji（需要迁移）
 * SVG类名格式为 account-icon-xxx，emoji则不包含此前缀
 */
const isEmojiIcon = (icon: string): boolean => {
  return !icon.startsWith('account-icon-') && !icon.startsWith('login-icon-');
};

/** 需要强制余额为负数的账户类型 */
const NEGATIVE_BALANCE_TYPES: AccountType[] = ['liability', 'credit_card'];

/** 支持设为默认账户的类型 */
const CAN_BE_DEFAULT_TYPES: AccountType[] = ['cash', 'liability', 'credit_card'];

@Provide()
export class AccountService {
  @InjectEntityModel(Account)
  accountModel: Repository<Account>;

  @InjectEntityModel(RecordEntity)
  recordModel: Repository<RecordEntity>;

  /**
   * 迁移所有用户的emoji图标为SVG类名
   * 返回迁移的账户数量
   */
  async migrateEmojiToSvg(): Promise<{ total: number; migrated: number; details: { id: number; oldIcon: string; newIcon: string }[] }> {
    const allAccounts = await this.accountModel.find({
      where: { isDeleted: false }
    });

    const details: { id: number; oldIcon: string; newIcon: string }[] = [];
    let migrated = 0;

    for (const account of allAccounts) {
      if (isEmojiIcon(account.icon)) {
        const oldIcon = account.icon;
        const newIcon = EMOJI_TO_SVG_MAP[account.icon];
        if (newIcon) {
          account.icon = newIcon;
          await this.accountModel.save(account);
          details.push({ id: account.id, oldIcon, newIcon });
          migrated++;
        } else {
          const defaultIconByType: Record<AccountType, string> = {
            cash: 'account-icon-wallet',
            investment: 'account-icon-trending',
            fixed_asset: 'account-icon-house',
            depreciable_asset: 'account-icon-mobile',
            liability: 'account-icon-loan',
            credit_card: 'account-icon-credit-card',
          };
          const fallbackIcon = defaultIconByType[account.type] || 'account-icon-wallet';
          account.icon = fallbackIcon;
          await this.accountModel.save(account);
          details.push({ id: account.id, oldIcon, newIcon: fallbackIcon });
          migrated++;
        }
      }
    }

    return { total: allAccounts.length, migrated, details };
  }

  /**
   * 获取用户的所有账户
   */
  async getAccountsByUserId(userId: number): Promise<Account[]> {
    const accounts = await this.accountModel.find({
      where: {
        userId,
        isDeleted: false
      },
      order: {
        order: 'ASC',
        createdAt: 'ASC'
      }
    });
    return transformAccounts(accounts) as any;
  }

  /**
   * 获取账户详情
   */
  async getAccountById(id: number, userId: number): Promise<Account | null> {
    const account = await this.accountModel.findOne({
      where: {
        id,
        userId,
        isDeleted: false
      }
    });
    if (!account) {
      return null;
    }
    return transformAccount(account) as any;
  }

  /**
   * 处理默认账户互斥逻辑：同类型只能有一个默认支出/收入账户
   */
  private async handleDefaultAccountMutex(
    userId: number,
    accountType: AccountType,
    isDefaultExpense: boolean,
    isDefaultIncome: boolean,
    excludeAccountId?: number
  ) {
    if (isDefaultExpense) {
      const where: any = {
        userId,
        type: accountType,
        isDeleted: false
      };
      if (excludeAccountId) {
        where.id = Not(excludeAccountId);
      }
      await this.accountModel.update(where, { isDefaultExpense: false });
    }

    if (isDefaultIncome) {
      const where: any = {
        userId,
        type: accountType,
        isDeleted: false
      };
      if (excludeAccountId) {
        where.id = Not(excludeAccountId);
      }
      await this.accountModel.update(where, { isDefaultIncome: false });
    }
  }

  /**
   * 创建账户
   */
  async createAccount(userId: number, data: AccountRequest): Promise<Account> {
    const lastAccount = await this.accountModel.findOne({
      where: { userId, isDeleted: false },
      order: { order: 'DESC' }
    });

    // 负债类、信用卡余额强制转负数
    let balance = data.balance;
    if (NEGATIVE_BALANCE_TYPES.includes(data.type) && balance > 0) {
      balance = -Math.abs(balance);
    }

    // 非现金类、负债类、信用卡类不能设为默认账户
    if (!CAN_BE_DEFAULT_TYPES.includes(data.type)) {
      data.isDefaultExpense = false;
      data.isDefaultIncome = false;
    }

    // 处理默认账户互斥逻辑
    await this.handleDefaultAccountMutex(
      userId,
      data.type,
      data.isDefaultExpense,
      data.isDefaultIncome
    );

    // 处理关联资产账户ID转换
    let linkedAssetAccountIdNum: number | undefined;
    if (data.linkedAssetAccountId && !isNaN(Number(data.linkedAssetAccountId))) {
      linkedAssetAccountIdNum = Number(data.linkedAssetAccountId);
    }

    // 处理 lastRepaymentDate
    let lastRepaymentDateVal: Date | undefined;
    if (data.lastRepaymentDate) {
      lastRepaymentDateVal = new Date(data.lastRepaymentDate);
    }

    const accountData: Partial<Account> = {
      userId,
      name: data.name,
      icon: data.icon,
      type: data.type,
      balance: balance,
      description: data.description,
      isDefaultExpense: data.isDefaultExpense,
      isDefaultIncome: data.isDefaultIncome,
      order: (lastAccount?.order || 0) + 1,
      isVisible: true,
      isDeleted: false,
      lastRepaymentDate: lastRepaymentDateVal,
    };

    // 负债类字段
    if (data.type === 'liability') {
      accountData.originalPrincipal = data.originalPrincipal;
      accountData.annualInterestRate = data.annualInterestRate;
      accountData.repaymentMethod = data.repaymentMethod;
      accountData.totalMonths = data.totalMonths;
      accountData.remainingMonths = data.remainingMonths;
      accountData.repaymentDay = data.repaymentDay;
      accountData.linkedAssetAccountId = linkedAssetAccountIdNum;
    }

    // 信用卡字段
    if (data.type === 'credit_card' && data.creditCardFields) {
      accountData.billingDay = data.creditCardFields.billingDay;
      accountData.dueDay = data.creditCardFields.dueDay;
      accountData.creditLimit = data.creditCardFields.creditLimit;
      accountData.minPaymentRate = data.creditCardFields.minPaymentRate ?? 10;
      accountData.dailyInterestRate = data.creditCardFields.dailyInterestRate ?? 0.05;
    }

    const account = this.accountModel.create(accountData);
    const savedAccount = await this.accountModel.save(account);
    return transformAccount(savedAccount) as any;
  }

  /**
   * 更新账户
   */
  async updateAccount(id: number, userId: number, data: AccountRequest): Promise<Account | null> {
    const account = await this.accountModel.findOne({
      where: {
        id,
        userId,
        isDeleted: false
      }
    });
    if (!account) {
      return null;
    }

    // 负债类、信用卡余额强制转负数
    let balance = data.balance;
    if (NEGATIVE_BALANCE_TYPES.includes(data.type) && balance > 0) {
      balance = -Math.abs(balance);
    }

    // 非现金类、负债类、信用卡类不能设为默认账户
    if (!CAN_BE_DEFAULT_TYPES.includes(data.type)) {
      data.isDefaultExpense = false;
      data.isDefaultIncome = false;
    }

    // 处理默认账户互斥逻辑
    await this.handleDefaultAccountMutex(
      userId,
      data.type,
      data.isDefaultExpense,
      data.isDefaultIncome,
      id
    );

    const oldBalance = Number(account.balance);

    account.name = data.name;
    account.icon = data.icon;
    account.type = data.type;
    account.balance = balance;
    account.description = data.description;
    account.isDefaultExpense = data.isDefaultExpense;
    account.isDefaultIncome = data.isDefaultIncome;

    // 处理 lastRepaymentDate
    if (data.lastRepaymentDate) {
      account.lastRepaymentDate = new Date(data.lastRepaymentDate);
    }

    // 负债类字段（切换类型时清空非本类型字段）
    if (data.type === 'liability') {
      account.originalPrincipal = data.originalPrincipal;
      account.annualInterestRate = data.annualInterestRate;
      account.repaymentMethod = data.repaymentMethod;
      account.totalMonths = data.totalMonths;
      account.remainingMonths = data.remainingMonths;
      account.repaymentDay = data.repaymentDay;
      if (data.linkedAssetAccountId && !isNaN(Number(data.linkedAssetAccountId))) {
        account.linkedAssetAccountId = Number(data.linkedAssetAccountId);
      } else {
        account.linkedAssetAccountId = undefined;
      }
      // 清空信用卡字段
      account.billingDay = undefined;
      account.dueDay = undefined;
      account.creditLimit = undefined;
      account.minPaymentRate = undefined;
      account.dailyInterestRate = undefined;
    } else if (data.type === 'credit_card') {
      // 信用卡字段
      if (data.creditCardFields) {
        account.billingDay = data.creditCardFields.billingDay;
        account.dueDay = data.creditCardFields.dueDay;
        account.creditLimit = data.creditCardFields.creditLimit;
        account.minPaymentRate = data.creditCardFields.minPaymentRate ?? 10;
        account.dailyInterestRate = data.creditCardFields.dailyInterestRate ?? 0.05;
      }
      // 清空负债类字段
      account.originalPrincipal = undefined;
      account.annualInterestRate = undefined;
      account.repaymentMethod = undefined;
      account.totalMonths = undefined;
      account.remainingMonths = undefined;
      account.repaymentDay = undefined;
      account.linkedAssetAccountId = undefined;
    } else {
      // 其他类型清空负债和信用卡字段
      account.originalPrincipal = undefined;
      account.annualInterestRate = undefined;
      account.repaymentMethod = undefined;
      account.totalMonths = undefined;
      account.remainingMonths = undefined;
      account.repaymentDay = undefined;
      account.linkedAssetAccountId = undefined;
      account.billingDay = undefined;
      account.dueDay = undefined;
      account.creditLimit = undefined;
      account.minPaymentRate = undefined;
      account.dailyInterestRate = undefined;
      account.lastRepaymentDate = undefined;
    }

    const updatedAccount = await this.accountModel.save(account);

    const newBalance = Number(balance);
    const diff = Math.round((newBalance - oldBalance) * 100) / 100;
    if (diff !== 0) {
      const today = new Date().toISOString().split('T')[0];
      const adjustmentType = diff > 0 ? 'adjustment_increase' : 'adjustment_decrease';
      const record = this.recordModel.create({
        userId,
        typeId: 0,
        date: today,
        amount: Math.abs(diff),
        type: adjustmentType,
        accountId: id,
        remark: `手动调整余额（${oldBalance.toFixed(2)} → ${newBalance.toFixed(2)}）`,
      });
      await this.recordModel.save(record);
    }

    return transformAccount(updatedAccount) as any;
  }

  /**
   * 删除账户（软删除）
   */
  async deleteAccount(id: number, userId: number): Promise<boolean> {
    const account = await this.accountModel.findOne({
      where: {
        id,
        userId,
        isDeleted: false
      }
    });
    if (!account) {
      return false;
    }

    // 默认账户不允许删除
    if (account.isDefaultExpense || account.isDefaultIncome) {
      return false;
    }

    account.isDeleted = true;
    await this.accountModel.save(account);
    return true;
  }

  /**
   * 为新用户创建默认账户
   */
  async createDefaultAccounts(userId: number): Promise<Account[]> {
    const accounts: Account[] = [];

    for (const config of DEFAULT_ACCOUNTS) {
      const account = this.accountModel.create({
        userId,
        name: config.name,
        icon: config.icon,
        type: config.type,
        balance: config.balance,
        description: config.description,
        isDefaultExpense: config.isDefaultExpense,
        isDefaultIncome: config.isDefaultIncome,
        order: config.order,
        isVisible: config.isVisible,
        isDeleted: config.isDeleted
      });

      const savedAccount = await this.accountModel.save(account);
      accounts.push(savedAccount);
    }

    return transformAccounts(accounts) as any;
  }
}
