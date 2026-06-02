import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Record } from '../entity/record.entity';
import { Account } from '../entity/account.entity';
import { DepreciatingAsset } from '../entity/depreciating_asset.entity';
import { Budget } from '../entity/budget.entity';
import { UserCategoryCustomization } from '../entity/user_category_customization.entity';
import { UserIcon } from '../entity/user_icon.entity';
import { ICreateRecordOptions, IUpdateRecordOptions } from '../interface';

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MonthSummary {
  income: number;
  expense: number;
}

export interface YearlySummary {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
}

export interface YearlyBill {
  year: number;
  income: number;
  expense: number;
  balance: number;
}

/**
 * 根据记账类型联动更新账户余额
 * @returns 更新后的主账户余额
 */
function revertAccountBalance(
  account: Account,
  toAccount: Account | null,
  type: string,
  amount: number
): { accountBalance: number; toAccountBalance?: number } {
  const absAmount = Math.abs(amount);

  switch (type) {
    case 'expense':
      account.balance = Number(account.balance) + absAmount;
      return { accountBalance: account.balance };

    case 'income':
      account.balance = Number(account.balance) - absAmount;
      return { accountBalance: account.balance };

    case 'transfer':
      account.balance = Number(account.balance) + absAmount;
      if (toAccount) {
        toAccount.balance = Number(toAccount.balance) - absAmount;
        return { accountBalance: account.balance, toAccountBalance: toAccount.balance };
      }
      return { accountBalance: account.balance };

    case 'repayment':
      account.balance = Number(account.balance) + absAmount;
      if (toAccount) {
        toAccount.balance = Number(toAccount.balance) - absAmount;
        return { accountBalance: account.balance, toAccountBalance: toAccount.balance };
      }
      return { accountBalance: account.balance };

    case 'adjustment_increase':
    case 'adjustment_decrease':
      // 调整记录仅作审计追踪，删除时不回退余额
      return { accountBalance: account.balance };

    default:
      return { accountBalance: account.balance };
  }
}

function calculateAccountBalance(
  account: Account,
  toAccount: Account | null,
  type: string,
  amount: number
): { accountBalance: number; toAccountBalance?: number } {
  const absAmount = Math.abs(amount);

  switch (type) {
    case 'expense':
      // 支出：账户余额减少
      account.balance = Number(account.balance) - absAmount;
      return { accountBalance: account.balance };

    case 'income':
      // 收入：账户余额增加
      account.balance = Number(account.balance) + absAmount;
      return { accountBalance: account.balance };

    case 'transfer':
      // 转账：转出账户减少，转入账户增加
      account.balance = Number(account.balance) - absAmount;
      if (toAccount) {
        toAccount.balance = Number(toAccount.balance) + absAmount;
        return { accountBalance: account.balance, toAccountBalance: toAccount.balance };
      }
      return { accountBalance: account.balance };

    case 'repayment':
      // 还债：还款账户（资产）减少，债权账户（负债）绝对值减少
      account.balance = Number(account.balance) - absAmount;
      if (toAccount) {
        // 负债账户余额为负数（或0），还债后负债绝对值变小即余额变大（趋向0）
        toAccount.balance = Number(toAccount.balance) + absAmount;
        return { accountBalance: account.balance, toAccountBalance: toAccount.balance };
      }
      return { accountBalance: account.balance };

    case 'adjustment_increase':
    case 'adjustment_decrease':
      // 调整记录仅作审计追踪，账户余额已在账户 API 中完成修改，此处不重复扣减
      return { accountBalance: account.balance };

    default:
      return { accountBalance: account.balance };
  }
}

function calculateMonthlyDepreciation(
  purchasePrice: number,
  residualValue: number,
  lifeMonths: number,
  method: string
): number {
  if (method === 'straight-line') {
    return (purchasePrice - residualValue) / lifeMonths;
  }
  // double-declining-balance: 首月折旧 = purchasePrice * (2 / lifeMonths)
  return purchasePrice * (2 / lifeMonths);
}

@Provide()
export class RecordService {
  @InjectEntityModel(Record)
  recordModel: Repository<Record>;

  @InjectEntityModel(Account)
  accountModel: Repository<Account>;

  @InjectEntityModel(DepreciatingAsset)
  depreciatingAssetModel: Repository<DepreciatingAsset>;

  @InjectEntityModel(Budget)
  budgetModel: Repository<Budget>;

  @InjectEntityModel(UserCategoryCustomization)
  categoryModel: Repository<UserCategoryCustomization>;

