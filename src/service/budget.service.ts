import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Budget } from '../entity/budget.entity';

export interface CreateBudgetOptions {
  userId: number;
  name: string;
  typeId?: number;
  categoryGroupId?: number;
  periodType?: 'monthly' | 'quarterly' | 'yearly';
  year: number;
  month: number;
  amount: number;
  alertThreshold?: number;
  alertEnabled?: boolean;
}

export interface CreateYearlyBatchOptions {
  userId: number;
  year: number;
  budgets: Array<{
    typeId?: number;
    yearlyAmount: number;
    alertThreshold?: number;
  }>;
}

export interface UpdateBudgetOptions {
  id: number;
  name?: string;
  amount?: number;
  alertThreshold?: number;
  alertEnabled?: boolean;
  isActive?: boolean;
}

export interface BudgetOverview {
  year: number;
  month: number;
  daysInMonth: number;
  currentDay: number;
  totalBudget: number;
  totalUsed: number;
  totalRemaining: number;
  usedPercentage: number;
  dailyAverage: number;
  projectedMonthEnd: number;
  budgets: Array<{
    id: number;
    name: string;
    typeId: number | null;
    amount: number;
    spent: number;
    remainingAmount: number;
    usedPercentage: number;
    alertStatus: 'healthy' | 'normal' | 'warning' | 'danger';
  }>;
}

export interface AnnualBudgetItem {
  typeId: number | null;
  yearlyAmount: number;
  monthlyAmount: number;
  totalSpent: number;
  months: Array<{
    month: number;
    budgetId: number | null;
    amount: number;
    spent: number;
  }>;
}

export interface AnnualBudgetSummary {
  year: number;
  totalYearlyBudget: number;
  totalYearlySpent: number;
  items: AnnualBudgetItem[];
}

function getAlertStatus(spent: number, amount: number, threshold: number): 'healthy' | 'normal' | 'warning' | 'danger' {
  if (amount <= 0) return 'healthy';
  const pct = (spent / amount) * 100;
  if (pct >= 100) return 'danger';
  if (pct >= threshold) return 'warning';
  if (pct >= 60) return 'normal';
  return 'healthy';
}

@Provide()
export class BudgetService {
  @InjectEntityModel(Budget)
  budgetModel: Repository<Budget>;

  async createBudget(options: CreateBudgetOptions): Promise<Budget> {
    const budget = this.budgetModel.create({
      userId: options.userId,
      budgetType: 'normal',
      name: options.name,
      typeId: options.typeId ?? null,
      categoryGroupId: options.categoryGroupId ?? null,
      periodType: options.periodType ?? 'monthly',
      year: options.year,
      month: options.month,
      amount: options.amount,
      isBase: true,
      spent: 0,
      alertThreshold: options.alertThreshold ?? 80,
      alertEnabled: options.alertEnabled ?? true,
      isActive: true,
    });
    return this.budgetModel.save(budget);
  }

  async createYearlyBatch(options: CreateYearlyBatchOptions): Promise<Budget[]> {
    const budgets: Budget[] = [];
    for (let month = 1; month <= 12; month++) {
      for (const b of options.budgets) {
        const monthlyAmount = Math.round((b.yearlyAmount / 12) * 100) / 100;
        const budget = this.budgetModel.create({
          userId: options.userId,
          budgetType: 'normal',
          name: b.typeId != null ? '分类预算' : '月度总预算',
          typeId: b.typeId ?? null,
          periodType: 'monthly',
          year: options.year,
          month,
          amount: monthlyAmount,
          isBase: true,
          spent: 0,
          alertThreshold: b.alertThreshold ?? 80,
          alertEnabled: true,
          isActive: true,
        });
        budgets.push(budget);
      }
    }
    return this.budgetModel.save(budgets);
  }

  async updateBudget(options: UpdateBudgetOptions): Promise<Budget | null> {
    const budget = await this.budgetModel.findOne({ where: { id: options.id } });
    if (!budget) return null;

    if (options.name !== undefined) budget.name = options.name;
    if (options.amount !== undefined) budget.amount = options.amount;
    if (options.alertThreshold !== undefined) budget.alertThreshold = options.alertThreshold;
    if (options.alertEnabled !== undefined) budget.alertEnabled = options.alertEnabled;
    if (options.isActive !== undefined) budget.isActive = options.isActive;

    return this.budgetModel.save(budget);
  }

  async deleteBudget(id: number): Promise<boolean> {
    const result = await this.budgetModel.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async getBudgets(userId: number, year: number, month: number): Promise<Budget[]> {
    return this.budgetModel.find({
      where: { userId, year, month, budgetType: 'normal', isActive: true },
      order: { typeId: 'ASC' },
    });
  }

  async getBudgetById(id: number): Promise<Budget | null> {
    return this.budgetModel.findOne({ where: { id } });
  }

  async getCurrentOverview(userId: number): Promise<BudgetOverview | null> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const currentDay = now.getDate();
    const daysInMonth = new Date(year, month, 0).getDate();

    const budgets = await this.budgetModel.find({
      where: { userId, year, month, budgetType: 'normal', isActive: true },
    });

    if (budgets.length === 0) return null;

    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalUsed = budgets.reduce((sum, b) => sum + Number(b.spent), 0);
    const totalRemaining = totalBudget - totalUsed;
    const usedPercentage = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 10000) / 100 : 0;
    const dailyAverage = daysInMonth - currentDay > 0
      ? Math.round((totalRemaining / (daysInMonth - currentDay)) * 100) / 100
      : totalRemaining;
    const projectedMonthEnd = Math.round((totalBudget - (totalUsed / currentDay) * daysInMonth) * 100) / 100;

