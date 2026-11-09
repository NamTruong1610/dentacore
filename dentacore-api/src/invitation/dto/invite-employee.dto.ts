import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class InviteEmployeeDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value?.trim()))
  email: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value?.trim()))
  employeeNumber: string;
  firstName: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value?.trim()))
  middleName: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value?.trim()))
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value?.trim()))
  inviteToken: string;
}