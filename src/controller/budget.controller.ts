import { Inject, Controller, Post, Body, Put, Param, Get, Del, Query } from '@midwayjs/core';
import type { Context } from '@midwayjs/koa';
import { BudgetService } from '../service/budget.service';

@Controller('/api/budgets')
export class BudgetController {
  @Inject()
  ctx: Context;

  @Inject()
  budgetService: BudgetService;

  @Post('/')
  async create(@Body() body: any) {
    try {
      const userId = (this.ctx.state.user as any)?.userId;
      if (!userId) {
        return { success: false, message: '用户未登录' };
      }
      const budget = await this.budgetService.createBudget({
        ...body,
        userId,
      });
      return { success: true, message: '预算创建成功', data: budget };
    } catch (error: any) {
      return { success: false, message: '创建失败', error: error.message };
    }
  }

  @Post('/yearly/batch')
  async createYearlyBatch(@Body() body: any) {
    try {
      const userId = (this.ctx.state.user as any)?.userId;
      if (!userId) {
        return { success: false, message: '用户未登录' };
      }
      const budgets = await this.budgetService.createYearlyBatch({
        ...body,
        userId,
      });
      return { success: true, message: '批量创建成功', data: budgets };
    } catch (error: any) {
      return { success: false, message: '批量创建失败', error: error.message };
    }
  }

  @Get('/annual-summary')
  async annualSummary(@Query('year') year: string) {
    try {
      const userId = (this.ctx.state.user as any)?.userId;
      if (!userId) {
        return { success: false, message: '用户未登录' };
      }
      const yearNum = Number(year) || new Date().getFullYear();
      const summary = await this.budgetService.getAnnualSummary(userId, yearNum);
      return { success: true, data: summary };
    } catch (error: any) {
      return { success: false, message: '查询年度预算失败', error: error.message };
    }
  }

  @Put('/:id')
  async update(@Param('id') id: string, @Body() body: any) {
    try {
      const userId = (this.ctx.state.user as any)?.userId;
      if (!userId) {
        return { success: false, message: '用户未登录' };
      }
      const budget = await this.budgetService.updateBudget({
        id: parseInt(id),
        ...body,
      });
      if (!budget) {
        return { success: false, message: '预算不存在' };
      }
      return { success: true, message: '更新成功', data: budget };
    } catch (error: any) {
      return { success: false, message: '更新失败', error: error.message };
    }
  }

  @Del('/:id')
  async delete(@Param('id') id: string) {
    try {
      const userId = (this.ctx.state.user as any)?.userId;
      if (!userId) {
        return { success: false, message: '用户未登录' };
      }
      const ok = await this.budgetService.deleteBudget(parseInt(id));
      return { success: ok, message: ok ? '删除成功' : '预算不存在' };
    } catch (error: any) {
      return { success: false, message: '删除失败', error: error.message };
    }
  }

  @Post('/list')
  async list(@Body() body: any) {
    try {
      const userId = (this.ctx.state.user as any)?.userId;
      if (!userId) {
        return { success: false, message: '用户未登录' };
      }
      const { year, month } = body;
      const budgets = await this.budgetService.getBudgets(
        userId,
        Number(year) || new Date().getFullYear(),
        Number(month) || (new Date().getMonth() + 1)
      );
      const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0);
      const totalUsed = budgets.reduce((s, b) => s + Number(b.spent), 0);
      return {
        success: true,
        data: {
          totalBudget: Math.round(totalBudget * 100) / 100,
          totalUsed: Math.round(totalUsed * 100) / 100,
          totalRemaining: Math.round((totalBudget - totalUsed) * 100) / 100,
          budgets,
        },
      };
    } catch (error: any) {
      return { success: false, message: '查询失败', error: error.message };
    }
  }

  @Get('/overview/current')
  async currentOverview() {
    try {
      const userId = (this.ctx.state.user as any)?.userId;
      if (!userId) {
        return { success: false, message: '用户未登录' };
      }
      const overview = await this.budgetService.getCurrentOverview(userId);
      return {
        success: true,
        data: overview,
      };
    } catch (error: any) {
      return { success: false, message: '查询失败', error: error.message };
    }
  }

  @Post('/copy-month')
  async copyMonth(@Body() body: any) {
    try {
      const userId = (this.ctx.state.user as any)?.userId;
      if (!userId) {
        return { success: false, message: '用户未登录' };
      }
      const { year, month } = body;
      const budgets = await this.budgetService.copyBudgetsToMonth(userId, year, month);
      return {
        success: true,
        message: budgets.length > 0 ? '复制成功' : '当月已有预算或上月无基础预算',
        data: budgets,
      };
    } catch (error: any) {
      return { success: false, message: '复制失败', error: error.message };
    }
  }
}
