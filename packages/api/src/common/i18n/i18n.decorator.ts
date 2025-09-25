import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Locale = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.locale || 'zh-CN';
  },
);
