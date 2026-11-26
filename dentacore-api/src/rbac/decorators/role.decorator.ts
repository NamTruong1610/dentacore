import { SetMetadata } from '@nestjs/common';

export const IS_EMPLOYEE_KEY = 'isEmployee';
export const Public = () => SetMetadata(IS_EMPLOYEE_KEY, true);