  @InjectEntityModel(UserIcon)
  iconModel: Repository<UserIcon>;

  async createRecord(options: ICreateRecordOptions): Promise<Record> {
    return this.recordModel.manager.transaction(async (manager) => {
      const record = manager.create(Record, {
        userId: options.userId,
        typeId: options.typeId,
        date: options.date,
        amount: options.amount,
        type: options.type,
        accountId: options.accountId,
        toAccountId: options.toAccountId,
        remark: options.remark || '',
      });
      const savedRecord = await manager.save(record);

      // 联动更新账户余额
      if (options.accountId) {
        const account = await manager.findOne(Account, {
          where: { id: options.accountId, userId: options.userId, isDeleted: false }
        });
        if (account) {
          let toAccount: Account | null = null;
          if (options.toAccountId) {
            toAccount = await manager.findOne(Account, {
              where: { id: options.toAccountId, userId: options.userId, isDeleted: false }
            });
          }
          calculateAccountBalance(account, toAccount, options.type, options.amount);
          await manager.save(account);
          if (toAccount) {
            await manager.save(toAccount);
          }
        }
      }

      // 如果记入资产，事务内创建折旧资产
      if (options.depreciatingAsset) {
        const asset = options.depreciatingAsset;
        const monthlyDepreciation = calculateMonthlyDepreciation(
          asset.purchasePrice,
          asset.residualValue,
          asset.expectedLifeMonths,
          asset.depreciationMethod
        );

        const depreciatingAsset = manager.create(DepreciatingAsset, {
          userId: options.userId,
          recordId: savedRecord.id,
          name: asset.name,
          category: asset.category as any,
          depreciationMethod: asset.depreciationMethod as any,
          purchasePrice: asset.purchasePrice,
          purchaseDate: asset.purchaseDate,
          expectedLifeMonths: asset.expectedLifeMonths,
          residualValue: asset.residualValue,
          currentValue: asset.purchasePrice,
          monthlyDepreciation,
          usedMonths: 0,
          status: 'active',
        });
        await manager.save(depreciatingAsset);
      }

      // 联动更新预算 spent（仅支出类型）
      if (options.type === 'expense') {
        const absAmount = Math.abs(options.amount);
        const recordDate = new Date(options.date);
        const budgetYear = recordDate.getFullYear();
        const budgetMonth = recordDate.getMonth() + 1;

        const budget = await manager.findOne(Budget, {
          where: {
            userId: options.userId,
            typeId: options.typeId,
            year: budgetYear,
            month: budgetMonth,
            budgetType: 'normal',
            isActive: true,
          },
        });

        if (budget) {
          budget.spent = Number(budget.spent) + absAmount;
          await manager.save(budget);
        }

        const totalBudget = await manager.findOne(Budget, {
          where: {
            userId: options.userId,
            year: budgetYear,
            month: budgetMonth,
            budgetType: 'normal',
            isActive: true,
            typeId: IsNull(),
          },
        });

        if (totalBudget) {
          totalBudget.spent = Number(totalBudget.spent) + absAmount;
          await manager.save(totalBudget);
        }
      }

      return savedRecord;
    });
  }