    return {
      year,
      month,
      daysInMonth,
      currentDay,
      totalBudget: Math.round(totalBudget * 100) / 100,
      totalUsed: Math.round(totalUsed * 100) / 100,
      totalRemaining: Math.round(totalRemaining * 100) / 100,
      usedPercentage,
      dailyAverage,
      projectedMonthEnd,
      budgets: budgets.map((b) => {
        const spent = Number(b.spent);
        const amount = Number(b.amount);
        return {
          id: b.id,
          name: b.name,
          typeId: b.typeId,
          amount: Math.round(amount * 100) / 100,
          spent: Math.round(spent * 100) / 100,
          remainingAmount: Math.round((amount - spent) * 100) / 100,
          usedPercentage: amount > 0 ? Math.round((spent / amount) * 10000) / 100 : 0,
          alertStatus: getAlertStatus(spent, amount, b.alertThreshold),
        };
      }),
    };
  }

  async updateSpent(
    userId: number,
    typeId: number,
    year: number,
    month: number,
    delta: number,
    manager?: any
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Budget) : this.budgetModel;

    const budget = await repo.findOne({
      where: { userId, typeId, year, month, budgetType: 'normal', isActive: true },
    });

    if (budget) {
      budget.spent = Number(budget.spent) + delta;
      if (budget.spent < 0) budget.spent = 0;
      await repo.save(budget);
    }

    const totalBudget = await repo.findOne({
      where: { userId, year, month, budgetType: 'normal', isActive: true, typeId: IsNull() },
    });

    if (totalBudget) {
      totalBudget.spent = Number(totalBudget.spent) + delta;
      if (totalBudget.spent < 0) totalBudget.spent = 0;
      await repo.save(totalBudget);
    }
  }

  async getAnnualSummary(userId: number, year: number): Promise<AnnualBudgetSummary> {
    const budgets = await this.budgetModel.find({
      where: { userId, year, budgetType: 'normal', isActive: true },
      order: { month: 'ASC' },
    });

    const typeMap = new Map<string, { budgets: Budget[] }>();

    for (const b of budgets) {
      const key = b.typeId === null ? '__total__' : String(b.typeId);
      if (!typeMap.has(key)) {
        typeMap.set(key, { budgets: [] });
      }
      typeMap.get(key)!.budgets.push(b);
    }

    let totalYearlyBudget = 0;
    let totalYearlySpent = 0;

    const items: AnnualBudgetItem[] = [];

    for (const [, group] of typeMap) {
      const first = group.budgets[0];
      const yearlyAmount = Math.round(group.budgets.reduce((s, b) => s + Number(b.amount), 0) * 100) / 100;
      const monthlyAmount = first ? Math.round(Number(first.amount) * 100) / 100 : 0;
      const totalSpent = Math.round(group.budgets.reduce((s, b) => s + Number(b.spent), 0) * 100) / 100;

      totalYearlyBudget += yearlyAmount;
      totalYearlySpent += totalSpent;

      items.push({
        typeId: first.typeId,
        yearlyAmount,
        monthlyAmount,
        totalSpent,
        months: group.budgets.map((b) => ({
          month: b.month,
          budgetId: b.id,
          amount: Number(b.amount),
          spent: Number(b.spent),
        })),
      });
    }

    return {
      year,
      totalYearlyBudget: Math.round(totalYearlyBudget * 100) / 100,
      totalYearlySpent: Math.round(totalYearlySpent * 100) / 100,
      items,
    };
  }

  async copyBudgetsToMonth(userId: number, year: number, month: number): Promise<Budget[]> {
    const existing = await this.budgetModel.find({
      where: { userId, year, month, budgetType: 'normal' },
    });

    if (existing.length > 0) return [];

    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;

    const baseBudgets = await this.budgetModel.find({
      where: { userId, year: previousYear, month: previousMonth, budgetType: 'normal', isBase: true, isActive: true },
    });

    if (baseBudgets.length === 0) return [];

    const newBudgets = baseBudgets.map((b) =>
      this.budgetModel.create({
        userId: b.userId,
        budgetType: b.budgetType,
        name: b.name,
        typeId: b.typeId,
        categoryGroupId: b.categoryGroupId,
        periodType: b.periodType,
        year,
        month,
        amount: b.amount,
        isBase: true,
        spent: 0,
        alertThreshold: b.alertThreshold,
        alertEnabled: b.alertEnabled,
        isActive: true,
      })
    );

    return this.budgetModel.save(newBudgets);
  }
}
