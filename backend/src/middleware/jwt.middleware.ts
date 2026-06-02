import { Middleware, IMiddleware } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import { AuthService } from '../service/auth.service';

@Middleware()
export class JwtMiddleware implements IMiddleware<Context, NextFunction> {
  match(ctx: Context) {
    if (ctx.method === 'OPTIONS') return false;
    return true;
  }

  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const path = ctx.path;

      // 白名单路径直接放行
      const publicPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/send-sms', '/api/auth/reset-password', '/health', '/', '/api/ads/splash'];
      const isPublic = publicPaths.some(p => path === p || path.startsWith(p + '/'));
      if (isPublic) {
        await next();
        return;
      }
      
      // 不需要登录的 category 路径直接放行
      if (path.startsWith('/api/category/') && 
          !path.startsWith('/api/category/user') && 
          !path.startsWith('/api/category/group/')) {
        await next();
        return;
      }
      
      const authHeader = ctx.headers['authorization'];

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[JWT Middleware] 未找到Authorization header');
        ctx.status = 401;
        ctx.body = {
          success: false,
          message: '未提供认证令牌',
        };
        return;
      }

      const token = authHeader.substring(7);
      console.log('[JWT Middleware] 提取的token:', token.substring(0, 20) + '...');

      try {
        const authService = await ctx.requestContext.getAsync(AuthService);
        const payload = authService.verifyToken(token);
        console.log('[JWT Middleware] 验证成功，payload:', payload);

        const user = await authService.getUserById(payload.userId);
        if (!user) {
          console.log('[JWT Middleware] 用户不存在，userId:', payload.userId);
          ctx.status = 401;
          ctx.body = {
            success: false,
            message: '用户不存在或已被删除',
          };
          return;
        }

        ctx.state.user = payload;
        await next();
      } catch (error) {
        console.log('[JWT Middleware] 验证失败:', error);
        ctx.status = 401;
        ctx.body = {
          success: false,
          message: '令牌无效或已过期',
        };
      }
    };
  }
}
