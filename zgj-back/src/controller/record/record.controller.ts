import { Inject, Controller, Post, Body, Put, Param, Get, Del } from '@midwayjs/core';
import type { Context } from '@midwayjs/koa';
import { RecordService } from '../../service/record.service';
import type { ICreateRecordOptions, IUpdateRecordOptions } from '../../interface';

@Controller('/record')
export class RecordController {
  @Inject()
  ctx: Context;

  @Inject()
  recordService: RecordService;

  /**
   * 新增记账记录
   * POST /record
   */
  @Post('/')
  async createRecord(@Body() options: ICreateRecordOptions) {
    try {
      const userId = (this.ctx.state.user as any)?.userId;
      if (!userId) {
        return {
          success: false,
          message: '用户未登录',
        };
      }
      const record = await this.recordService.createRecord({
        ...options,
        userId,
      });
      return {
        success: true,
        message: '创建成功',
        data: record,
      };
    } catch (error) {
      return {
        success: false,
        message: '创建失败',
        error: error.message,
      };
    }
  }

  /**
   * 更新记账记录
   * PUT /record/:id
   */
  @Put('/:id')
  async updateRecord(
    @Param('id') id: string,
    @Body() options: Omit<IUpdateRecordOptions, 'id'>
  ) {
    try {
      const record = await this.recordService.updateRecord({
        id: parseInt(id),
        ...options,
      });
      if (!record) {
        return {
          success: false,
          message: '记录不存在',
        };
      }
      return {
        success: true,
        message: '更新成功',
        data: record,
      };
    } catch (error) {
      return {
        success: false,
        message: '更新失败',
        error: error.message,
      };
    }
  }

  /**
   * 获取单个记账记录
   * GET /record/:id
   */
  @Get('/:id')
  async getRecord(@Param('id') id: string) {
    try {
      const record = await this.recordService.getRecordById(parseInt(id));
      if (!record) {
        return {
          success: false,
          message: '记录不存在',
        };
      }
      return {
        success: true,
        message: '获取成功',
        data: record,
      };
    } catch (error) {
      return {
        success: false,
        message: '获取失败',
        error: error.message,
      };
    }
  }

  /**
   * 获取所有记账记录（当前用户）
   * GET /record
   */
  @Get('/')
  async getAllRecords() {
    try {
      const userId = (this.ctx.state.user as any)?.userId;
      if (!userId) {
        return {
          success: false,
          message: '用户未登录',
        };
      }
      const records = await this.recordService.getRecordsByUserId(userId);
      return {
        success: true,
        message: '获取成功',
        data: records,
      };
    } catch (error) {
      return {
        success: false,
        message: '获取失败',
        error: error.message,
      };
    }
  }

  /**
   * 删除记账记录
   * DELETE /record/:id
   */
  @Del('/:id')
  async deleteRecord(@Param('id') id: string) {
    try {
      const success = await this.recordService.deleteRecord(parseInt(id));
      if (!success) {
        return {
          success: false,
          message: '记录不存在',
        };
      }
      return {
        success: true,
        message: '删除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: '删除失败',
        error: error.message,
      };
    }
  }
}