  async updateRecord(options: IUpdateRecordOptions): Promise<Record | null> {
    const record = await this.recordModel.findOne({ where: { id: options.id } });
    if (!record) {
      return null;
    }

    const oldType = record.type;
    const oldAmount = Number(record.amount);
    const oldAccountId = record.accountId;
    const oldToAccountId = record.toAccountId;

    if (options.typeId !== undefined) record.typeId = options.typeId;
    if (options.date !== undefined) record.date = options.date;
    if (options.amount !== undefined) record.amount = options.amount;
    if (options.type !== undefined) record.type = options.type;
    if (options.remark !== undefined) record.remark = options.remark;
    if (options.accountId !== undefined) record.accountId = options.accountId;
    if (options.toAccountId !== undefined) record.toAccountId = options.toAccountId;

    const savedRecord = await this.recordModel.save(record);

    // 回退旧记录对账户余额的影响
    if (oldAccountId) {
      const oldAccount = await this.accountModel.findOne({
        where: { id: oldAccountId, isDeleted: false }
      });
      if (oldAccount) {
        let oldToAccount: Account | null = null;
        if (oldToAccountId) {
          oldToAccount = await this.accountModel.findOne({
            where: { id: oldToAccountId, isDeleted: false }
          });
        }
        revertAccountBalance(oldAccount, oldToAccount, oldType, oldAmount);
        await this.accountModel.save(oldAccount);
        if (oldToAccount) {
          await this.accountModel.save(oldToAccount);
        }
      }
    }

    // 应用新记录对账户余额的影响
    const newAccountId = record.accountId;
    const newToAccountId = record.toAccountId;
    if (newAccountId) {
      const newAccount = await this.accountModel.findOne({
        where: { id: newAccountId, isDeleted: false }
      });
      if (newAccount) {
        let newToAccount: Account | null = null;
        if (newToAccountId) {
          newToAccount = await this.accountModel.findOne({
            where: { id: newToAccountId, isDeleted: false }
          });
        }
        calculateAccountBalance(newAccount, newToAccount, record.type, Number(record.amount));
        await this.accountModel.save(newAccount);
        if (newToAccount) {
          await this.accountModel.save(newToAccount);
        }
      }
    }

    // 回退旧预算 + 应用新预算（仅支出类型相关变更）
    const needsBudgetUpdate = options.type !== undefined || options.amount !== undefined
      || options.typeId !== undefined || options.date !== undefined;
    if (needsBudgetUpdate) {
      // 回退旧支出预算
      if (oldType === 'expense') {
        const oldAbsAmount = Math.abs(oldAmount);
        const oldRecordDate = new Date(record.date);
        const oldBudgetYear = options.date !== undefined ? new Date(options.date).getFullYear() : oldRecordDate.getFullYear();
        const oldBudgetMonth = options.date !== undefined ? new Date(options.date).getMonth() + 1 : oldRecordDate.getMonth() + 1;

        const oldTypeId = options.typeId !== undefined ? options.typeId : record.typeId;
        const oldBudget = await this.budgetModel.findOne({
          where: {
            typeId: oldTypeId,
            year: oldBudgetYear,
            month: oldBudgetMonth,
            budgetType: 'normal',
            isActive: true,
          },
        });
        if (oldBudget) {
          oldBudget.spent = Number(oldBudget.spent) - oldAbsAmount;
          await this.budgetModel.save(oldBudget);
        }

        const oldTotalBudget = await this.budgetModel.findOne({
          where: {
            year: oldBudgetYear,
            month: oldBudgetMonth,
            budgetType: 'normal',
            isActive: true,
            typeId: IsNull(),
          },
        });
        if (oldTotalBudget) {
          oldTotalBudget.spent = Number(oldTotalBudget.spent) - oldAbsAmount;
          await this.budgetModel.save(oldTotalBudget);
        }
      }

      // 应用新支出预算
      if (record.type === 'expense') {
        const newAbsAmount = Math.abs(Number(record.amount));
        const newRecordDate = new Date(record.date);
        const newBudgetYear = newRecordDate.getFullYear();
        const newBudgetMonth = newRecordDate.getMonth() + 1;

        const newBudget = await this.budgetModel.findOne({
          where: {
            typeId: record.typeId,
            year: newBudgetYear,
            month: newBudgetMonth,
            budgetType: 'normal',
            isActive: true,
          },
        });
        if (newBudget) {
          newBudget.spent = Number(newBudget.spent) + newAbsAmount;
          await this.budgetModel.save(newBudget);
        }

        const newTotalBudget = await this.budgetModel.findOne({
          where: {
            year: newBudgetYear,
            month: newBudgetMonth,
            budgetType: 'normal',
            isActive: true,
            typeId: IsNull(),
          },
        });
        if (newTotalBudget) {
          newTotalBudget.spent = Number(newTotalBudget.spent) + newAbsAmount;
          await this.budgetModel.save(newTotalBudget);
        }
      }
    }

    if (options.depreciatingAsset) {
      const asset = options.depreciatingAsset;
      const existing = await this.depreciatingAssetModel.findOne({
        where: { recordId: options.id }
      });

      const monthlyDepreciation = calculateMonthlyDepreciation(
        asset.purchasePrice,
        asset.residualValue,
        asset.expectedLifeMonths,
        asset.depreciationMethod
      );

      if (existing) {
        existing.name = asset.name;
        existing.category = asset.category as any;
        existing.depreciationMethod = asset.depreciationMethod as any;
        existing.purchasePrice = asset.purchasePrice;
        existing.purchaseDate = asset.purchaseDate;
        existing.expectedLifeMonths = asset.expectedLifeMonths;
        existing.residualValue = asset.residualValue;
        existing.monthlyDepreciation = monthlyDepreciation;
        await this.depreciatingAssetModel.save(existing);
      } else {
        const newAsset = this.depreciatingAssetModel.create({
          userId: record.userId,
          recordId: savedRecord.id,
          name: asset.name,
          category: asset.category as any,
          depreciationMethod: asset.depreciationMethod as any,
          purchasePrice: asset.purchasePrice,
          purchaseDate: asset.purchaseDate,
          expectedLifeMonths: asset.expectedLifeMonths,
          residualValue: asset.residualValue,
          currentValue: asset.purchasePrice,
          monthlyDepreciation,
          usedMonths: 0,
          status: 'active',
        });
        await this.depreciatingAssetModel.save(newAsset);
      }
    }

    return savedRecord;
  }

