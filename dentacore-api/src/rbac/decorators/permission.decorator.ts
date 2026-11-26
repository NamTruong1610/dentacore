import { SetMetadata } from '@nestjs/common';

export const RequirePermission = (action: string, target: string) => SetMetadata('permission', { action, target });