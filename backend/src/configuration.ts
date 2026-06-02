import { Configuration, App, CommonJSFileDetector, IMidwayContainer } from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as validation from '@midwayjs/validation';
import * as info from '@midwayjs/info';
import * as typeorm from '@midwayjs/typeorm';
import { join } from 'path';
import { ReportMiddleware } from './middleware/report.middleware';
import { JwtMiddleware } from './middleware/jwt.middleware';
import { CategoryService } from './service/category.service';
const bodyParser = require('koa-bodyparser');

@Configuration({
  imports: [
    koa,
    validation,
    typeorm,
    {
      component: info,
      enabledEnvironment: ['local'],
    },
  ],
  importConfigs: [join(__dirname, './config')],
  detector: new CommonJSFileDetector(),
})
export class MainConfiguration {
  @App('koa')
  app: koa.Application;

  async onReady(container: IMidwayContainer) {
    this.app.use(bodyParser());

    this.app.use(async (ctx: any, next: any) => {
      ctx.set('Access-Control-Allow-Origin', '*');
      ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (ctx.method === 'OPTIONS') {
        ctx.status = 204;
        return;
      }

      await next();
    });

    this.app.useMiddleware([ReportMiddleware, JwtMiddleware]);

    console.log('[启动] 开始检查并初始化全局数据...');
    await this.seedGlobalData(container);
  }

  async onServerReady() {
    console.log('[启动] 服务已就绪');
  }

  private async seedGlobalData(container: IMidwayContainer) {
    try {
      const categoryService = await container.getAsync(CategoryService);
      await categoryService.seedGlobalData();
      console.log('[启动] 全局数据检查完成');
    } catch (error) {
      console.error('[启动] 全局数据初始化失败:', error);
    }
  }
}
