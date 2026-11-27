import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class InviteEmployeeDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value?.trim()))
  email: string;
}