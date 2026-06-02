import { Controller, Get, Post, Put, Del, Inject, Body, Param } from '@midwayjs/core';
import type { Context } from '@midwayjs/koa';
import { AccountService } from '../../service/account.service';
import type { AccountRequest } from '../../service/account.service';
import { Account } from '../../entity/account.entity';

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

interface CreateImplicitAccountRequest {
  type: 'receivable' | 'payable';
  counterparty: string;
}

interface ImplicitAccountResponse {
  accountId: string;
  name: string;
  type: 'receivable' | 'payable';
  isNew: boolean;
}

@Controller('/api/accounts')
export class AccountController {
  @Inject()
  accountService: AccountService;

  @Inject()
  ctx: Context;

  /**
   * 迁移旧emoji图标为SVG类名
   */
  @Post('/migrate-icons')
  async migrateIcons(): Promise<IApiResponse> {
    try {
      const userId = this.ctx.state.user?.userId;
      if (!userId) {
        return {
          success: false,
          message: '请先登录'
        };
      }

      const result = await this.accountService.migrateEmojiToSvg();
      return {
        success: true,
        data: result,
        message: `迁移完成：共${result.total}个账户，成功迁移${result.migrated}个`
      };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message
      };
    }
  }

  /**
   * 获取账户列表
   */
  @Get('/')
  async getAccountList(): Promise<IApiResponse<Account[]>> {
    try {
      const userId = this.ctx.state.user?.userId;
      if (!userId) {
        return {
          success: false,
          message: '请先登录'
        };
      }

      const accounts = await this.accountService.getAccountsByUserId(userId);
      return {
        success: true,
        data: accounts
      };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message
      };
    }
  }

  /**
   * 获取账户详情
   */
  @Get('/:id')
  async getAccountDetail(@Param('id') id: string): Promise<IApiResponse<Account>> {
    try {
      const userId = this.ctx.state.user?.userId;
      if (!userId) {
        return {
          success: false,
          message: '请先登录'
        };
      }

      const account = await this.accountService.getAccountById(Number(id), userId);
      if (!account) {
        return {
          success: false,
          message: '账户不存在'
        };
      }

      return {
        success: true,
        data: account
      };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message
      };
    }
  }

  /**
   * 创建账户
   */
  @Post('/')
  async createAccount(@Body() data: AccountRequest): Promise<IApiResponse<Account>> {
    try {
      const userId = this.ctx.state.user?.userId;
      if (!userId) {
        return {
          success: false,
          message: '请先登录'
        };
      }

      // 验证必填字段
      if (!data.name || !data.icon || !data.type) {
        return {
          success: false,
          message: '请填写完整信息'
        };
      }

      const account = await this.accountService.createAccount(userId, data);
      return {
        success: true,
        data: account,
        message: '创建成功'
      };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message
      };
    }
  }

  /**
   * 更新账户
   */
  @Put('/:id')
  async updateAccount(
    @Param('id') id: string,
    @Body() data: AccountRequest
  ): Promise<IApiResponse<Account>> {
    try {
      const userId = this.ctx.state.user?.userId;
      if (!userId) {
        return {
          success: false,
          message: '请先登录'
        };
      }

      // 验证必填字段
      if (!data.name || !data.icon || !data.type) {
        return {
          success: false,
          message: '请填写完整信息'
        };
      }

      const account = await this.accountService.updateAccount(Number(id), userId, data);
      if (!account) {
        return {
          success: false,
          message: '账户不存在'
        };
      }

      return {
        success: true,
        data: account,
        message: '更新成功'
      };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message
      };
    }
  }

  /**
   * 删除账户
   */
  @Del('/:id')
  async deleteAccount(@Param('id') id: string): Promise<IApiResponse> {
    try {
      const userId = this.ctx.state.user?.userId;
      if (!userId) {
        return {
          success: false,
          message: '请先登录'
        };
      }

      const result = await this.accountService.deleteAccount(Number(id), userId);
      if (!result) {
        return {
          success: false,
          message: '账户不存在或默认账户不可删除'
        };
      }

      return {
        success: true,
        message: '删除成功'
      };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message
      };
    }
  }

  /**
   * 获取隐式账户列表（应收账款/应付账款）
   */
  @Get('/implicit')
  async getImplicitAccounts(): Promise<IApiResponse<Account[]>> {
    try {
      const userId = this.ctx.state.user?.userId;
      if (!userId) {
        return {
          success: false,
          message: '请先登录'
        };
      }

      const accounts = await this.accountService.getImplicitAccounts(userId);
      return {
        success: true,
        data: accounts
      };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message
      };
    }
  }

  /**
   * 创建/获取隐式账户（应收/应付）
   */
  @Post('/implicit')
  async createImplicitAccount(@Body() data: CreateImplicitAccountRequest): Promise<IApiResponse<ImplicitAccountResponse>> {
    try {
      const userId = this.ctx.state.user?.userId;
      if (!userId) {
        return {
          success: false,
          message: '请先登录'
        };
      }

      if (!data.type || !data.counterparty) {
        return {
          success: false,
          message: '请填写完整信息'
        };
      }

      const result = await this.accountService.createImplicitAccount(userId, data.type, data.counterparty);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message
      };
    }
  }

  /**
   * 获取借贷对方列表
   */
  @Get('/counterparties')
  async getCounterparties(): Promise<IApiResponse<string[]>> {
    try {
      const userId = this.ctx.state.user?.userId;
      if (!userId) {
        return {
          success: false,
          message: '请先登录'
        };
      }

      const counterparties = await this.accountService.getCounterparties(userId);
      return {
        success: true,
        data: counterparties
      };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message
      };
    }
  }
}