  async getRecordById(id: number): Promise<Record | null> {
    return this.recordModel.findOne({ where: { id } });
  }

  async getAllRecords(): Promise<Record[]> {
    return this.recordModel.find({
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async getRecordsByUserId(userId: number): Promise<Record[]> {
    return this.recordModel.find({
      where: { userId },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async deleteRecord(id: number): Promise<boolean> {
    const record = await this.recordModel.findOne({ where: { id } });
    if (!record) {
      return false;
    }

    // 回退账户余额
    if (record.accountId) {
      const account = await this.accountModel.findOne({
        where: { id: record.accountId, isDeleted: false }
      });
      if (account) {
        let toAccount: Account | null = null;
        if (record.toAccountId) {
          toAccount = await this.accountModel.findOne({
            where: { id: record.toAccountId, isDeleted: false }
          });
        }
        revertAccountBalance(account, toAccount, record.type, Number(record.amount));
        await this.accountModel.save(account);
        if (toAccount) {
          await this.accountModel.save(toAccount);
        }
      }
    }

    // 回退预算（仅支出类型）
    if (record.type === 'expense') {
      const absAmount = Math.abs(Number(record.amount));
      const recordDate = new Date(record.date);
      const budgetYear = recordDate.getFullYear();
      const budgetMonth = recordDate.getMonth() + 1;

      const budget = await this.budgetModel.findOne({
        where: {
          typeId: record.typeId,
          year: budgetYear,
          month: budgetMonth,
          budgetType: 'normal',
          isActive: true,
        },
      });
      if (budget) {
        budget.spent = Number(budget.spent) - absAmount;
        await this.budgetModel.save(budget);
      }

      const totalBudget = await this.budgetModel.findOne({
        where: {
          year: budgetYear,
          month: budgetMonth,
          budgetType: 'normal',
          isActive: true,
          typeId: IsNull(),
        },
      });
      if (totalBudget) {
        totalBudget.spent = Number(totalBudget.spent) - absAmount;
        await this.budgetModel.save(totalBudget);
      }
    }

    // 删除关联的折旧资产
    await this.depreciatingAssetModel.delete({ recordId: id });

    const result = await this.recordModel.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async getRecordsByAccountId(
    userId: number,
    accountId: number,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ account: any; monthlySummary: any; records: PageResult<any> }> {
    const account = await this.accountModel.findOne({
      where: { id: accountId, userId, isDeleted: false }
    });

    if (!account) {
      return null;
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthStart = `${currentMonth}-01`;
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];

    const monthResult = await this.recordModel
      .createQueryBuilder('record')
      .select('record.type', 'type')
      .addSelect('SUM(ABS(record.amount))', 'total')
      .where('record.userId = :userId', { userId })
      .andWhere('record.date BETWEEN :start AND :end', { start: monthStart, end: monthEnd })
      .andWhere(
        '(record.accountId = :accountId OR record.toAccountId = :accountId)',
        { accountId }
      )
      .groupBy('record.type')
      .getRawMany();

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    let monthlyAdjustmentIncrease = 0;
    let monthlyAdjustmentDecrease = 0;
    monthResult.forEach((row: any) => {
      if (row.type === 'income') {
        monthlyIncome = parseFloat(row.total) || 0;
      } else if (row.type === 'expense') {
        monthlyExpense = parseFloat(row.total) || 0;
      } else if (row.type === 'adjustment_increase') {
        monthlyAdjustmentIncrease = parseFloat(row.total) || 0;
      } else if (row.type === 'adjustment_decrease') {
        monthlyAdjustmentDecrease = parseFloat(row.total) || 0;
      }
    });

    const queryBuilder = this.recordModel
      .createQueryBuilder('record')
      .where('record.userId = :userId', { userId })
      .andWhere(
        '(record.accountId = :accountId OR record.toAccountId = :accountId)',
        { accountId }
      )
      .orderBy('record.date', 'DESC')
      .addOrderBy('record.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    const records = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const categoryIds = [...new Set(records.map(r => r.typeId))];
    const categories = await this.categoryModel.find({
      where: categoryIds.map(id => ({ id }))
    });
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    const iconIds = [...new Set(categories.map(c => c.iconId))];
    const icons = await this.iconModel.find({
      where: iconIds.map(id => ({ id }))
    });
    const iconMap = new Map(icons.map(i => [i.id, i]));

    const counterpartAccountIds: number[] = [];
    records.forEach(r => {
      if (r.type === 'transfer' || r.type === 'repayment') {
        if (r.accountId && r.accountId !== accountId) counterpartAccountIds.push(r.accountId);
        if (r.toAccountId && r.toAccountId !== accountId) counterpartAccountIds.push(r.toAccountId);
      }
    });
    const uniqueCounterpartIds = [...new Set(counterpartAccountIds)];
    const counterpartAccounts = uniqueCounterpartIds.length > 0
      ? await this.accountModel.find({ where: uniqueCounterpartIds.map(id => ({ id })) })
      : [];
    const counterpartMap = new Map(counterpartAccounts.map(a => [a.id, a]));

    const enrichedRecords = records.map(r => {
      const category = categoryMap.get(r.typeId);
      const icon = category ? iconMap.get(category.iconId) : null;

      let direction: 'out' | 'in' = 'out';
      let counterpartName = '';
      if (r.type === 'expense' || r.type === 'income') {
        direction = r.accountId === accountId ? 'out' : 'in';
      } else if (r.type === 'adjustment_increase') {
        direction = 'in';
      } else if (r.type === 'adjustment_decrease') {
        direction = 'out';
      } else if (r.type === 'transfer') {
        if (r.accountId === accountId) {
          direction = 'out';
          const cp = r.toAccountId ? counterpartMap.get(r.toAccountId) : null;
          counterpartName = cp ? cp.name : '';
        } else {
          direction = 'in';
          const cp = r.accountId ? counterpartMap.get(r.accountId) : null;
          counterpartName = cp ? cp.name : '';
        }
      } else if (r.type === 'repayment') {
        if (r.accountId === accountId) {
          direction = 'out';
          const cp = r.toAccountId ? counterpartMap.get(r.toAccountId) : null;
          counterpartName = cp ? cp.name : '';
        } else {
          direction = 'in';
          const cp = r.accountId ? counterpartMap.get(r.accountId) : null;
          counterpartName = cp ? cp.name : '';
        }
      }

      return {
        id: r.id,
        type: r.type,
        amount: r.amount,
        date: r.date,
        remark: r.remark,
        direction,
        categoryName: category?.name || '',
        categoryIcon: icon?.url || '',
        categoryIconType: icon?.iconType || 'emoji',
        counterpartAccountName: counterpartName,
        createdAt: r.createdAt,
      };
    });

    return {
      account: {
        id: account.id,
        name: account.name,
        icon: account.icon,
        type: account.type,
        balance: Number(account.balance),
      },
      monthlySummary: {
        income: monthlyIncome,
        expense: monthlyExpense,
        adjustmentIncrease: monthlyAdjustmentIncrease,
        adjustmentDecrease: monthlyAdjustmentDecrease,
      },
      records: {
        list: enrichedRecords,
        total,
        page,
        pageSize,
      },
    };
  }

  async getRecordsByMonth(
    userId: number,
    yearMonth: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<PageResult<Record>> {
    const startDate = `${yearMonth}-01`;
    const year = parseInt(yearMonth.split('-')[0]);
    const month = parseInt(yearMonth.split('-')[1]);
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    const queryBuilder = this.recordModel
      .createQueryBuilder('record')
      .where('record.userId = :userId', { userId })
      .andWhere('record.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('record.date', 'DESC')
      .addOrderBy('record.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    const list = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  async getMonthSummary(userId: number, yearMonth: string): Promise<MonthSummary> {
    const startDate = `${yearMonth}-01`;
    const year = parseInt(yearMonth.split('-')[0]);
    const month = parseInt(yearMonth.split('-')[1]);
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    const result = await this.recordModel
      .createQueryBuilder('record')
      .select('record.type', 'type')
      .addSelect('SUM(ABS(record.amount))', 'total')
      .where('record.userId = :userId', { userId })
      .andWhere('record.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('record.type IN (:...types)', { types: ['income', 'expense'] })
      .groupBy('record.type')
      .getRawMany();

    let income = 0;
    let expense = 0;

    result.forEach((row: any) => {
      if (row.type === 'income') {
        income = parseFloat(row.total) || 0;
      } else if (row.type === 'expense') {
        expense = parseFloat(row.total) || 0;
      }
    });

    return { income, expense };
  }

  async getDepreciatingAssets(userId: number): Promise<DepreciatingAsset[]> {
    return this.depreciatingAssetModel.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getDepreciatingAssetByRecordId(recordId: number): Promise<DepreciatingAsset | null> {
    return this.depreciatingAssetModel.findOne({ where: { recordId } });
  }

  async updateDepreciatingAsset(id: number, data: Partial<DepreciatingAsset>): Promise<void> {
    await this.depreciatingAssetModel.update(id, data);
  }

  async getYearlySummary(userId: number): Promise<YearlySummary> {
    const result = await this.recordModel
      .createQueryBuilder('record')
      .select('record.type', 'type')
      .addSelect('SUM(ABS(record.amount))', 'total')
      .where('record.userId = :userId', { userId })
      .andWhere('record.type IN (:...types)', { types: ['income', 'expense'] })
      .groupBy('record.type')
      .getRawMany();

    let totalIncome = 0;
    let totalExpense = 0;

    result.forEach((row: any) => {
      if (row.type === 'income') {
        totalIncome = parseFloat(row.total) || 0;
      } else if (row.type === 'expense') {
        totalExpense = parseFloat(row.total) || 0;
      }
    });

    return {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      totalBalance: Math.round((totalIncome - totalExpense) * 100) / 100,
    };
  }

  async getYearlyBills(userId: number): Promise<YearlyBill[]> {
    const result = await this.recordModel
      .createQueryBuilder('record')
      .select("strftime('%Y', record.date)", 'year')
      .addSelect('record.type', 'type')
      .addSelect('SUM(ABS(record.amount))', 'total')
      .where('record.userId = :userId', { userId })
      .andWhere('record.type IN (:...types)', { types: ['income', 'expense'] })
      .groupBy("strftime('%Y', record.date), record.type")
      .orderBy("strftime('%Y', record.date)", 'DESC')
      .getRawMany();

    const yearMap = new Map<number, { income: number; expense: number }>();

    result.forEach((row: any) => {
      const year = parseInt(row.year);
      if (!yearMap.has(year)) {
        yearMap.set(year, { income: 0, expense: 0 });
      }
      const entry = yearMap.get(year)!;
      if (row.type === 'income') {
        entry.income = parseFloat(row.total) || 0;
      } else if (row.type === 'expense') {
        entry.expense = parseFloat(row.total) || 0;
      }
    });

    return Array.from(yearMap.entries())
      .map(([year, data]) => ({
        year,
        income: Math.round(data.income * 100) / 100,
        expense: Math.round(data.expense * 100) / 100,
        balance: Math.round((data.income - data.expense) * 100) / 100,
      }))
      .sort((a, b) => b.year - a.year);
  }

  async getLatestRecord(userId: number): Promise<Record | null> {
    return this.recordModel.findOne({
      where: { userId },
      order: { createdAt: 'DESC' } as any,
    });
  }

  async getNearestMonth(
    userId: number,
    yearMonth: string,
    direction: 'prev' | 'next'
  ): Promise<string | null> {
    const [year, month] = yearMonth.split('-').map(Number);

    if (direction === 'prev') {
      const pivotDate = `${yearMonth}-01`;
      const result = await this.recordModel
        .createQueryBuilder('record')
        .select("TO_CHAR(record.date, 'YYYY-MM')", 'yearMonth')
        .where('record.userId = :userId', { userId })
        .andWhere('record.date < :pivotDate', { pivotDate })
        .groupBy("TO_CHAR(record.date, 'YYYY-MM')")
        .orderBy('"yearMonth"', 'DESC')
        .limit(1)
        .getRawOne();
      return result?.yearMonth || null;
    } else {
      const lastDay = new Date(year, month, 0).getDate();
      const pivotDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
      const result = await this.recordModel
        .createQueryBuilder('record')
        .select("TO_CHAR(record.date, 'YYYY-MM')", 'yearMonth')
        .where('record.userId = :userId', { userId })
        .andWhere('record.date > :pivotDate', { pivotDate })
        .groupBy("TO_CHAR(record.date, 'YYYY-MM')")
        .orderBy('"yearMonth"', 'ASC')
        .limit(1)
        .getRawOne();
      return result?.yearMonth || null;
    }
  }
}