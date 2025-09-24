import { SetMetadata } from '@nestjs/common';

export const RequireModule = (moduleKey: string) => SetMetadata('required_module', moduleKey);