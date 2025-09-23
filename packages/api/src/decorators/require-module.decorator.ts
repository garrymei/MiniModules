import { SetMetadata } from '@nestjs/common';

export const MODULE_KEY = 'moduleKey';

export const RequireModule = (moduleKey: string) => SetMetadata(MODULE_KEY, moduleKey);
